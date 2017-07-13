# Get D2L Course HTML Pages

This library aids in the retrieving of D2L course content. The library returns an object that has two functions attached to it. One gives you the course content links and the other returns an array of all the html pages that a user can access from the content area in a D2L course. This also includes any html pages that are indirectly linked to. The library crawls the pages linked to in the content area to find any more pages the user can access.

## API
The libaray is designed to be used on a html page in a d2l course. The global object that the library creates is called `d2lScrape` and looks like this:
```javascript
d2lScrape = {
    getCourseHtmlPages:  function (orgUnitId, callbackFunction),
    getTopicsWithUrlFromToc: function (orgUnitId, callbackFunction)
}

```

See the following headings for more info on each of the functions.

### getCourseHtmlPages
This async function gives you an object of all the html pages a user can cass from the content area in a D2L course.
It takes a Node.js style callback that will recive an error obj and an object of all the html pages. This object has two arrays on it, one for pages that work and the other that did not return a 200 status code.

```javascript
d2lScrape.getCourseHtmlPages(orgUnitId, callbackFunction)
```

`orgUnitId` is the `ou` number for the d2l course

`callbackFunction`'s sigture uses the standard Node.js pattern

```javascript
callbackFunction(err, pages)
```

`err` is a standard error object

`pages` is an obj that has two arrays of objects. It looks like this:
 
```javascript
{
    successfulPages: [pages array],
    errorPages: [pages array]
}
```
Each page in the arrays look like this:

```javascript
    {
        document : a html document created from the html string using DOMParser //(when request is successful),
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
    d2lScrape.getCourseHtmlPages(10011, function (err, pages) {
        //check if there were any standard errors
        if (err) {
            console.log("err:", err);
        }
        
        //check if there were any pages that didn't return a code 200 
        if (pages.errorPages.length > 0) {
        console.log("pages.errorPages:", pages.errorPages);
        }
        
        //print out the pages that worked
        console.log("pages.successfulPages:", pages.successfulPages);
})
```


### getTopicsWithUrlFromToc
This async function gives you an array of all the topics in the course content area that have a url.
It takes a Node.js style callback that will recive an error obj and an array of all the topic objecs.

```javascript
d2lScrape.getTopicsWithUrlFromToc(orgUnitId, callbackFunction)
```

`orgUnitId` is the `ou` number for the d2l course

`callbackFunction`'s sigture uses the standard Node.js pattern


```javascript
callbackFunction(err, topics)
```

`err` is a standard error object

`topics` is an array of objects that look like this:
 
```javascript
{
   title: title string,
   url: encoded apsolute url string,
   type: TypeIdentifier string
}
```

#### Example of Use
```javascript
d2lScrape.getTopicsWithUrlFromToc(10011, function (err, topics) {
    if (err) {
        console.log("err:", err);
    }

    console.log("topics:", topics);
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
Then all you have to do is add this to a page in d2l an your off
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/async/2.5.0/async.min.js"></script>
<script src="https://localhost:8000/d2lScrape.js"></script>
<script src="https://localhost:8000/demo.js"></script>

```
