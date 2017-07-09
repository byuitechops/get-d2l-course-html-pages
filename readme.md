# Get D2L Course HTML Pages

This library returns an array of all the html pages that a user can access from the content area in a D2L course. This also includes any html pages that are indirectly linked to. The library crawls the pages linked to in the content area to find any more pages the user can access.

## API
This library provides one function that is designed to be used in a d2l course.
```javascript
getD2LCourseHtmlPages(orgUnitId, callbackFunction)
```

`orgUnitId` is the `ou` number for the d2l course

`callbackFunction`'s sigture uses the standard Node.js pattern

```
callbackFunction(err, pages)
```

`err` is a standard error object

`pages` is an array of objects that look like this

```javascript
    {
        url: url String,
        html: htmlString,
        document : a html document created from the html string using DOMParser 
    }
```
For info on DOMParser see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser

## Known Issues
At this point when it makes the requests to get the html pages, if the status is not a 200 it just toss them out.

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
<script src="https://localhost:8000/getD2LCourseHtmlPages.js"></script>
```

## Note

At this point the lib has only really tested in Chrome.
