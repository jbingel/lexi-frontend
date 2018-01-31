/**
 * Created by joachim on 1/30/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var this_iframe_id = "lexi-notifier-iframe";

window.addEventListener('message', function(event) {
    if (event.data.type == "display_message") {
    }
    else if (event.data.type == "display_loading_animation") {

    }
});

var feedback_btn_now = document.getElementById("lexi-feedback-button-now");
feedback_btn_now.addEventListener('click', function() {
    var event = {"type": "solicit_feedback"};
    parent.postMessage(event, "*");
});