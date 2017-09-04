/**
 * Created by joachim on 8/17/17.
 */

SERVER_URL = "http://127.0.0.1:5000";
var logo_url = chrome.runtime.getURL("img/lexi.png");


function inject_login_modal() {
    var form_html = "";
    form_html += '<div id="lexi_login_modal" class="lexi-frontend" style="display: block">';
    form_html += '<form id="lexi_login_form" class="modal-content animate">';
    form_html += '<span onclick="document.getElementById(\'lexi_login_modal\').style.display=\'none\'" style="float: right" class="close" title="Close">&times;</span>';

    form_html += '<div id="input_fields" class="container">';
    form_html += '<img id="lexi_logo" src="'+logo_url+'" /><br/>';
    form_html += 'Email-adresse<br/>';
    form_html += '<input type="email" id="email">';

    form_html += '<div id="lexi_expanded_inputs" style="display: none;">';
    form_html += 'Year of birth<br/>';
    form_html += '<select name="yearpicker" id="year_of_birth"></select>';

    form_html += 'Education<br/>';
    form_html += '<select name="education" id="education">';
    form_html += '<option value="primary">Primary school</option>';
    form_html += '<option value="secondary">Secondary school</option>';
    form_html += '<option value="higher">Higher Education</option>';
    form_html += '</select>';
    form_html += '</div>';

// form_html += '<div id="lexi_buttons_container" class="buttons">';
// form_html += '<div class="buttons" id="buttons">';
    form_html += '<button id="login_button" type="button" value="Login" class="lexi_button">Login</button>';
    form_html += '<button id="new_user_button" type="button" value="Create new user" class="lexi_button">Create new user</button>';
    form_html += '<button id="back_to_login_button" type="button" value="back" style="display: none;" class="lexi_button">Back to Login</button>';
    form_html += '<button id="register_button" type="button" value="Register" style="display: none;" class="lexi_button">Register</button>';
    form_html += '<div id="lexi_error_message_field" style="display: none;"></div>';
    form_html += '</div>';  // container

    form_html += '</form>';  // login form
    form_html += '</div>';  // login modal

    document.body.innerHTML += form_html;

    for (i = new Date().getFullYear(); i > 1900; i--)
    {
        $('#year_of_birth').append($('<option />').val(i).html(i));
    }

    return document.getElementById("lexi_login_modal");
}

var lexi_login_modal = document.getElementById("lexi_login_modal");

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
    var msg_field = document.getElementById("lexi_error_message_field");
    if (msg_field) {
        msg_field.style.display = "block";
        msg_field.innerHTML = message;
    }
}

var login_button = document.getElementById("login_button");
var new_user_button = document.getElementById("new_user_button");
var register_button = document.getElementById("register_button");
var back_to_login_button = document.getElementById("back_to_login_button");
var fields_container = document.getElementById("input_fields");
var expanded_inputs =  document.getElementById("lexi_expanded_inputs");
var lexi_login_form = document.getElementById("lexi_login_form");
var buttons = document.getElementById("buttons");


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
function registerAjaxCall(url, email, year_of_birth, education) {
    var request = {};
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
        xhr.open("POST", url, true);
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
function loginAjaxCall(url, email) {
    var request = {};
    request['email'] = email;
    // request['pw_hash'] = pw_hash;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            display_error("Unknown Error Occured. Server response not received.<br/>");
        };
        xhr.open("POST", url, true);
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
    var email = document.getElementById('email').value;
    // var pw = document.getElementById('password').value;
    if (email) {
        // var pw_hash = md5(pw);
        loginAjaxCall(SERVER_URL+"/login", email).then(function (result) {
            if (result.status == 200) {
                chrome.storage.sync.set({
                    "lexi_user": {
                        "userId": email
                    }
                });
                chrome.runtime.sendMessage({type:'user_logged_on'}, function () {

                });
                lexi_login_modal.style.display = "none";
            } else {
                display_error(result.message + "<br/>");
            }
        });
    } else {
        display_error("Need to provide email.<br/>");
    };
    console.log("login button: ");
    console.log(document.getElementById("login_button"));
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
    var email = document.getElementById('email').value;
    // var pw = document.getElementById('password').value;
    // var pw_repeat = document.getElementById('password_repeat').value;
    var year_of_birth = document.getElementById('year_of_birth').value;
    var education = document.getElementById('education').value;
    if (email && year_of_birth && education) {
        // var email_hash = md5(email);
        var email_hash = email;
        registerAjaxCall(SERVER_URL+"/register_user", email_hash, year_of_birth, education).then(
            function (result) {
                alert(result);
                console.log(result);
                console.log(result.status);
                if (result.status == 200) {
                    chrome.storage.sync.set({
                        "lexi_user": {
                            "userId": email
                        }
                    });
                    chrome.runtime.sendMessage({type:'user_logged_on'}, function () {

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
    expanded_inputs.style.display = "none";
    login_button.style.display = "block";
    new_user_button.style.display = "block";
    register_button.style.display = "none";
    back_to_login_button.style.display = "none";
});


/*
 If new_user button is clicked, rework lexi_login_form to register new user
 (enter email, password, year of birth, education status).
 */
new_user_button.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent submission
    expanded_inputs.style.display = "block";
    // remove unused buttons and make register button visible
    login_button.style.display = "none";
    new_user_button.style.display = "none";
    back_to_login_button.style.display = "block";
    register_button.style.display = "block";

});
