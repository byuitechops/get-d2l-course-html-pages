# Get D2L Course HTML Pages

This library aids in the retrieving of D2L course content. The library returns an object that has two functions attached to it. One gives you the course content links and the other returns an array of all the html pages that a user can access from the content area in a D2L course. This also includes any html pages that are indirectly linked to. The library crawls the pages linked to in the content area to find any more pages the user can access.

## API
The library is designed to be used on an html page in a d2l course. The global object that the library creates is called `d2lScrape` and looks like this:
```
d2lScrape = {
    getTopicsWithUrlFromToc: function (orgUnitId, callbackFunction)
    getCourseHtmlPages:  function (orgUnitId, callbackFunction),
}

```

See the following headings for more info on each of the functions.

### getTopicsWithUrlFromToc
This async function gives you an object that has the course info object and an array of all the topics in the course content area that have urls.
It takes a Node.js style callback that will receive an error obj and the object described above.

```javascript
d2lScrape.getTopicsWithUrlFromToc(orgUnitId, callbackFunction)
```

`orgUnitId` is the `ou` number for the d2l course

`callbackFunction`'s signature uses the standard Node.js pattern


```javascript
callbackFunction(err, data)
```

`err` is a standard error object

`data` is an object that looks like this:
```javascript
{
    courseInfo: courseInfo,
    topics: topics
}
```

`courseInfo` is the object that is returned the D2L valence api call [http://docs.valence.desire2learn.com/res/course.html#get--d2l-api-lp-(version)-courses-(orgUnitId)](http://docs.valence.desire2learn.com/res/course.html#get--d2l-api-lp-(version)-courses-(orgUnitId)) it looks like this [http://docs.valence.desire2learn.com/res/course.html#Course.CourseOffering](http://docs.valence.desire2learn.com/res/course.html#Course.CourseOffering)

`topics` is an array of objects that look like this:
 
```javascript
{
   title: title string,
   url: encoded absolute url string,
   type: TypeIdentifier string
}
```

#### Example of Use
```javascript
d2lScrape.getTopicsWithUrlFromToc(10011, function (err, data) {
    //check if there were any un-handled errors
    if (err) {
        console.log("err:", err);
    }
    //print the courseInfo
    console.log("DEMO: data.courseInfo:", data.courseInfo);
    //print the course topics
    console.log("DEMO: data.topics:", data.topics);
})
```

### getCourseHtmlPages
This async function gives you an object of all the html pages a user can access from the content area in a D2L course.
It takes a Node.js style callback that will receive an error obj and an object of all the data. This object has the courseInfo object and the two arrays of html pages on it, one for pages that work and the other that did not return a 200 status code.

```javascript
d2lScrape.getCourseHtmlPages(orgUnitId, callbackFunction)
```

`orgUnitId` is the `ou` number for the d2l course

`callbackFunction`'s signature uses the standard Node.js pattern

```javascript
callbackFunction(err, pages)
```

`err` is a standard error object

`pages` is an obj that has two arrays of objects. It looks like this:
 
```
{
    courseInfo: {D2l course offering obj},
    successfulPages: [pages array],
    errorPages: [pages array]
}
```
`courseInfo` is the object that is returned the D2L valence api call [http://docs.valence.desire2learn.com/res/course.html#get--d2l-api-lp-(version)-courses-(orgUnitId)](http://docs.valence.desire2learn.com/res/course.html#get--d2l-api-lp-(version)-courses-(orgUnitId)) it looks like this [http://docs.valence.desire2learn.com/res/course.html#Course.CourseOffering](http://docs.valence.desire2learn.com/res/course.html#Course.CourseOffering)


Each page in the arrays look like this:

```
    {
        document : an html document created from the html string using DOMParser //(when request is successful),
        url: url String,
        html: htmlString, //(when request is successful)
        error: null //when request is successful
        error : { //when request has an error
            status: request.status,
            statusText: request.statusText,
            responseText: request.responseText,
            responseURL: request.responseURL
        }
    }

```
For info on DOMParser see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser



#### Example of Use
```javascript
    d2lScrape.getCourseHtmlPages(10011, function (err, data) {
        //check if there were any standard errors
        if (err) {
            console.log("err:", err);
        }
        //print out the course info for 10011
        console.log("DEMO: data.courseInfo:", data.courseInfo);
        
        //check if there were any pages that didn't return a code 200 
        if (data.errorPages.length > 0) {
            console.log("DEMO: data.errorPages:", data.errorPages);
        }
        
        //print out the pages that worked
        console.log("DEMO: data.successfulPages:", data.successfulPages);
    })
```


## Demo of use
See [demo.js](./demo.js) for a full demo of the api.

## Known Issues
- At this point the lib has only really tested in Chrome.

Also see github issues for more.

## Dependencies

Dependencies that need to be included on the page
- async.js lib 
   - site: https://caolan.github.io/async/
   - github: https://github.com/caolan/async
   - cdn: https://cdnjs.cloudflare.com/ajax/libs/async/2.5.0/async.min.js
- URI.js
    - site: https://medialize.github.io/URI.js/
    - github: https://github.com/medialize/URI.js
    - cdn: https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min.js
    
## For Easy Development in D2L 

Make sure you use the `live-development-server` https://github.com/byuitechops/live-development-server
Then all you have to do is add this to a page in d2l and you're off
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/async/2.5.0/async.min.js"></script>
<script src="https://localhost:8000/d2lScrape.js"></script>
<script src="https://localhost:8000/demo.js"></script>

```
