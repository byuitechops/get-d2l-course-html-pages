/*eslint-env node*/
/*eslint no-console:0, no-unused-vars:0*/
function getD2LCourseHtmlPages(ouNumber, cb) {

    var toc = require('./joshSandboxTOC.js'),
        urls,
        uniqueUrls,
        finisedUrls;

    function proccssTopics(topics) {
        return topics
            //.filter(topic => topic.TypeIdentifier.toLowerCase() === 'file')
            .filter(topic => topic.Url.includes('/content/enforced/'))
            //only want the Url prop for now
            .map(topic => topic.Url);

    }

    function TOC2Topics(toc, proccssTopics) {

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

    function makeUnique(url, index, array) {
        return array.indexOf(url) === index;
    }

    // 1 Get all the Urls from the Toc
    urls = TOC2Topics(toc, proccssTopics);

    //2 Make it a unique list
    uniqueUrls = urls.filter(makeUnique);

    //console.log("urls:", urls);
    //console.log("uniqueUrls:", uniqueUrls);

    urls = urls.map(function (ele) { // JK fam make it async
        /*content = do the ajax calls*/
        return {
            url: ele,
            content: 1 //content
        }
    })

}
