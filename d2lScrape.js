/*eslint-env node, browser*/
/*eslint no-console:0, no-unused-vars:0, no-undef:02*/
/*global async, URI*/
/*
Dependencies that need to be on the page
    async.js lib 
        site: https://caolan.github.io/async/
        github: https://github.com/caolan/async
        cdn: https://cdnjs.cloudflare.com/ajax/libs/async/2.5.0/async.min.js
    URI.js
        site: https://medialize.github.io/URI.js/
        github: https://github.com/medialize/URI.js
        cdn: https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min.js
*/

var d2lScrape = (function () {
    //when true this console.logs all the crawling steps
    var showCrawlingSteps = false;
    //When true this console.logs all the urls that are filtered out
    var showDroppedUrls = false;

    function removeDuplicates(url, index, array) {
        return array.indexOf(url) === index;
    }

    function makeRequestErrorObj(request) {
        return {
            status: request.status,
            statusText: request.statusText,
            responseText: request.responseText,
            responseURL: request.responseURL
        }
    }

    function getCourseInfo(orgUnitId, getcourseInfoCallback) {
        var pathxhr = new XMLHttpRequest();
        pathxhr.open("GET", "/d2l/api/lp/1.15/courses/" + orgUnitId)
        pathxhr.onload = function () {
            if (pathxhr.status == 200) {
                var info = JSON.parse(pathxhr.response);
                getcourseInfoCallback(null, info);
            } else {
                getcourseInfoCallback(makeRequestErrorObj(pathxhr), null)
            }

        }
        pathxhr.send();
    }

    /*********************************************
     *********************************************
     * 1,2 Get topics from the course's Table of Contents
     * This function is called by getCourseHtmlPages but is also exposed through the api 
     **********************************************
     **********************************************/
    function getTopicsWithUrlFromToc(orgUnitId, getTopicsFromTocCallback) {
        var toc, topics;

        /*********************************************
         * 1 Retrieve table of contents for the specified orgUnitId 
         **********************************************/
        function getToc(orgUnitId, getTocCallback) {
            var tocxhr = new XMLHttpRequest();
            tocxhr.open("GET", "/d2l/api/le/1.15/" + orgUnitId + "/content/toc")
            tocxhr.onload = function () {
                if (tocxhr.status == 200) {
                    getTocCallback(null, JSON.parse(tocxhr.response));
                } else {
                    getTocCallback(makeRequestErrorObj(tocxhr), null);
                }

            }
            tocxhr.send();
        }


        /*********************************************
         * 2 Takes the toc and flatens it to an array of topics
         **********************************************/
        function TOC2Topics(toc, courseInfo) {
            var topicsOut;

            function getURLFromTopic(topic, courseInfo) {
                //some are set to null and I want to pass that info on to user
                if (topic.Url === null) {
                    return null;
                }

                //make the url absolute
                var path,
                    origin = new URI(window.location.href).origin(),
                    url;

                //the URI lib throws errors if the url is not a url.
                //example href="width:100%", 'width:100%' is not a url but is in a place that should be a url
                //so catch the error and don't do anything to it but print it for fun. it will get filtered out later
                try {
                    url = new URI(topic.Url);

                    //if the url is relative make it absolute
                    if (url.is('relative')) {
                        /* We have html files with '#' in their name, # is normally reserved for hashs in urls
                         * thus in the content area there are '#' in the middle of urls that need to be encoded
                         * but libraries don't encode # by default, so we do it before we stick it in
                         */

                        //fix file names with `#` in them
                        //the # sign does not get encoded even though its in the middle of the file
                        if (topic.Title.match(/#/g) !== null) {
                            path = topic.Url.replace(/#/g, '%23');
                        }

                        //fix scorm paths - scorm paths don't have the course path on it
                        if (topic.TypeIdentifier.match(/scorm/i) !== null) {
                            if (typeof path !== 'undefined') {
                                path = courseInfo.Path + path;
                            } else {
                                path = courseInfo.Path + topic.Url;
                            }
                        }

                        //if we did either of the things above then make it a URI obj;
                        if (typeof path !== 'undefined') {
                            url = new URI(path);
                        }

                        //the url is relative make it absolute now
                        url.absoluteTo(origin);
                    }

                    //we need a string to send on
                    url = url.normalize().toString();
                } catch (error) {
                    //if the url is not realy a url catch the error and send on the url
                    console.warn("Problem with url in toc:", url);
                    console.warn("Course Name:", courseInfo.Name)
                    console.error(error);
                    return topic.Url;
                }



                //for testing
                if (false && topic.Url.match('#') !== null) {
                    console.dir(url);
                }

                if (false && topic.TypeIdentifier.match(/scorm/i) !== null) {
                    console.dir(topic.Url);
                    console.dir(path);
                }

                return url;
            }


            function proccssTopics(topics, courseInfo) {
                return topics
                    //make sure the topic has a url
                    .filter(function (topic) {
                        return typeof topic.Url !== 'undefined';
                    })
                    //get the props we want
                    .map(function (topic) {
                        return {
                            title: topic.Title,
                            url: getURLFromTopic(topic, courseInfo),
                            topicId: topic.TopicId,
                            type: topic.TypeIdentifier
                        }
                    });
            }

            /********************** TOC2Topics START *****************************/

            topicsOut = toc.Modules.reduce(function (topics, module) {
                //dig deeper
                if (module.Modules.length > 0) {
                    //get the next level and add it to the urls
                    topics = topics.concat(TOC2Topics(module, courseInfo));
                }

                //get the ones here using the supplied function
                if (module.Topics.length > 0) {
                    topics = topics.concat(proccssTopics(module.Topics, courseInfo));
                }

                //send them on
                return topics;
            }, []);


            return topicsOut;
        }

        /******************** getUrlsFromToc START *****************************/
        //1 Retrieve table of contents for the specified orgUnitId 
        getToc(orgUnitId, function (err, toc) {
            if (err) {
                getTopicsFromTocCallback(err, null);
                return;
            }

            getCourseInfo(orgUnitId, function (err, courseInfo) {
                if (err) {
                    getTopicsFromTocCallback(err, null);
                    return;
                }
                var objOut;

                //2 convert toc to array of urls
                topics = TOC2Topics(toc, courseInfo);

                //send back the course info too
                objOut = {
                    courseInfo: courseInfo,
                    topics: topics
                }

                getTopicsFromTocCallback(null, objOut);
            })
        });
    }


    function getCourseHtmlPages(orgUnitId, topCallback) {
        var newUrls,
            donePages = [],
            pagesWithError = [];

        //used to filter down to urls we want to keep
        function keepHtmlLinks(url) {
            //so url.match below doesn't break
            if (url === null || typeof url === 'undefined') {
                return false;
            }
            var keep = url.match('.html') !== null

            if (showDroppedUrls && !keep) {
                console.log('not html url:', url);
            }

            return keep;
        }

        function keepCourseLinks(url) {
            if (url === null) {
                return false;
            }
            var keep = url.match('/content/enforced/') !== null;

            if (showDroppedUrls && !keep) {
                console.log('not in cousre url:', url);
            }
            return keep;
        }

        /*********************************************
         *********************************************
         * 3,4,5 Turn an array of urls into HTML pages
         **********************************************
         **********************************************/
        function urlsToPages(urls, courseInfo, urlsToPagesInturnalCallback) {
            /*********************************************
             * 3 makes ajax call for each url to get the html text. 
             * Returns an array of objects with the following properties
             * url, html and error 
             **********************************************/
            function getHtmlStrings(urls, getHtmlCb) {
                function getHtml(url, callback) {
                    var xhr = new XMLHttpRequest();

                    xhr.open("GET", url);
                    xhr.onload = function (e) {
                        if (xhr.status == 200) {
                            //console.log('happy');
                            callback(null, {
                                url: url,
                                html: xhr.response,
                                error: null
                            });
                        } else {
                            callback(null, {
                                url: url,
                                html: null,
                                error: makeRequestErrorObj(xhr)
                            });
                        }
                    }
                    xhr.send();
                }

                //loop the above getHtml function for each url using the async lib
                async.mapLimit(urls, 30, getHtml, function (err, currentPages) {
                    if (err) {
                        //should not get here
                        getHtmlCb(err, null)
                        return;
                    }
                    //send the pages back
                    getHtmlCb(null, currentPages);

                })
            }

            /*********************************************
             * 4 sort the pages in to wheat and tares. Save the tares and send the wheat back
             **********************************************/
            function filterOutErrorPages(currentPages) {
                var goodPages = [],
                    badPages = [];

                currentPages.forEach(function (page) {
                    if (page.error === null) {
                        goodPages.push(page)
                    } else {
                        badPages.push(page)
                    }
                })
                //Hold on to the errorpages
                pagesWithError = pagesWithError.concat(badPages);
                if (showCrawlingSteps) {
                    console.log("goodPages:", goodPages);
                    console.log("badPages:", badPages);
                }
                return goodPages;
            }
            /*********************************************
             * 5 parse html strings into html documents
             *
             * this function takes an array of objects that look like:
             * {
             *     url: '{{url string}}',
             *     html: '{{html string}}'
             * }
             **********************************************/
            function parseHTML(currentPages) {
                var parser = new DOMParser();
                return currentPages.map(function (page) {
                    return {
                        url: page.url,
                        html: page.html,
                        document: parser.parseFromString(page.html, 'text/html')
                    };
                })

            }

            /************************* urlsToPages START **************************/
            //3 get the html pages
            getHtmlStrings(urls, function (err, currentPages) {
                if (err) {
                    urlsToPagesInturnalCallback(err, null, null);
                    return;
                }

                //4 filter out the errored pages
                currentPages = filterOutErrorPages(currentPages);

                //5 Convert the htlm text to html documents
                currentPages = parseHTML(currentPages);

                urlsToPagesInturnalCallback(null, currentPages, courseInfo);
            })

        }

        /*********************************************
         * 6 Save the done pages
         **********************************************/
        function saveDonePages(currentPages) {
            donePages = donePages.concat(currentPages);
        }

        /*********************************************
         *********************************************
         * 7,8 Comb the html pages for any more urls we have not seen yet
         **********************************************
         **********************************************/
        function getNewUrlsFromPages(currentPages, donePages, courseInfo) {
            var newUrls;
            /*********************************************
             * 7 find unique list of more links in the current pages  
             **********************************************/
            function findMoreURLs(currentPages, courseInfo) {
                function toUrls(urlsOut, page) {
                    //get all the a tags on the page
                    var links = page.document.querySelectorAll('a');
                    //convert nodelist to real array
                    //convert from `a` nodes to just href text
                    links = Array.prototype.map.call(links, function (link) {
                            return link.getAttribute('href');
                        })
                        //filter down to just .html links
                        .filter(keepHtmlLinks)
                        //make them absolute href's
                        .map(function (link) {

                            var linkOut = link.trim();

                            //the URI lib throws errors if the url is not a url.
                            //example href="width:100%", 'width:100%' is not a url but is in a place that should be a url
                            //so catch the error and don't do anything to it but print it for fun. it will get filtered out later
                            try {
                                //fix the url
                                linkOut = URI(link)
                                    //turns href from a tag to absolute url based on page url like a browser does- if it is already is an absolute url it leaves it
                                    .absoluteTo(page.url)
                                    //encodes the url
                                    .normalize()
                                    //makes it a string
                                    .toString();
                            } catch (error) {
                                //if the url is not really a url catch the error and send on null
                                console.warn("Problem with url in htmlpages:", linkOut);
                                console.warn("Course Name:", courseInfo.Name)
                                console.error(error);
                                //not a url it will get filter out in the filter below
                                return null;
                            }

                            return linkOut;
                        })
                        //make sure the urls are ones in the course
                        .filter(keepCourseLinks)
                    //stick those on the end of the current list
                    return urlsOut.concat(links);
                }

                var urls = currentPages
                    //get the urls on all the pages
                    .reduce(toUrls, [])
                    //remove any duplicates
                    .filter(removeDuplicates);

                //easier to read
                //.sort();

                return urls;
            }

            /*********************************************
             * 8 filter out links that we have in the done list from newLinks
             **********************************************/
            function filterOutDonePages(newUrls) {
                return newUrls.filter(function (url) {
                    //check to see if the current url is in the donePages or pageslist 
                    var notInDone, notInError;
                    notInDone = donePages.every(function (page) {
                        return page.url !== url;
                    });

                    notInError = pagesWithError.every(function (page) {
                        return page.url !== url;
                    });

                    //only keep if not in either of the places
                    return notInDone && notInError;

                })

            }

            /******************** getNewUrlsFromPages START *****************************/
            //7 Find more urls in current pages
            newUrls = findMoreURLs(currentPages, courseInfo);

            //8 Only keep newUrls if they are not already in the donePages 
            newUrls = filterOutDonePages(newUrls);

            return newUrls;

        }

        /*********************************************
         * This is the callback function that is given urlsToPages
         * It saves the pages that urlsToPages makes
         * calls getNewUrlsFromPages 
         * Then checks if we are done yet to either start another urlsToPages
         * Or calls the topCallback with the donePages
         **********************************************/
        function loopEndProgress(err, currentPages, courseInfo) {
            if (err) {
                topCallback(err, null);
                return;
            }

            //6 currentPages are now done save them to donePages
            saveDonePages(currentPages);

            //7,8 Get more urls from the current pages
            newUrls = getNewUrlsFromPages(currentPages, donePages, courseInfo);
            if (showCrawlingSteps) {
                console.log("newUrls:", newUrls);
            }


            //9 loop if we have more urls else we are done!
            if (newUrls.length > 0) {
                urlsToPages(newUrls, courseInfo, loopEndProgress);
            } else {
                //We are done!
                topCallback(null, {
                    courseInfo: courseInfo,
                    successfulPages: donePages,
                    errorPages: pagesWithError
                });
            }
        }


        /***************************************************/
        /***************************************************/
        /********************* START ***********************/
        /***************************************************/
        /***************************************************/
        //1,2
        getTopicsWithUrlFromToc(orgUnitId, function (err, topicsInfo) {
            var urls;
            if (err) {
                topCallback(err, null);
                return;
            }

            urls = topicsInfo.topics
                //map to just urls
                .map(function (topic) {
                    return topic.url;
                })
                //filter out any null links and keep the ones we want
                .filter(keepCourseLinks)
                //keep only html links
                .filter(keepHtmlLinks)
                //make unique list
                .filter(removeDuplicates)

            // 3,4,5 convert the urls to pages then call the end of loop function
            urlsToPages(urls, topicsInfo.courseInfo, loopEndProgress)

        });
    }

    //send back the exposed functions
    return {
        getTopicsWithUrlFromToc: getTopicsWithUrlFromToc,
        getCourseHtmlPages: getCourseHtmlPages,
        getCourseInfo: getCourseInfo
    }

}());
