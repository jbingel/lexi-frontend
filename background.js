/**
 * Created by joachim on 10/13/16.
 */

function setPassword(password) {
    // Do something, eg..:
    console.log(password);
};

var SERVER_URL = "http://127.0.0.1:5000";

chrome.browserAction.onClicked.addListener(function(tabId) {
    /* First, make sure user is logged on (aka if userId is set in chrome.storage */

    // // Speed up calls to hasOwnProperty
    // var hasOwnProperty = Object.prototype.hasOwnProperty;
    //
    // var userId;
    // chrome.storage.local.clear();
    // chrome.storage.local.get('ezread_userId', function(uId) {  //TODO probably gotta work with Promise here again, as function reads user Id only after everything else (incl. simplfy.js) is called
    //     console.log(uId);
    //     if (isEmpty(uId)) {
    //         console.log("CREATING POPUP...")
    //         chrome.tabs.create({
    //             url: runtime.getURL('user_cred.html'),
    //             active: false
    //         }, function(tab) {
    //             chrome.windows.create({
    //                 tabId: tab.id,
    //                 type: 'popup',
    //                 focused: true
    //                 // incognito, top, left, ...
    //             });
    //         });
    //         uId = "foo"; // TODO
    //     }
    //     userId = uId;
    //     chrome.storage.local.set({'ezread_userId': userId});
    // });
    // console.log(userId);
    //
    //
    // // from https://stackoverflow.com/questions/4994201/is-object-empty
    // function isEmpty(obj) {
    //
    //     // null and undefined are "empty"
    //     if (obj == null) return true;
    //
    //     // Assume if it has a length property with a non-zero value
    //     // that that property is correct.
    //     if (obj.length > 0)    return false;
    //     if (obj.length === 0)  return true;
    //
    //     // If it isn't an object at this point
    //     // it is empty, but it can't be anything *but* empty
    //     // Is it empty?  Depends on your application.
    //     if (typeof obj !== "object") return true;
    //
    //     // Otherwise, does it have any properties of its own?
    //     // Note that this doesn't handle
    //     // toString and valueOf enumeration bugs in IE < 9
    //     for (var key in obj) {
    //         if (hasOwnProperty.call(obj, key)) return false;
    //     }
    //
    //     return true;
    // }

    chrome.tabs.executeScript(null, {file: "jquery-3.1.1.js"}, function(){
        /* First, make sure user is logged on (aka if userId is set in chrome.storage */
        chrome.tabs.executeScript(null, {file: "user_management.js"});
        /* Now that we're sure the userId is set, we can launch the simplifier */
        chrome.tabs.executeScript(null, {file: "smplfy.js"});
    });
});