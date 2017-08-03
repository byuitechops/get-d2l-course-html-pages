var counter = 0;

var downloadButton = document.querySelector('.downloadButton');


function showResults(course) {
    /**
     * This function downloads the results of the output on the screen.
     * @return {void}
     */
    function downloadResults(course) {
        console.log(course);
        // Only format the urls from the results
        //var urls = course.map(function(courseDataItem) {
        //var ouNumber = courseDataItem.ou;
        // courseDataItem.map(function(course) {
        //
        // })
        // REFERENCE CODE: To rip out just the ouNumber from a content/enforced url
        // var regExForOu = /\d+-/g;
        //
        // return {
        //     courseDataItem.ou: courseDataItem.results.url
        // };
        //});

        // console.log(urls);
        //
        // var formattedCSV = d3.csvFormat(urls);
        // console.log(formattedCSV);
    }

    ++counter
    var out = document.getElementById('out')
    /* Add ou as a heading, and then create list element to populate */
    out.insertAdjacentHTML('beforeend', '<h2>' + course.ou + '</h2>\n<ol id="id_' + counter + '"></ol>')

    // About to test what is in results so we can gauge where to go for a download
    console.log(course.results);

    // Enable Download Button
    downloadButton.disabled = false;

    course.results.forEach(function (result) {
        /* Populate the list element*/
        out.querySelector('#id_' + counter).insertAdjacentHTML('beforeend', '<li><a href="' + result.url + '" target="_blank">' + result.url + '</a></li>')
    })
}

function getUrls() {
    document.getElementById('out').innerHTML = '<p>Search started, results will appear below</p>'
    var ous = document.getElementById('orgUnitId').value.split(', ');
    ous.forEach(function (ou) {
        d2lScrape.getCourseHtmlPages(ou, function (err, pages) {
            /*Get query*/
            var query = document.getElementById('query').value;

            /* check for case sensitivity*/
            var isCS = document.querySelector('#cs').checked
            var course = {
                ou: ou
            };
            /* Determine search type and perform filtering*/
            if (document.getElementById('searchText').checked) {
                /* Search text base on case sensitivity*/
                if (!isCS) {
                    var filteredList = pages.successfulPages.filter(function (page) {
                        var re = new RegExp(query, 'i')
                        return page.document.querySelector('body').textContent.search(re) != -1
                    })
                } else {
                    var filteredList = pages.successfulPages.filter(function (page) {
                        var re = new RegExp(query)
                        return page.document.querySelector('body').textContent.search(re) != -1
                    })
                }
                course['results'] = filteredList
            } else if (document.getElementById('linkHrefs').checked) {
                /* filter based on whether the dom has links with the href listed */
                var filteredList = pages.successfulPages.filter(function (page) {
                    var links = Array.from(page.document.querySelectorAll('a'));
                    var contains = links.some(function (link) {
                        var href = link.getAttribute('href')
                        if (href !== null && href.search(query) != -1) {
                            return true
                        }
                    })
                    return contains
                })
                course['results'] = filteredList
            } else if (document.getElementById('querySelector').checked) {
                var filteredList = pages.successfulPages.filter(function (each) {
                    return each.document.querySelector(query) !== null
                })
                course['results'] = filteredList
            }
            showResults(course)
        })
    })
}
