/*eslint-env node*/
/*eslint no-undefined:0*/
var urlsFromGetHTMLPages = [
    {
        url: 'https:byui.brightspace.com/thisSite1.html',
        html: '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><script></script><style></style></head><body><p>hi1</p><a href="https://www.lds.org/scriptures/bofm/alma/1">Alma 1</a></body></html>'
}, {
        url: 'https:byui.brightspace.com/thisSite2.html',
        html: '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><script></script><style></style></head><body><p>hi2</p><a href="https://www.lds.org/scriptures/bofm/alma/2">Alma 2</a></body></html>'
}, {
        url: 'https:byui.brightspace.com/thisSite3.html',
        html: '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><script></script><style></style></head><body><p>hi3</p><a href="https://www.lds.org/scriptures/bofm/alma/3">Alma 3</a><a href="https:byui.brightspace.com/thisSite1.html"></a></body></html>'
}
];

var donePages = [],
    currentPages = urlsFromGetHTMLPages,
    newLinks;


/********************* 5 ************************/
//parse html strings into html documents
/*
    this function takes an array of objects that look like:
    {
        url: '{{url string}}',
        html: '{{html string}}'
    }
*/
function parseHTML(currentPages) {
    var parser = new DOMParser();
    return currentPages.map(function (page) {
        return {
            url: page.url,
            html: page.html,
            document: parser.parseFromString(page.html, 'text/html')
        };
    })

}


/********************* 7 ************************/
//find more links in the current pages  
function findMoreURLs(currentPages) {
    function toUrls(urlsOut, page) {
        //get all the a tags on the page
        var links = page.document.querySelectorAll('a');
        //convert nodelist to real array
        links = Array.from(links)
            //convert from `a` nodes to just href text
            .map(function (link) {
                return link.getAttribute('href').trim();
            });
        //stick those on the end of the current list
        return urlsOut.concat(links);
    }

    var urls = currentPages
        //get the urls on all the pages
        .reduce(toUrls, [])
        //remove blank or null hrefs
        .filter(function (link) {
            return !(link === null || link.length === 0);
        });

    return urls;
}

/********************* 8 ************************/
//filter out links that we have in the done list from newLinks
function filterOutDoneLinks(newLinks) {
    return newLinks.filter(function (link) {
        //check to see if the current link is in the donePages list 
        return donePages.every(function (page) {
            return page.url !== link;
        });
    })

}

console.log(currentPages);


/********************* 5 ************************/
currentPages = parseHTML(currentPages);

/********************* 6 ************************/
//pages are done - save currentPages to done 
donePages = donePages.concat(currentPages);

/********************* 7 ************************/
//find more links in the current pages  
newLinks = findMoreURLs(currentPages);

/********************* 8 ************************/
//filter out links that we have in the done list from newLinks
newLinks = filterOutDoneLinks(newLinks);
console.log(newLinks);
