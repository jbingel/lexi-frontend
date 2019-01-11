/**
 * Created by joachim on 10/13/16.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

/*
 Handle requests
 */
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
            "on-demand simplification now available.");
    }

});

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    id: "change_user",
    title: browser.i18n.getMessage("lexi_change_user"),
    contexts: ["browser_action"]
});

chrome.contextMenus.create({
    id: "remove_user",
    title: "clear user",
    contexts: ["browser_action"]
});

chrome.contextMenus.onClicked.addListener(handle_context_menu_click);
function handle_context_menu_click(info, tab) {
    if (info.menuItemId == "change_user") {
        browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
            return true;
        });
    }

    if (info.menuItemId == "remove_user") {
        browser.storage.sync.clear();
    }
}

var commands = (browser.commands || chrome.commands);
if (commands) {  // TODO somehow this is undefined
    commands.onCommand.addListener(function(command) {
        if (command == "run-lexi") {
            console.log("Received Lexi keyboard shortcut command");
            send_simplify_all_request();
        }
    });
}


// simplify whole page

/**
 * Helper function to execute function in current active tab
 * @param tabCallback
 */
function doInCurrentTab(tabCallback) {
    browser.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {tabCallback(tabArray[0]);}
    );
}

function send_simplify_all_request() {
    console.log("Trying to call simplification for whole page.");
    // TODO display some notification this is running
    var activeTabId;
    doInCurrentTab(function (tab) {
        activeTabId = tab.id;
        browser.tabs.sendMessage(activeTabId, {type: 'simplify_all'}, function () {
            return true;
        })
            .then(function (response) {
                alert("simplification_done!");
                window.close();
            });
    });
}