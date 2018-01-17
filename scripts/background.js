/**
 * Created by joachim on 10/13/16.
 */

require.config({
    baseUrl: "."
});

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

// Handle requests
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Request login
    if (request.type === 'request_login') {
        console.log("Received message to request login.");
        browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
            return true;
        });
    }

    // Close login form (by deleting login iframe)
    if (request.type === 'delete_login_iframe') {
        // send message to all tabs  TODO this is really ugly... but how to know the right tab ID?
        browser.tabs.query({}, function(tabs) {
            for (var i=0; i<tabs.length; ++i) {
                browser.tabs.sendMessage(tabs[i].id, {type:'delete_login_iframe_echo'}, function () {
                    return true;
                });
            }
        });
    }

    // Simplification
    if (request.type === "user_logged_on") {
        // now start the simplifier
        console.log("Received message that user is logged on, " +
            "running simplifications script now.");
        browser.tabs.executeScript(null, {file: "scripts/simplify.js"});
    }
});



// TODO make main context menu for app (change user)


browser.storage.sync.clear();
console.log(browser.storage.sync);

// Listen on browser action (click on icon), then check user is logged on, and finally simplify.
browser.browserAction.onClicked.addListener(function(tabId) {
    browser.tabs.executeScript(null, {file: "scripts/jquery-3.1.1.js"}, function(){
        /* First, make sure user is logged on (aka if userId is set in browser.storage */
        browser.tabs.executeScript(null, {file: "scripts/user_management.js"},
            function () {
            });
    });
});
