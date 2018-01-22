/**
 * Created by joachim on 8/17/17.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var frontend_version = browser.runtime.getManifest().version;

// TODO read these from somewhere central
var SERVER_URL = "https://www.readwithlexi.net/lexi/";
// var SERVER_URL = "http://localhost:5000";
var SERVER_URL_LOGIN = SERVER_URL+"/login";
var SERVER_URL_REGISTER = SERVER_URL+"/register_user";
var SERVER_URL_FEEDBACK = SERVER_URL+"/feedback";


// Insert localized text into *_form.html
$(".lexi-localize").each(function (_) {
    var string_id = $(this).attr("data-key");
    $(this)[0].innerHTML = browser.i18n.getMessage(string_id);
});

