/**
 * Created by joachim on 6/7/17.
 */

// function login(form)
// {
//     chrome.storage.sync.set({"ezread_userId": form.userId});
//     console.log(form);
//     console.log(chrome.storage.sync);
// }

document.getElementById("login_button").onclick = function(e) {
    e.preventDefault(); // Prevent submission
    var userId = document.getElementById('userId').value;
    chrome.storage.sync.set({
        "ezread_user": {
            "userId": userId
        }});
    window.close();     // Close dialog
};


document.getElementById("register_button").onclick = function(e) {
    e.preventDefault(); // Prevent submission
    var form = document.getElementById("login_form").outerHTML;
    var userId_input = document.getElementById("userId");
    alert(form);
    
    var email = document.createElement("input");
    var pw = document.createElement("input");
    var pw_repeat = document.createElement("input");
    var year_born = document.createElement("input");
    var education = document.createElement("input");

    form.insertChildAfter(userId_input, email);
    form.insertAfter(pw, email);
    form.insertAfter(pw_repeat, pw);
    form.insertAfter(year_born, pw_repeat);
    form.insertAfter(education, year_born);

    var userId = document.getElementById('userId').value;
    chrome.storage.sync.set({
        "ezread_user": {
            "userId": userId
        }});
    window.close();     // Close dialog
};