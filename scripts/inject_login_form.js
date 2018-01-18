/**
 * Created by joachim on 8/17/17.
 */

// div that contains iframe (mainly needed for CSS)
var lexi_login_modal_iframe_container = document.createElement("div");
lexi_login_modal_iframe_container.id = "lexi-login-modal-iframe-container";
lexi_login_modal_iframe_container.style = "position:fixed; left: 0; " +
    "right: 0; bottom: 0; top: 0px; z-index: 1000001;";

// login modal iframe
var lexi_login_modal_iframe = document.createElement("iframe");
lexi_login_modal_iframe.id = "lexi-login-modal-iframe";
lexi_login_modal_iframe.src = browser.extension.getURL("pages/login_form.html");
lexi_login_modal_iframe.style = "height: 100%; width: 100%; border: none;";

// inject into document
lexi_login_modal_iframe_container.appendChild(lexi_login_modal_iframe);
document.body.appendChild(lexi_login_modal_iframe_container);

// When hearing the background script echo the below message, delete iframe
browser.runtime.onMessage.addListener(function (request) {
    // Close login form (by deleting login iframe)
    if (request.type === 'delete_login_iframe_echo') {
        console.log("Removing login iframe");
        var lexi_login_modal_iframe_container =
            document.getElementById("lexi-login-modal-iframe-container");
        document.body.removeChild(lexi_login_modal_iframe_container);
    }
});