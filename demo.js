d2lScrape.getCourseHtmlPages(10011, function (err, pages) {
    if (err) {
        console.log("err:", err);
    }
    console.log("pages.successfulPages:", pages.successfulPages);
    console.log("pages.errorPages:", pages.errorPages);
})

d2lScrape.getTopicsWithUrlFromToc(10011, function (err, topics) {
    if (err) {
        console.log("err:", err);
    }

    console.log("topics:", topics);
})
