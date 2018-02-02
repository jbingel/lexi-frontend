/**
 * Created by joachim on 8/17/17.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var frontend_version = browser.runtime.getManifest().version;

// var SERVER_URL = settings.LEXI_SERVER_URL;
// var SERVER_URL_LOGIN = SERVER_URL + settings.login_route;
// var SERVER_URL_REGISTER = SERVER_URL + settings.register_route;

// Insert localized text into *_form.html
$(".lexi-localize").each(function (_) {
    var string_id = $(this).attr("data-key");
    $(this)[0].innerHTML = browser.i18n.getMessage(string_id);
});



// window.onload = function(){
//     setTimeout(reportDimensions, 50);
// };

function reportDimensions() {
    console.log(document.body);
    var div = document.body.getElementsByTagName("div")[0];
    console.log(div);
    var w = div.style.width;
    var h = div.style.height;
    console.log(w);
    console.log(h);
    // var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var event = {};
    event.type = "resize_iframe";
    event.iframe_id = this_iframe_id;
    event.width = w + "px";
    event.height = h + "px";
    parent.postMessage(event, "*");
}