d2lScrape.getCourseHtmlPages(10011, function (err, pages) {
    if (err) {
        console.log("err:", err);
    }
    console.log("DEMO: pages.successfulPages:", pages.successfulPages);
    console.log("DEMO: pages.errorPages:", pages.errorPages);
})

d2lScrape.getTopicsWithUrlFromToc(10011, function (err, topics) {
    if (err) {
        console.log("err:", err);
    }

    console.log("DEMO: topics:", topics);
})
