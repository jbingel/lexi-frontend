/**
 * Created by joachim on 1/30/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var notifier_text_elem = document.getElementById("lexi-notifier-text");
var close_x = document.getElementById("lexi-notifier-close");

window.addEventListener('message', function(event) {
    console.log(event.data);
    if (event.data.type == "display_message") {
        notifier_text_elem.innerHTML = event.data.msg;
        console.log(notifier_text_elem.innerHTML );
        if (event.data.display_closer == false) {
            close_x.style.display = "none";
        } else if (event.data.display_closer == true) {
            close_x.style.display = "inline";
        }
    }
    else if (event.data.type == "display_loading_animation") {
        var loading_animation = browser.runtime.getURL("img/loading.gif");
        var cur_notify_elem_text = notifier_text_elem.textContent;
        var msg_plus_loading = "<span>"+cur_notify_elem_text+"</span>" +
            "  <img id='lexi-loading-animation' src="+loading_animation+" />";
        notifier_text_elem.innerHTML = msg_plus_loading;
    }
});

close_x.onclick = function() {
    var event = {"type": "close_notifier_iframe"};
    parent.postMessage(event, "*");
};