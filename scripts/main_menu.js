/**
 * Created by joachim on 5/9/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();
var frontend_version = browser.runtime.getManifest().version;

// get variables for popup elements
var button_simplify = document.getElementById("button-simplify-all");
var button_simplify_img = document.getElementById("button-simplify-all-img");
var button_simplify_txt = document.getElementById("button-simplify-all-text");
var button_changeuser = document.getElementById("button-changeuser");
var button_changeuser_txt = document.getElementById("button-changeuser-text");
var error_content = document.getElementById("error-content");
var update_content = document.getElementById("update-content");

var SERVER_URL = settings.LEXI_SERVER_URL;
var TEST_CONNECTION_URL = SERVER_URL + "/test_connection";
var NEW_VERSION_URL = SERVER_URL + "/versioncheck";

/* TEST CONNECTION */
function test_connection() {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = warn_lexi_down;
        xhr.open("POST", TEST_CONNECTION_URL, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/* TEST USER REGISTERED */
function test_user_registered() {
    browser.storage.sync.get('lexi_user', function (usr_object) {
        return !!usr_object;
    })
}

function warn_lexi_down() {
    button_simplify.classList.add("disabled");
    button_changeuser.classList.add("disabled");
    error_content.textContent = browser.i18n.getMessage("lexi_down");
    error_content.style.display = "block";
}

function warn_no_user() {
    button_simplify.classList.add("disabled");
    error_content.textContent = browser.i18n.getMessage("lexi_no_user");
    error_content.style.display = "block";
}

test_connection().then(function (result) {
    if (result.status == 200) {
        // everything ok with connection, now check if user is registered in browser
        browser.storage.sync.get('lexi_user', function (usr_object) {
            if (!usr_object.lexi_user) {
                warn_no_user();
            }
        });
        // if (!test_user_registered()) { warn_no_user(); }
    } else {
        warn_lexi_down();
    }
});

/* QUERY FOR NEW VERSION */
function query_new_version_ajax_call() {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            console.log("Error: "+e.toString());
        };
        xhr.open("POST", NEW_VERSION_URL, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

function query_new_version() {
    query_new_version_ajax_call().then(function (result) {
        var most_recent_version = result['most_recent_version'];
        var download_url = result['download_url'];
        if (most_recent_version !== frontend_version) {
            announce_new_version(most_recent_version, download_url);
        }
    });
}

function announce_new_version(most_recent_version, download_url) {
    var announcement = browser.i18n.getMessage("lexi_popup_new_version_available");
    // .format is defined in ../scripts/util.js. The i18n string defines the placeholders.
    update_content.innerHTML = announcement + " <a href="+download_url+" target=_blank>DOWNLOAD</a>";
    update_content.style.display = "block";
}
query_new_version();

/* POPUP OPTIONS */

// open user administration
function changeuser() {
    browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
        return true;
    });
}

button_changeuser.onclick = function (ev) {
    window.close();
    changeuser();
};


// simplify whole page

/**
 * Helper function to execute function in current active tab
 * @param tabCallback
 */
function doInCurrentTab(tabCallback) {
    browser.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {tabCallback(tabArray[0]);}
    );
}


button_simplify.onclick = function (ev) {
    console.log("Trying to call simplification for whole page.");
    button_simplify_img.src = "../img/loading.gif";
    var activeTabId;
    // window.close();
    doInCurrentTab(function (tab) {
        activeTabId = tab.id;
        browser.tabs.sendMessage(activeTabId, {type:'simplify_all'}, function () {return true;})
            .then(function (response) {
                alert("simplification_done!");
                button_simplify_img.src = "../img/checkmark.png";
                window.close();
            });
    });
};

// listens for message that simplification is done, closes popup
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type == "simplification_done") {
        // alert("simplification_done");
        window.close();
    }
});

/* i18n */
button_simplify_txt.textContent = browser.i18n.getMessage("lexi_popup_simplify_all");
button_changeuser_txt.textContent = browser.i18n.getMessage("lexi_popup_change_user");

// test_connection().then(function (value) {
//     if (button_changeuser.disabled) {
//         alert('fo');
//     }
// });
