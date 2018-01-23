/**
 * Created by joachim on 8/17/17.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

// Important elements
var lexi_login_modal = document.getElementById("lexi-login-modal");
var msg_field = document.getElementById("lexi-error-message-field");
var login_button = document.getElementById("lexi-login-button");
var new_user_button = document.getElementById("lexi-new-user-button");
var register_button = document.getElementById("lexi-register-button");
var back_to_login_button = document.getElementById("lexi-back-to-login-button");
var expanded_inputs =  document.getElementById("lexi-expanded-inputs");
var lexi_login_form = document.getElementById("lexi-login-form");
var lexi_login_modal_close = document.getElementById("lexi-login-modal-close");

// Insert Year of Birth options
var yob_selector = $('#lexi-year-of-birth')
yob_selector.append($('<option />').val('').html(''));
for (var i = new Date().getFullYear()-6; i >= 1900; i--) {
    yob_selector.append($('<option />').val(i).html(i));
}

// This script can't delete the iframe it lives in, therefore has to
// send message to content script (via background.js)
function send_close_login_message() {
    browser.runtime.sendMessage({type:'delete_login_iframe'}, function () {
        return true;
    });
}

// When the user clicks on the cross in the upper right corner, close modal
lexi_login_modal_close.addEventListener('click', function () {
    send_close_login_message()
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == lexi_login_modal) {
        send_close_login_message()
    }
};

function display_error(message) {
    if (msg_field) {
        if (message) {
            msg_field.style.display = "block";
            msg_field.innerHTML = message+"<br/>";
        } else {
            msg_field.style.display = "none";
        }
    }
}

/* ******************************* *
 * ******************************* *
 * ********* AJAX CALLS ********** *
 * ******************************* *
 * ******************************* */

/**
 *
 * @param {string} url
 * @param {string} email
 * @param {string} year_of_birth
 * @param {string} education
 * @returns {Promise}
 */
function registerAjaxCall(email, year_of_birth, education) {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = email.toLowerCase();
    // request['pw_hash'] = pw_hash;
    request['year_of_birth'] = year_of_birth;
    request['education'] = education;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
            // console.log(this.responseText);
        };
        xhr.onerror = function(e){
            display_error(browser.i18n.getMessage("lexi_unknown_server_error"));
        };
        xhr.open("POST", SERVER_URL_REGISTER, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/**
 *
 * @param {string} url
 * @param {string} email
 * @returns {Promise}
 */
function loginAjaxCall(email) {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = email.toLowerCase();
    // request['pw_hash'] = pw_hash;
    return new Promise(function(resolve, reject) {
        console.log(request);
        console.log(SERVER_URL_LOGIN);
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            display_error(browser.i18n.getMessage("lexi_unknown_server_error"));
        };
        xhr.open("POST", SERVER_URL_LOGIN, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/* ******************************* *
 * ******************************* *
 * ****** BUTTON LISTENERS ******* *
 * ******************************* *
 * ******************************* */

/*
 If login button is clicked, try to log in user with provided
 credentials.
 */
function loginbuttonclick () {
    // e.preventDefault(); // Prevent submission
    var email = document.getElementById('lexi-email').value;
    // var pw = document.getElementById('password').value;
    if (email) {
        // var pw_hash = md5(pw);
        loginAjaxCall(email).then(function (result) {
            if (result.status == 200) {
                browser.storage.sync.set({
                    "lexi_user": {
                        "userId": email
                    }
                });
                console.log("Sending message that user is logged on...");
                browser.runtime.sendMessage({type:'user_logged_on'}, function () {
                });
                // lexi_login_modal.style.display = "none";
                send_close_login_message();
            } else if (result.status == 710) {
                display_error(browser.i18n.getMessage("lexi_login_error_710"));
            } else {
                display_error(browser.i18n.getMessage("lexi_login_error_unkown")
                    + result.message);
            }
        });
    } else {
        display_error(browser.i18n.getMessage("lexi_no_email_error"));
    }
}

login_button.addEventListener('click',
    function() {loginbuttonclick()},
    false
);

/*
 If register button is clicked, submit fields to server and
 ask if registration in database has worked
 */
function registerbuttonclick () {
    var email = document.getElementById('lexi-email').value;
    // var pw = document.getElementById('password').value;
    // var pw_repeat = document.getElementById('password_repeat').value;
    var year_of_birth = document.getElementById('lexi-year-of-birth').value;
    var education = document.getElementById('lexi-education').value;
    if (email && year_of_birth && education) {
        // var email_hash = md5(email);
        var email_hash = email;
        registerAjaxCall( email_hash, year_of_birth, education).then(
            function (result) {
                console.log(result);
                console.log(result.status);
                if (result.status == 200) {
                    browser.storage.sync.set({
                        "lexi_user": {
                            "userId": email
                        }
                    });
                    browser.runtime.sendMessage({type:'user_logged_on'}, function () {

                    });
                    // lexi_login_modal.style.display = "none";
                    send_close_login_message()
                } else {
                    display_error(result.message + "<br/>");
                }
            });
    } else {
        display_error(browser.i18n.getMessage("lexi_fields_not_set_error"));
    }
}

register_button.addEventListener('click',
    function() {registerbuttonclick()},
    false
);

/*
 If new_user button is clicked, rework lexi_login_form to register new user
 (enter email, password, year of birth, education status).
 */
new_user_button.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent submission
    expanded_inputs.style.display = "block";
    // remove unused buttons and make register button visible
    login_button.style.cssText = "display:none !important";
    new_user_button.style.cssText = "display:none !important";
    back_to_login_button.style.display = "block";
    register_button.style.display = "block";
    display_error(null);
});

/*
 If 'back to login' button is clicked, remove all registration
 fields and buttons and go back to original form
 */
back_to_login_button.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent submission
    expanded_inputs.style.cssText = "display:none !important";
    login_button.style.display = "block";
    new_user_button.style.display = "block";
    register_button.style.cssText = "display:none !important";
    back_to_login_button.style.cssText = "display:none !important";
    display_error(null);
});
