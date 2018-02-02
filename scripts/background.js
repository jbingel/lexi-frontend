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
    console.log("background.js got a msg..." + request);

    // Request login
    if (request.type === 'request_login') {
        console.log("Received message to request login.");
        browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
            return true;
        });
    }

    // Simplification
    if (request.type === "user_logged_on") {
        // now start the simplifier
        console.log("Received message that user is logged on, " +
            "running simplifications script now.");
        browser.tabs.executeScript(null, {file: "scripts/simplify.js"});
    }

    if (request.type === 'notify') {
        browser.notifications.create("lexi-notifier", {
            "type": "basic",
            "iconUrl": browser.extension.getURL("img/lexi64.png"),
            "title": "Lexi",
            "message": request.msg
        })
    }

    if (request.type === 'feedback_reminder') {
        browser.notifications.create("feedback-reminder", {
            "type": "basic",
            "iconUrl": browser.extension.getURL("img/lexi64.png"),
            "title": "Lexi",
            "message": request.msg,
            "buttons": [{title: request.button_text}]
        })
    }

});



// TODO make main context menu for app (change user)
//
browser.storage.sync.clear();
console.log(browser.storage.sync);

// Listen on browser action (click on icon), then check user is logged on, and finally simplify.
browser.browserAction.onClicked.addListener(function(tabId) {
    browser.tabs.executeScript(null, {file: "config.js"}, function(){
        browser.tabs.executeScript(null, {file: "scripts/jquery-3.1.1.js"}, function() {
            // browser.tabs.executeScript(null, {file: "scripts/iframe_resizer/iframeResizer.min.js"}, function() {
                // browser.tabs.executeScript(null, {file: "scripts/FrameManager.js"}, function() {
                    // browser.tabs.executeScript(null, {file: "scripts/frame.js"}, function() {
                        /* First, make sure user is logged on (aka if userId is set in browser.storage */
                        browser.tabs.executeScript(null, {file: "scripts/user_management.js"}, function () {});
                    // });
                // });
            // });
        });
    });
});
