/**
 * Created by joachim on 6/7/17.
 */


window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var SERVER_URL = "https://www.readwithlexi.net/lexi/";

// var login_button = document.getElementById("login_button");
// var new_user_button = document.getElementById("new_user_button");
// var register_button = document.getElementById("register_button");
// var fields_container = document.getElementById("input_fields");
// var lexi_login_form = document.getElementById("lexi_login_form");
// var buttons = document.getElementById("buttons");
//
// alert(login_button);
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
//
// function lexi_loginbutton_click() {
//     alert('clicked login button');
//     e.preventDefault(); // Prevent submission
//     var email = document.getElementById('email').value;
//     var pw = document.getElementById('password').value;
//     if (email && pw) {
//         var pw_hash = md5(pw);
//         loginAjaxCall(SERVER_URL+"/login", email, pw_hash).then(function (result) {
//             if (result.status == 200) {
//                 browser.storage.sync.set({
//                     "lexi_user": {
//                         "userId": email
//                     }
//                 });
//                 window.close();
//             } else {
//                 // TODO here and later, also register: don't just revert lexi_login_form to beginning (also buttons get inactive then)
//                 lexi_login_form.innerHTML += result.message + "<br/>"
//             }
//         });
//     } else {
//         lexi_login_form.innerHTML += "Need to set email and password.<br/>"
//     }
// }

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
                browser.storage.sync.set({
                    "lexi_user": {
                        "userId": email
                    }
                });
                window.close();
            } else {
                // TODO here and later, also register: don't just revert lexi_login_form to beginning (also buttons get inactive then)
                lexi_login_form.innerHTML += result.message + "<br/>"
            }
        });
    } else {
        lexi_login_form.innerHTML += "Need to set email and password.<br/>"
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
            lexi_login_form.innerHTML += "Passwords do not match.<br/>";
        } else {
            var pw_hash = md5(pw);
            registerAjaxCall(SERVER_URL+"/register_user", email, pw_hash, year_of_birth, education).then(
                function (result) {
                    if (result.status == 200) {
                        browser.storage.sync.set({
                            "lexi_user": {
                                "userId": email
                            }
                        });
                        // window.close();
                    } else {
                        lexi_login_form.innerHTML += result.message + "<br/>";
                    }
            });
        }
    } else {
        lexi_login_form.innerHTML += "Need to set all fields.<br/>";
    }
};

/*
 If new_user button is clicked, rework lexi_login_form to register new user
 (enter email, password, year of birth, education status).
 */
new_user_button.onclick = function(e) {
    e.preventDefault(); // Prevent submission

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
    browser.storage.sync.set({
        "lexi_user": {
            "userId": email
        }});
};


function add_input_field(fields, name) {
    var field = document.createElement("input");
    field.id = name;
    fields.innerHTML += "<br>"+name+": <br>";
    fields.appendChild(field);
}
