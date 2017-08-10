function ouToAllLinks(ouNumber, cb) {
    function isValidHref(href) {

        //do we even have one?
        if (href === null || typeof href === 'undefined') {
            return false;
        }

        //is it a url
        try {
            //try to parse it
            var parsedLink = URI(href);
            //if we made it this far then it parsed 
            //now check if we have a url
            return parsedLink.is('url');

        } catch (e) {
            //it must not have parsed
            //so don't keep it
            return false;
        }

    }


    d2lScrape.getTopicsWithUrlFromToc(ouNumber, function (err, topics) {
        if (err) {
            cb(err, null);
            return;
        }

        d2lScrape.getCourseHtmlPages(ouNumber, function (err, pages) {
            var pageLinks, objOut;
            if (err) {
                cb(err, null);
                return;
            }

            pageLinks = pages.successfulPages.map(function (page) {
                    return Array.from(page.document.querySelectorAll('a'))
                        //get the href attribute  
                        //add pageUrl so the end user knows where we found this
                        .map(function (aTag) {
                            return {
                                link: aTag.getAttribute('href'),
                                pageUrl: page.url
                            };

                        })
                        //get rid of all not valid links
                        .filter(function (linkIn) {
                            return isValidHref(linkIn.link);

                        })
                        //normalize the urls
                        .map(function (linkIn) {
                            var linkOut = URI(linkIn.link);

                            if (linkOut.is('relative')) {
                                //turns href from the 'a' tag to absolute url based on page url like a browser does
                                linkOut = linkOut.absoluteTo(linkIn.pageUrl)
                            }

                            //fix it the rest of the way
                            linkOut = linkOut
                                //encodes the url
                                .normalize()
                                //makes it a string
                                .toString();

                            //update the url
                            linkIn.link = linkOut

                            return linkIn;
                        })
                })
                //flaten 
                .reduce(function (flat, pageLinkList) {
                    return flat.concat(pageLinkList);
                }, [])

            objOut = {
                courseInfo: pages.courseInfo,
                topicLinks: topics.topics.filter(function (topic) {
                    return typeof topic !== 'undefined';
                }),
                pageLinks: pageLinks,
                errorPages: pages.errorPages.map(function (error) {
                    return {
                        html: error.html,
                        url: error.url,
                        responseURL: error.error.responseURL,
                        status: error.error.status,
                        statusText: error.error.statusText
                    };
                })
            };

            cb(null, objOut);


        })
    })
}

function search() {
    var ouNumbers = document.querySelector('#ous').value.trim().split('\n');
    //var ouNumbers = ['106952', '16197', '23800', '16214', '105848'];
    //var ouNumbers = ['106952'];
    console.log("ouNumbers:", ouNumbers);

    async.map(ouNumbers, ouToAllLinks, function (err, classes) {
        if (err) {
            console.log('Error:', err);
            return;
        }
        //make csvs
        var csvsByClass = classes.map(function (links) {
            return {
                className: links.courseInfo.Name.replace(/ /g, ''),
                errorPages: d3.csvFormat(links.errorPages),
                pageLinks: d3.csvFormat(links.pageLinks),
                topicLinks: d3.csvFormat(links.topicLinks, Object.keys(links.topicLinks[0]))
            }
        })

        //download csvs
        csvsByClass.forEach(function (classData) {
            Object.keys(classData)
                .filter(function (key) {
                    return key !== 'className';
                })
                .forEach(function (key) {
                    download(classData[key], classData.className + '_' + key + ".csv", "text/csv");
                })
        })


        console.log("classes:", classes);
        console.log("csvsByClass:", csvsByClass);
    });

}
document.querySelector('#goButton').addEventListener('click', search);
