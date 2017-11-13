/**
 * Created by joachim on 8/17/17.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var frontend_version = browser.runtime.getManifest().version;

var SERVER_URL = "https://www.readwithlexi.net/lexi/";
var SERVER_URL_LOGIN = SERVER_URL+"/login";
var SERVER_URL_REGISTER = SERVER_URL+"/register_user";

var logo_url = browser.runtime.getURL("img/lexi.png");
var backarrow_url = browser.runtime.getURL("img/backarrow.png");

function inject_login_modal() {
    var form_html = "";
    form_html += '<div id="lexi-login-modal" class="lexi-frontend lexi-modal" style="display: block">';
    form_html += '<form id="lexi-login-form" class="lexi-modal-content animate">';

    form_html += '<div id="lexi-input-fields" class="lexi-modal-container">';
    form_html += '<span onclick="document.getElementById(\'lexi-login-modal\').style.display=\'none\'" style="float: right;" class="close" title="Close">&times;</span>';


    // form_html += '<div id="lexi-lang-select"> \
    //     <form action="scripts/langswitch.js"> \
    //     <select id="country-options" name="country-options">\
    //     <option selected="selected" title="http://www.yoursite.com" value="us">United States</option> \
    //     </select> \
    //     <input value="Select" type="submit" /> \
    //     </form> \
    //     </div>';

    form_html += '<img id="lexi-logo" src="'+logo_url+'" /><br/>';
    form_html += '<p>'+browser.i18n.getMessage("lexi_login_email")+ '</p>';
    form_html += '<input type="email" id="lexi-email">';

    form_html += '<div id="lexi-expanded-inputs" style="display: none !important;">';
    form_html += '<p>'+browser.i18n.getMessage("lexi_login_yearofbirth")+'</p>';
    form_html += '<select name="yearpicker" id="lexi-year-of-birth"></select>';

    form_html += '<p>'+browser.i18n.getMessage("lexi_login_education")+'</p>';
    form_html += '<select name="education" id="lexi-education">';
    form_html += '<option value="primary">'+browser.i18n.getMessage("lexi_login_education_primary")+'</option>';
    form_html += '<option value="secondary">'+browser.i18n.getMessage("lexi_login_education_secondary")+'</option>'
    form_html += '<option value="higher">'+browser.i18n.getMessage("lexi_login_education_higher")+'</option>'
    form_html += '</select>';
    form_html += '</div>';

// form_html += '<div id="lexi-buttons_container" class="buttons">';
// form_html += '<div class="buttons" id="buttons">';
    form_html += '<button id="lexi-login-button" type="button" value="Login" class="lexi-button">'+browser.i18n.getMessage("lexi_login_button")+'</button>';
    form_html += '<button id="lexi-new-user-button" type="button" value="Create new user" class="lexi-button">'+browser.i18n.getMessage("lexi_login_newuser")+'</button>';
    form_html += '<button id="lexi-register-button" type="button" value="Register" style="display: none !important;" class="lexi-button">'+browser.i18n.getMessage("lexi_login_register")+'</button>';
    form_html += '<button id="lexi-back-to-login-button" type="button" value="back" class="lexi-button" style="display: none !important;">' +
        '<img src="'+backarrow_url+'" style="height: 15px; padding-right: 5px; vertical-align:middle"/>'+
        browser.i18n.getMessage("lexi_login_backtologin")+
        '</button>';
    form_html += '<div id="lexi-error-message-field" style="display: none;"></div>';
    form_html += '</div>';  // container

    form_html += '</form>';  // login form
    form_html += '</div>';  // login modal

    document.body.innerHTML += form_html;

    $('#lexi-year-of-birth').append($('<option />').val('').html(''));
    for (i = new Date().getFullYear()-6; i > 1900; i--)
    {
        $('#lexi-year-of-birth').append($('<option />').val(i).html(i));
    }

    return document.getElementById("lexi-login-modal");
}

var lexi_login_modal = document.getElementById("lexi-login-modal");

if (lexi_login_modal) {
    lexi_login_modal.style.display = "block";
} else {
    lexi_login_modal = inject_login_modal();
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == lexi_login_modal) {
        lexi_login_modal.style.display = "none";
    }
};

function display_error(message) {
    if (msg_field) {
        msg_field.style.display = "block";
        msg_field.innerHTML = message;
    }
}

var msg_field = document.getElementById("lexi-error-message-field");
var login_button = document.getElementById("lexi-login-button");
var new_user_button = document.getElementById("lexi-new-user-button");
var register_button = document.getElementById("lexi-register-button");
var back_to_login_button = document.getElementById("lexi-back-to-login-button");
var fields_container = document.getElementById("lexi-input-fields");
var expanded_inputs =  document.getElementById("lexi-expanded-inputs");
var lexi_login_form = document.getElementById("lexi-login-form");
var buttons = document.getElementById("lexi-buttons");


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
    request['email'] = email;
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
            display_error("Unknown Error Occured. Server response not received.");
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
    request['email'] = email;
    // request['pw_hash'] = pw_hash;
    return new Promise(function(resolve, reject) {
        console.log(request);
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            display_error("Unknown Error Occured. Server response not received.<br/>");
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

// function debugloginbuttonclick() {
//     browser.storage.sync.set({
//         "lexi_user": {
//             "userId": "joabingel@gmail.com"
//         }
//     });
//     browser.runtime.sendMessage({type:'user_logged_on'}, function () {});
//     lexi_login_modal.style.display = "none";
//
// }

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
                lexi_login_modal.style.display = "none";
            } else {
                display_error(result.message + "<br/>");
            }
        });
    } else {
        display_error("Need to provide email.<br/>");
    }
}

login_button.addEventListener('click',
    function() {loginbuttonclick()},
    // function() {debugloginbuttonclick()},
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
                    lexi_login_modal.style.display = "none";
                } else {
                    display_error(result.message + "<br/>");
                }
            });
    } else {
        display_error("Need to set all fields.<br/>");
    }
}

register_button.addEventListener('click',
    function() {registerbuttonclick()},
    false
);


back_to_login_button.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent submission
    // expanded_inputs.style.display = "none !important";
    // expanded_inputs.visibility = "hidden";
    expanded_inputs.style.cssText = "display:none !important";
    login_button.style.display = "block";
    new_user_button.style.display = "block";
    // register_button.style.display = "none !important";
    // register_button.visibility = "hidden";
    register_button.style.cssText = "display:none !important";
    // back_to_login_button.style.display = "none !important";
    // back_to_login_button.visibility = "hidden";
    back_to_login_button.style.cssText = "display:none !important";
    msg_field.style.display = "block";
});


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

});
