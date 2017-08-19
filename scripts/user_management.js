/**
 * Created by joachim on 6/6/17.
 */

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;


// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     alert(tabs[0].id);
//     chrome.tabs.sendMessage(tabs[0].id, {type:'request_password'});
// });

function check_user_login() {
    var userId;
    chrome.storage.sync.get('ezread_user',
        function(uId) {
            console.log(uId);
            if (isEmpty(uId)) {
                console.log("User not logged on. Requesting credentials...");
                // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                //     alert("sending msg... "+ tabs[0].id);
                //     alert(tabs[0].id);
                //     chrome.tabs.sendMessage(tabs[0].id, {type: 'request_password'}, function (response) {
                //         alert("response: "+response);
                //         // callback();
                //     });
                // });
                chrome.runtime.sendMessage({type:'request_password'}, function () {  // TODO work with response here, check if login actually worked
                    chrome.runtime.sendMessage({type:'user_logged_on'}, function () {
                        alert("Message sent");
                        return true;
                    });
                });
            } else {
                userId = uId.ezread_user.userId;
                console.log("User ID: "+userId);
                // here we can assume user is logged on just fine
                chrome.runtime.sendMessage({type:'user_logged_on'}, function () {
                    // alert("Message sent");
                    return true;
                });
                // callback();
            }
        })
}

// from https://stackoverflow.com/questions/4994201/is-object-empty
function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

check_user_login();