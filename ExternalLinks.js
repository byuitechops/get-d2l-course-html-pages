function ouToAllLinks(ouNumber, cb) {
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
                        .map(function (aTag) {
                            return aTag.getAttribute('href');
                        })
                        .map(function (link) {

                            if (link === null) {
                                return null;
                            }

                            var linkOut = link.trim();
                            linkOut = URI(link);

                            //make sure we have a url
                            if (!linkOut.is('url')) {
                                return null;
                            }

                            if (linkOut.is('url') && linkOut.is('relative')) {
                                //turns href from a tag to absolute url based on page url like a browser does
                                linkOut = linkOut.absoluteTo(page.url)
                            }

                            //fix it the rest of the way
                            linkOut = linkOut
                                //encodes the url
                                .normalize()
                                //makes it a string
                                .toString();

                            return linkOut;
                        })
                })
                //flaten 
                .reduce(function (flat, pageLinkList) {
                    return flat.concat(pageLinkList);
                }, [])
                //this is for the csv lib 
                .map(function (link) {
                    return {
                        urls: link
                    };
                })

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
