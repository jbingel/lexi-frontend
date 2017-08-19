/**
 * Created by joachim on 8/17/17.
 */


SERVER_URL = "http://127.0.0.1:5000";

// var ezread_login_modal = document.createElement("div");
// ezread_login_modal.id = "ezread_login_modal"; ezread_login_modal.class = "ezread";
// ezread_login_modal.style.display='block';
//
// var form = document.createElement("form");
// form.id = "ezread_login_form"; form.class = "modal-content animate";
//
// var input_fields = document.createElement("div");
// input_fields.id = "input_fields";
// input_fields.innerHTML += 'Email-adresse: <br/>';
// input_fields.innerHTML += '<input type="email" id="email">';
// input_fields.innerHTML += 'Password: <br/>';
// input_fields.innerHTML += '<input type="password" id="password">';
//
// var buttons = document.createElement("div");
// buttons.id = "buttons"; buttons.class="buttons";
// var login_button = document.createElement("button");
// login_button.id = "login_button"; login_button.type = "submit"; login_button.value= "Login";


var form_html = "";

form_html += '<div id="ezread_login_modal" class="ezread" style="display: block">';
form_html += '    <form id="ezread_login_form" class="modal-content animate">';
form_html += '<div id="input_fields">';
form_html += 'Email-adresse: <br/>';
form_html += '<input type="email" id="email">';
form_html += '<br/> Password: <br/>';
form_html += '<input type="password" id="password">';
form_html += '</div>';
form_html += '<div class="buttons" id="buttons">';
form_html += '<button id="login_button" type="submit" value="Login" class="ezread_button">Login</button>';
form_html += '<br/>';
form_html += '<button id="new_user_button" type="submit" value="Create new user" class="ezread_button">Create new user</button>';
form_html += '<br/>';
form_html += '<button id="register_button" type="submit" value="Register" style="visibility: hidden;" class="ezread_button">Register</button>';
form_html += '</div>';
form_html += '</form>';
form_html += '</div>';

document.body.innerHTML += form_html;

var ezread_login_modal = document.getElementById("ezread_login_modal");

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == ezread_login_modal) {
        ezread_login_modal.style.display = "none";
    }
};



var login_button = document.getElementById("login_button");
var new_user_button = document.getElementById("new_user_button");
var register_button = document.getElementById("register_button");
var fields_container = document.getElementById("input_fields");
var form = document.getElementById("ezread_login_form");
var buttons = document.getElementById("buttons");

// // TODO provide option for password recovery

/* ******************************* *
 * ******************************* *
 * ********* AJAX CALLS ********** *
 * ******************************* *
 * ******************************* */

/**
 *
 * @param {string} url
 * @param {string} email
 * @param {string} pw_hash
 * @param {string} year_of_birth
 * @param {string} education
 * @returns {Promise}
 */
function registerAjaxCall(url, email, pw_hash, year_of_birth, education) {
    var request = {};
    request['email'] = email;
    request['pw_hash'] = pw_hash;
    request['year_of_birth'] = year_of_birth;
    request['education'] = education;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
            // console.log(this.responseText);
        };
        xhr.onerror = reject;
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
 * @param {string} pw_hash
 * @returns {Promise}
 */
function loginAjaxCall(url, email, pw_hash) {
    alert("logging in...");
    var request = {};
    request['email'] = email;
    request['pw_hash'] = pw_hash;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = reject;
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
login_button.onclick = function(e) {
    alert('clicked login button');
    e.preventDefault(); // Prevent submission
    var email = document.getElementById('email').value;
    var pw = document.getElementById('password').value;
    if (email && pw) {
        var pw_hash = md5(pw);
        loginAjaxCall(SERVER_URL+"/login", email, pw_hash).then(function (result) {
            if (result.status == 200) {
                chrome.storage.sync.set({
                    "ezread_user": {
                        "userId": email
                    }
                });
                chrome.runtime.sendMessage({type:'user_logged_on'}, function () {

                });
                ezread_login_modal.style.display = "none";
            } else {
                // TODO here and later, also register: don't just revert form to beginning (also buttons get inactive then)
                form.innerHTML += result.message + "<br/>"
            }
        });
    } else {
        form.innerHTML += "Need to set email and password.<br/>"
    }
};

/*
 If register button is clicked, submit fields to server and
 ask if registration in database has worked
 */
register_button.onclick = function (e) {
    e.preventDefault(); // Prevent submission
    var email = document.getElementById('email').value;
    var pw = document.getElementById('password').value;
    var pw_repeat = document.getElementById('password_repeat').value;
    var year_of_birth = document.getElementById('year_of_birth').value;
    var education = document.getElementById('education').value;
    if (email && pw && pw_repeat && year_of_birth && education) {
        if (pw != pw_repeat) {
            form.innerHTML += "Passwords do not match.<br/>";
        } else {
            var pw_hash = md5(pw);
            registerAjaxCall(SERVER_URL+"/register_user", email, pw_hash, year_of_birth, education).then(
                function (result) {
                    if (result.status == 200) {
                        chrome.storage.sync.set({
                            "ezread_user": {
                                "userId": email
                            }
                        });
                        chrome.runtime.sendMessage({type:'user_logged_on'}, function () {

                        });
                        ezread_login_modal.style.display = "none";
                    } else {
                        form.innerHTML += result.message + "<br/>";
                    }
                });
        }
    } else {
        form.innerHTML += "Need to set all fields.<br/>";
    }
};

/*
 If new_user button is clicked, rework form to register new user
 (enter email, password, year of birth, education status).
 */
new_user_button.onclick = function(e) {
    e.preventDefault(); // Prevent submission
    // TODO resize?
    // add additional inputs
    // add_input_field(fields_container, "email");
    // add_input_field(fields_container, "pw");
    add_input_field(fields_container, "password_repeat");
    add_input_field(fields_container, "year_of_birth");
    add_input_field(fields_container, "education");

    // remove unused buttons and make register button visible
    console.log(buttons);
    buttons.removeChild(login_button);
    buttons.removeChild(new_user_button);
    register_button.style.visibility = "visible";
    console.log(buttons);

    var userId = document.getElementById('email').value;
    chrome.storage.sync.set({
        "ezread_user": {
            "userId": email
        }});
};


function add_input_field(fields, name) {
    var field = document.createElement("input");
    field.id = name;
    fields.innerHTML += "<br>"+name+": <br>";
    fields.appendChild(field);
};
