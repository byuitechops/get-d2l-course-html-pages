/*eslint-env node, browser*/
/*eslint no-console:0, no-unused-vars:0, no-undef:02*/
/*global async, URI*/
function getD2LCourseHtmlPages(orgUnitId, topCallBack) {
    var toc, urls, newUrls,
        donePages = [];

    function removeDuplicates(url, index, array) {
        return array.indexOf(url) === index;
    }


    /*********************************************
     * Retrieve table of contents for the specified orgUnitId 
     **********************************************/
    function getToc(orgUnitId, callback) {
        var tocxhr = new XMLHttpRequest();
        tocxhr.open("GET", "/d2l/api/le/1.15/" + orgUnitId + "/content/toc")
        tocxhr.onload = function () {
            if (tocxhr.status == 200) {
                callback(null, JSON.parse(tocxhr.response));
            }
        }

        tocxhr.onerror = function () {
            callback(tocxhr.status, null);
        }
        tocxhr.send();
    }

    /*********************************************
     * 2 Takes the toc and flatens it to an array of urls
     **********************************************/
    function TOC2Topics(toc) {
        var urlsOut;

        function makeAppsoluteURL(urlPiece) {
            return window.location.protocol + '//' + window.location.host + urlPiece;
        }

        function proccssTopics(topics) {
            return topics
                //.filter(topic => topic.TypeIdentifier.toLowerCase() === 'file')
                .filter(function (topic) {
                    //check that it exists    
                    if (typeof topic.Url === 'undefined' || topic.Url === null) {
                        return false;
                    }
                    //check that the Url has the content/enforced
                    return topic.Url.includes('/content/enforced/')
                })

                //only want the Url prop for now
                .map(topic => makeAppsoluteURL(topic.Url));
        }

        urlsOut = toc.Modules.reduce(function (urls, module) {
            //dig deeper
            if (module.Modules.length > 0) {
                //get the next level and add it to the urls
                urls = urls.concat(TOC2Topics(module));
            }

            //get the ones here using the supplied function
            if (module.Topics.length > 0) {
                urls = urls.concat(proccssTopics(module.Topics));
            }

            //send them on
            return urls;
        }, []);

        //remove any duplicates from the list
        return urlsOut.filter(removeDuplicates);
    }

    /*********************************************
     * 3 makes ajax call for each url to get the html text. 
     * Returns an array of objects with the following properties
     * url, html and error 
     **********************************************/
    function getHtmlStrings(urls, getHtmlCb) {
        function getHtml(url, callback) {
            var xhr = new XMLHttpRequest(),
                encodedURL = encodeURI(url)
                /* this replace is because encodeURI keeps # for ankor tags but we have
                 * html files with # in their name thus in the url and they need 
                 * to be encoded    
                 */
                .replace('#', '%23');
            xhr.open("GET", encodedURL);
            xhr.onload = function (e) {
                if (xhr.status == 200) {
                    //console.log('happy');
                    callback(null, {
                        url: url,
                        html: xhr.response,
                        error: null
                    });
                } else {
                    console.log('sad');
                    console.log("xhr.status:", xhr.status);
                    callback(null, {
                        url: url,
                        html: null,
                        error: xhr.status
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
     * 4 sort the pages in to wheat and tares
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
        console.log("goodPages:", goodPages);
        console.log("badPages:", badPages);
        //DIDN'T DO ANYTHING WITH BAD PAGES HERE!
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

    /*********************************************
     * 6 Save the done pages
     **********************************************/
    function saveDonePages(currentPages) {
        donePages = donePages.concat(currentPages);
    }

    /*********************************************
     * 7 find more links in the current pages  
     **********************************************/
    function findMoreURLs(currentPages) {
        function toUrls(urlsOut, page) {
            //get all the a tags on the page
            var links = page.document.querySelectorAll('a');
            //convert nodelist to real array
            links = Array.from(links)
                //convert from `a` nodes to just href text
                .map(function (link) {
                    return link.getAttribute('href');
                })
                //filter down to just .html links
                .filter(function (link) {
                    //so link.includes below doesn't break
                    if (link === null) {
                        return false;
                    }

                    return link.includes('.html');
                })
                //make them absolute href's
                .map(function (link) {
                    var linkOut = URI(link.trim()).absoluteTo(page.url).toString();
                    //console.log("page.url", page.url, "\nlink:", link, "\nlinkOut:", linkOut);
                    return linkOut;
                })
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
            //check to see if the current url is in the donePages list 
            return donePages.every(function (page) {
                return page.url !== url;
            });
        })

    }

    /********************* START ***********************/
    //1 Get TOC
    getToc(orgUnitId, function (err, toc) {
        if (err) {
            console.log(err);
            return;
        }

        //2 convert toc to array of urls
        urls = TOC2Topics(toc);

        //3 get the html pages
        getHtmlStrings(urls, function (err, currentPages) {
            //4 filter out the errored pages
            currentPages = filterOutErrorPages(currentPages);

            //5 Convert the htlm text to html documents
            currentPages = parseHTML(currentPages);

            //6 currentPages are now done save them to  donePages
            saveDonePages(currentPages)

            //7 Find more urls in current pages
            newUrls = findMoreURLs(currentPages);

            //8 Only keep newUrls if they are not already in the donePages 
            newUrls = filterOutDonePages(newUrls);

            console.log("newUrls:", newUrls);
            topCallBack(null, donePages)
        })
    })


}

getD2LCourseHtmlPages(10011, function (err, donePages) {
    console.log("donePages:", donePages);
    console.log('done');

})
