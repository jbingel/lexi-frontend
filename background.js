/**
 * Created by joachim on 10/13/16.
 */
chrome.browserAction.onClicked.addListener(function(tabId) {
    chrome.tabs.executeScript(null, {file: "jquery-3.1.1.js"}, function(){
        chrome.tabs.executeScript(null, {file: "smplfy.js"});
    });
});