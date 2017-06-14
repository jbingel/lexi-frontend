/**
 * Created by joachim on 6/7/17.
 */

var login_button = document.getElementById("login_button");
var new_user_button = document.getElementById("new_user_button");
var register_button = document.getElementById("register_button");
var fields_container = document.getElementById("input_fields");
var form = document.getElementById("login_form");
var buttons = document.getElementById("buttons");

/*
 If login button is clicked, try to log in user with provided
 credentials.
 */
login_button.onclick = function(e) {
    // TODO check if password is correct
    e.preventDefault(); // Prevent submission
    var userId = document.getElementById('userId').value;
    chrome.storage.sync.set({
        "ezread_user": {
            "userId": userId
        }});
    window.close();     // Close dialog
};

function add_input_field(fields, name) {
    var field = document.createElement("input");
    field.id = name;
    fields.innerHTML += "<br>"+name+": <br>";
    fields.appendChild(field);
}

register_button.onclick = function (e) {
    // TODO check if email already taken
    window.close();
};

/*
 If register button is clicked, rework form to register new user
 (enter email, password, year of birth, education status).
 */
new_user_button.onclick = function(e) {
    e.preventDefault(); // Prevent submission
    window.resizeTo(500,350);

    // add additional inputs
    add_input_field(fields_container, "email");
    add_input_field(fields_container, "pw");
    add_input_field(fields_container, "pw_repeat");
    add_input_field(fields_container, "year_born");
    add_input_field(fields_container, "education");

    // remove unused buttons and make register button visible
    console.log(buttons);
    buttons.removeChild(login_button);
    buttons.removeChild(new_user_button);
    register_button.style.visibility = "visible";
    console.log(buttons);

    var userId = document.getElementById('userId').value;
    chrome.storage.sync.set({
        "ezread_user": {
            "userId": userId
        }});
    // window.close();     // Close dialog
};