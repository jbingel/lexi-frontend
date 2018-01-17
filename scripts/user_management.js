/**
 * Created by joachim on 6/6/17.
 */


window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;


// browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     alert(tabs[0].id);
//     browser.tabs.sendMessage(tabs[0].id, {type:'request_password'});
// });

function check_user_login() {
    var userId;
    browser.storage.sync.get('lexi_user', function(uId) {
        console.log(uId);
        if (isEmpty(uId)) {
            console.log("User not logged on. Requesting credentials...");
            browser.runtime.sendMessage({type:'request_login'}, function () {  // TODO work with response here, check if login actually worked
                // console.log("Sending message to request login...");
                // browser.runtime.sendMessage({type:'user_logged_on'}, function () {
                //     return true;
                // });
            });
        } else {
            userId = uId.lexi_user.userId;
            console.log("User ID: "+userId);
            // here we can assume user is logged on just fine
            browser.runtime.sendMessage({type:'user_logged_on'}, function () {
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