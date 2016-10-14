/**
 * Created by joachim on 10/13/16.
 */

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(null, {file: "smplfy.js"});
});