/* eslint-env browser */
/** Retrieve table of contents for the specified orgUnitId */
function getToc(orgUnitId, callback) {
  var tocxhr = new XMLHttpRequest();
  tocxhr.open("GET", "/d2l/api/le/1.15/" + orgUnitId + "/content/toc")
  tocxhr.onload = function () {
    if (tocxhr.status == 200) {
      callback(null, JSON.parse(tocxhr.response));
    }
  }
  tocxhr.send();
}

function makeAppsoluteURL(urlPiece) {
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

/** Convert Toc to an array of links */
function parseToc(tocObj) {
  return tocObj.Modules.reduce(function (urls, module) {
    //dig deeper
    if (module.Modules.length > 0) {
      //get the next level and add it to the urls
      urls = urls.concat(parseToc(module));
    }

    //get the ones here using the supplied function
    if (module.Topics.length > 0) {
      urls = urls.concat(proccssTopics(module.Topics));
    }

    //send them on
    return urls;
  }, []);
}

/** Add topic urls from given module to provided links array */
function getTopicLinks(module, links) {
  module.Topics.forEach(function (topic) {
    links.push(topic.Url);
  })
}

/** Call this function to begin */
function getCourseLinks(orgUnitId, callback) {
  getToc(orgUnitId, function (err, tocObj) {
    callback(null, parseToc(tocObj).filter(makeUnique));
  })
}

/** return unique array */
function makeUnique(url, index, array) {
  return array.indexOf(url) === index;
}

function getHtml(url, callback) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET", encodeURI(url));
  xhr.onload = function (e) {
    if (xhr.status == 200) {
      callback(null, {
        url: url,
        html: html,
        error: null
      })
    } else {
      console.log(xhr.status)
      callback(null, {
        url: url,
        html: null,
        error: xhr.status
      })
    }
  }
  xhr.send();
}

getCourseLinks(10011, function (err, results) {
  console.log(results);
  async.map(results, getHtml, function (err, data) {
    console.log(data)
  })
})
