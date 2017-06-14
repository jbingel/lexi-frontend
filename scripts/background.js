/**
 * Created by joachim on 10/13/16.
 */

require.config({
    baseUrl: "."
});

function login_user(userId) {
    // chrome.storage.sync.set({"ezread_userId": userId});
    console.log("USERNAME: "+userId);
    alert(userId);
    alert(chrome.storage.sync);
}

var SERVER_URL = "http://127.0.0.1:5000";

// Handle requests for passwords
chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'request_password') {
        chrome.tabs.create({
            url: chrome.extension.getURL('pages/user_cred.html'),
            active: false
        }, function(tab) {
            // After the tab has been created, open a window to inject the tab
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true,
                height: 135, width:500,
            });
        });
    }
    // sendResponse({"a": 2});  // TODO send response if everything worked out
    return true;
});


chrome.runtime.onMessage.addListener(function (request) {
    if (request.type === "user_logged_on") {
        // now start the simplifier
        chrome.tabs.executeScript(null, {file: "scripts/smplfy.js"});
    }
});


chrome.storage.sync.clear();
console.log(chrome.storage.sync);

// Listen on browser action (click on icon), then check user is logged on, and finally simplify.
chrome.browserAction.onClicked.addListener(function(tabId) {
    chrome.tabs.executeScript(null, {file: "scripts/jquery-3.1.1.js"}, function(){
        /* First, make sure user is logged on (aka if userId is set in chrome.storage */
        // require(['user_management'], function(user_management) {
        //     check_user_login(function () {
                chrome.tabs.executeScript(null, {file: "scripts/user_management.js"},
                    function () {
                        // chrome.tabs.executeScript(null, {file: "scripts/smplfy.js"});
                });
                /* Now that we're sure the userId is set, we can launch the simplifier */

                // chrome.tabs.executeScript(null, {file: "smplfy.js"});
            // });
        // });
    });
});