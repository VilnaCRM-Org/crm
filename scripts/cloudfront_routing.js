/**
 * This script follows ES5.1 rules for compatibility.
 * Avoid ES6+ syntax (e.g., `let`, `const`, arrow functions).
 */
'use strict';
function handler(event) {
    var request = event.request;
    
    if (!request.uri || typeof request.uri !== "string") {
        return request;
    }
    
    try {
        var uri = request.uri;
        
        var routeMap = {
            "/": "/index.html",
            "/about": "/about/index.html",
            "/about/": "/about/index.html",
            "/en": "/en/index.html",
            "/en/": "/en/index.html",
        };
        
        if (routeMap[uri] !== undefined) {
            request.uri = routeMap[uri];
            return request;
        }
        
        if (uri.substr(-1) === '/') {
            uri += 'index.html';
        } else if (uri.indexOf('.') === -1) {
            uri += '/index.html';
        }
        
        request.uri = uri;
        return request;
    } catch (error) {
        console.log('CloudFront Function error:', error);
        return request;
    }
}