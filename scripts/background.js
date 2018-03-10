/**
 * Created by joachim on 10/13/16.
 */

// require.config({
//     baseUrl: "."
// });

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

    // Simplification
    if (request.type === "user_logged_on") {
        // now start the simplifier
        console.log("Received message that user is logged on, " +
            "running simplifications script now.");
        browser.tabs.executeScript(null, {file: "scripts/simplify.js"});
    }

});

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    id: "change_user",
    title: browser.i18n.getMessage("lexi_change_user"),
    contexts: ["browser_action"]
});

chrome.contextMenus.onClicked.addListener(handle_context_menu_click);
function handle_context_menu_click(info, tab) {
    if (info.menuItemId == "change_user") {
        browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
            return true;
        });
    }
}

var commands = (browser.commands || chrome.commands);
if (commands) {  // TODO somehow this is undefined
    commands.onCommand.addListener(function(command) {
        if (command == "run-lexi") {
            console.log("Received Lexi keyboard shortcut command");
            main();
        }
    });
}


function main() {
    // check user is logged on, and finally simplify.
    browser.tabs.executeScript(null, {file: "config.js"}, function(){
        browser.tabs.executeScript(null, {file: "scripts/jquery-3.1.1.js"}, function() {
            /* First, make sure user is logged on (aka if userId is set in browser.storage */
            // browser.tabs.executeScript(null, {file: "scripts/user_management.js"}, function () {});
            browser.tabs.executeScript(null, {file: "scripts/ondemand.js"}, function () {});
        });
    });
}
browser.browserAction.onClicked.addListener(function(tabId) {
    console.log("Click on Lexi icon");
    main();
});


