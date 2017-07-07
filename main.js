/*eslint-env node, browser*/
/*eslint no-console:0, no-unused-vars:0*/
/*global async, $*/
function getD2LCourseHtmlPages(ouNumber, topCallBack) {

    var urls, uniqueUrls, toc;

    function makeUnique(url, index, array) {
        return array.indexOf(url) === index;
    }

    function makeAppsoluteURL(urlPiece) {
        var window = {
            location: {
                protocol: 'https:',
                host: 'byui.brightspace.com'
            }
        }

        return window.location.protocol + window.location.host + urlPiece;

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
        //.map(topic => topic.Url);

    }

    function TOC2Topics(toc) {

        return toc.Modules.reduce(function (urls, module) {
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
    }


    function getPageText(url, cb) {
        //get the page guts by ajax
        $.ajax({
            url: url,
            success: function (html) {
                cb(null, {
                    url: url,
                    content: html
                });
            },
            error: function (err) {
                cb(err, null);
            }
        });
    }

    function getlinksOnPage(page) {
        //Look at page.content and find all the urls that we like, could use jquery or could use cherrio or regex
        //decide how we are going to use this module. in browser, with nightmare, or Live dev server
        return []; //fill that with urls, remember to use makeAppsoluteURL()
    }


    function proccessUrls(urls, cb) {
        var finishedPages = [];
        //3 Map to get all the html content strings
        //the 25 limits the number of simultaneous requests there are at time
        async.mapLimit(urls, 25, getPageText, function (err, pages) {
            if (err) {
                cb(err);
                return;
            }

            var newLinks;

            //4 Copy over the urls over to finished
            finishedPages = finishedPages.concat(pages);

            //5 Find links in pages that are not in finished 
            newLinks = pages.reduce(function (linksToKeep, page) {

                var linksOnPage = getlinksOnPage(page);

                //filter links down to ones that are not in finshedPages and add to to linksToKeep
                linksToKeep = linksToKeep.concat(
                    linksOnPage.filter(link => !finishedPages.some(page => page.url === link))
                );


                return linksToKeep;
            }, []);


            //6 if newLinks is not empty call self recursively and then call the callback again 
            //else call callback with finished pages it has all its going to have here
            if (newLinks.length > 0) {
                //these links will need to proccessed
                proccessUrls(newLinks, function (err, pages) {
                    finishedPages = finishedPages.concat(pages);
                    cb(err, pages);
                });
            } else {
                //no new links
                cb(null, finishedPages);
            }
        });


    }

    /****************** START ********************/

    //run the toc call
    toc = require('./joshSandboxTOC.js');
 
    //Get all the Urls from the Toc
    urls = TOC2Topics(toc);

    //Make it a unique list
    uniqueUrls = urls.filter(makeUnique);

    //console.log("urls:", urls);
    console.log("urls:", urls);
    //console.log("uniqueUrls:", uniqueUrls);

    //go proccess the urls
    /*
    proccessUrls(uniqueUrls, function (err, pages) {
        topCallBack(err, pages);
    });
    */
}

//call it
getD2LCourseHtmlPages(1, function () {
    console.log('done');
})
