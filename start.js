/*eslint-env node, browser*/
/*eslint no-console:0, no-unused-vars:0*/
/*global $*/
var array = [],
    urls = [];

(function getTOC() {
    var orgUnit = window.location.href.match(/content\/(\d+)/)[1];
    $.ajax({
        url: "/d2l/api/le/1.24/" + orgUnit + "/content/toc",
        success: function (data) {

            console.log("Ya Data!");
            console.log(data);
            console.log(JSON.stringify(data, null, 4));

            //flatten(data.Modules);
        },
        error: function (err) {
            // Add Error Handling logic
            console.log(err);
        }
    });
}())

function flatten(array) {
    array.forEach(function (ele) {
        if (ele.Modules.length)
            flatten(ele.Modules)
        if (ele.Topics.length) {
            ele.Topics.forEach(function (topic) {
                urls.push(topic.Url);
            })
        }
    })
}

function makeUnique(url, index, array) {
    return array.indexOf(url) === index;
}

var uniqueUrls = urls.filter(makeUnique);

// filter to only containt /content/~~~~ urls ++ prepend Brightspace.com

urls = urls.map(function (ele) { // JK fam make it async
    /*content = do the ajax calls*/
    return {
        url: ele,
        content: 1 //content
    }
})
