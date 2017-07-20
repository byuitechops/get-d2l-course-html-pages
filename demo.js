d2lScrape.getCourseHtmlPages(10011, function (err, data) {
    if (err) {
        console.log("err:", err);
    }
    console.log("DEMO: data.courseInfo:", data.courseInfo);
    console.log("DEMO: data.successfulPages:", data.successfulPages);
    console.log("DEMO: data.errorPages:", data.errorPages);
})

d2lScrape.getTopicsWithUrlFromToc(10011, function (err, data) {
    if (err) {
        console.log("err:", err);
    }

    console.log("DEMO: data.courseInfo:", data.courseInfo);
    console.log("DEMO: data.topics:", data.topics);
})
