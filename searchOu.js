function showResults(data) {
  console.log("Reset")
  document.getElementById('out').innerHTML = ''
  data.forEach(function (page) {
    document.getElementById('out').insertAdjacentHTML('beforeend', '<li><a href="' + page.url + '" target="_blank">' + page.url + '</a></li>')
  })
}

function getUrls() {
  document.getElementById('out').innerHTML = '<p>Searching...</p>'
  var ou = document.getElementById('orgUnitId').value;
  getD2LCourseHtmlPages(ou, function (err, pages) {
    /*Get query*/
    var query = document.getElementById('query').value;

    /* check for case sensitivity*/
    var isCS = document.querySelector('#cs').checked

    /* Determine search type */
    if (document.getElementById('searchText').checked) {
      if (!isCS) {
        var filteredList = pages.filter(function (page) {
          var re = new RegExp(query, 'i')
          return page.document.querySelector('body').textContent.search(re) != -1
        })
      } else {
        var filteredList = pages.filter(function (page) {
          var re = new RegExp(query)
          return page.document.querySelector('body').textContent.search(re) != -1
        })
      }
      showResults(filteredList)
    } else if (document.getElementById('linkHrefs').checked) {
      var filteredList = pages.filter(function (page) {
        var links = Array.from(page.document.querySelectorAll('a'));
        var contains = links.some(function (link) {
          if (link.href.search(query != -1)) {
            console.log("found")
            return true
          }
        })
        return contains
      })
      showResults(filteredList)
    } else if (document.getElementById('querySelector').checked) {
      var filteredList = pages.filter(function (each) {
        return each.document.querySelector(query) !== null
      })
      showResults(filteredList)
    }
  })
}
