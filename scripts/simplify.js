/**
 * Created by joachim on 10/12/16.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var frontend_version = browser.runtime.getManifest().version;

/**
 * Id of current user
 * @type {string}
 */
var USER = "default"; // will be overwritten in main (see bottom)

/**
 * Flag whether feedback has been submitted, used to decide
 * whether to open feedback modal again
 * @type {boolean}
 */
var feedback_submitted = false;

/**
 * Stores all simplifications as returned from backend. Each simplification
 * has an ID starting with `lexi_'. This object maps an ID to another
 * object containing the fields: (i) `original': the original text,
 * (ii) `simple': the simple version, (iii): `is_simplified': a boolean
 * var indicating whether the sentence has been selected for simplification.
  * @type {{}}
 */
var simplifications = {};

/**
 * Stores an ID for this session
 * @type {number}
 */
var session_id = -1; // will be overwritten

/**
 * Stores simplification element IDs for simplifications that have been
 * clicked (e.g. to find out whether or not to add a bad_feedback_icon).
 * @type {Array}
 */
var clicked_simplifications = [];

/* Useful URLs */
var SERVER_URL = settings.LEXI_SERVER_URL;
var SERVER_URL_FEEDBACK = SERVER_URL+settings.feedback_route;
var SERVER_URL_SIMPLIFY = SERVER_URL+settings.simplify_route;

console.log(settings);

/* ******************************* *
 * ******************************* *
 * ******** CORE FUNCTIONS ******* *
 * ******************************* *
 * ******************************* */

function debugsimplify() {
    var site_html = document.body.outerHTML;
    var site_text = document.body.textContent;
    if (site_text.length > 10000) {
        display_message(browser.i18n.getMessage("lexi_simplifications_loading_longtext"));
    }
    display_loading_animation();
    return {
        "html": site_html,
        "simplifications": ["foo"]
    }
}

/**
 *
 * @param {string} elemId
 */
function change_text(elemId) {
    var elem = document.getElementById(elemId);
    var choices = simplifications[elemId].choices;
    var original = simplifications[elemId].original;
    simplifications[elemId].selection++; // increment by 1
    var display = simplifications[elemId].selection % choices.length;
    elem.innerHTML = choices[display];
    elem.setAttribute("data-displaying-original",
        (choices[display] == original).toString());
    console.log(simplifications[elemId]);
    console.log(clicked_simplifications);
}

/**
 *
 * @param element
 * @param img
 */
function toggle_thumbsdown(element, img) {
    var ref = element.getAttribute("data-reference");
    simplifications[ref].bad_feedback = ! simplifications[ref].bad_feedback;
    console.log(simplifications[ref]);
    if (simplifications[ref].bad_feedback) {
        img.src = browser.runtime.getURL("img/thumbsdown_selected.png");
    } else {
        img.src = browser.runtime.getURL("img/thumbsdown_deselected.png");
    }
}

/**
 *
 */
function make_simplification_listeners() {
    $(".lexi-simplify").each(function () {
        this.addEventListener('click', function () {
            change_text(this.id);
            if (jQuery.inArray(this.id, clicked_simplifications) == -1) {
                insert_thumbsdown_icon(this);
                clicked_simplifications.push(this.id);
                console.log(clicked_simplifications);
            }
        });
    })
}

/**
 * Creates a 'bad feedback' icon next to the simplification span when
 * it's clicked for the first time.
 * @param element The element in question.
 */
function insert_thumbsdown_icon(element) {
    var elemId = element.id;
    var feedback_span = document.createElement("span");
    feedback_span.setAttribute("class", "lexi-bad-feedback");
    feedback_span.setAttribute("data-reference", elemId);
    var img = document.createElement("img");
    img.src = browser.runtime.getURL("img/thumbsdown_deselected.png");
    img.setAttribute("class", "lexi-bad-feedback-icon");
    element.insertAdjacentElement("afterend", feedback_span);

    feedback_span.appendChild(img);
    feedback_span.addEventListener('click', function () {
        toggle_thumbsdown(feedback_span, img);
    })
}

/**
 *  Sends an AJAX call to the server to ask for all simplifications. To this end,
 *  the entire document's <body> HTML is sent to the backend, which returns the
 *  HTML enriched with certain <span> elements that denote the simplifications.
 */
function load_simplifications() {
    var site_html = document.body.outerHTML;
    var site_text = document.body.textContent;
    if (site_text.length > 10000) {
        display_message(browser.i18n.getMessage("lexi_simplifications_loading_longtext"), false);
    } else {
        display_message(browser.i18n.getMessage("lexi_simplifications_loading"), false);
    }
    display_loading_animation();
    simplifyAjaxCall(SERVER_URL_SIMPLIFY, site_html).then(function (result) {
        simplifications = result['simplifications'];
        session_id = result['session_id'];
        console.log(simplifications);
        console.log("Lexi session ID: "+session_id);
        console.log("Backend version: "+result['backend_version']);
        if (simplifications) {
            // replace original HTML with markup return from backup (enriched w/ simplifications)
            document.body.outerHTML = result['html'];
            // the login and notifier iframes might still be there before the HTML is sent to backend,
            // in which case they will be returned by the backend and re-injected above
            // TODO this is quite ugly, better make sure the iframes aren't sent to backend
            close_login_iframe(true);
            close_notifier_iframe(true);
            // inject notifier again (after old HTML has been overwritten), and when ready, display msg
            inject_lexi_notifier(function () {
                display_message(browser.i18n.getMessage("lexi_simplifications_loaded"));
            });
            // Create listeners for clicks on simplification spans
            make_simplification_listeners();
            // prepare for feedback
            register_feedback_action();
        } else {
            display_message(browser.i18n.getMessage("lexi_simplifications_error"));
        }
    })
}

$.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};

var updated_elems = [];  // belongs to below function (experimental)
function incremental_load_simplifications() {
    $(window).on('resize scroll', function(){
        $('p:visible').each(function () {
            console.log($(this).html());
            // if visible and not simplified yet
            if ($(this).isInViewport() && updated_elems.indexOf($(this)) == -1) {
                console.log('getting simplification for '+($(this).html()));
                simplifyAjaxCall(SERVER_URL_SIMPLIFY, $(this).html()).then(function (result) {
                    var this_simplifications = result['simplifications'];
                    if (this_simplifications) {
                        // update simplifications obj
                        simplifications = $.extend(simplifications, this_simplifications);
                        // replace HTML
                        $(this).outerHTML = result['html'];
                        // Create listeners for clicks on simplification spans
                        make_simplification_listeners();
                        console.log(simplifications);
                    }

                })
            }
            updated_elems.push($(this));
        })
    })
}


/* ******************************* *
 * ******************************* *
 * ******** INJECT IFRAMES ******* *
 * ******************************* *
 * ******************************* */

/**
 *
 */
function inject_lexi_notifier(callback){
    var lexi_notifier_iframe_container = document.createElement("div");
    lexi_notifier_iframe_container.id = "lexi-notifier-iframe-container";
    lexi_notifier_iframe_container.style = "position:fixed; left: 0; " +
        "top: 0px; z-index: 1000001; display: block;";

    var lexi_notifier_iframe = document.createElement("iframe");
    lexi_notifier_iframe.id = "lexi-notifier-iframe";
    lexi_notifier_iframe.src = browser.extension.getURL("pages/notifier.html");
    lexi_notifier_iframe.style = "position:relative; height: 100%; width: 100%; border: none;";

    lexi_notifier_iframe_container.appendChild(lexi_notifier_iframe);
    document.body.appendChild(lexi_notifier_iframe_container);
    lexi_notifier_iframe.onload = function() {
        // resizeIframe(this);
        console.log("lexi_notifier_iframe loaded.");
        // iFrameResize({log:true}, '#lexi-notifier-iframe');
        callback();
    };
}

/**
 *
 */
function inject_feedback_reminder() {
    var lexi_feedback_reminder_iframe_container = document.createElement("div");
    lexi_feedback_reminder_iframe_container.id = "lexi-feedback-reminder-iframe-container";

    var lexi_feedback_reminder_iframe = document.createElement("iframe");
    lexi_feedback_reminder_iframe.id = "lexi-feedback-reminder-iframe";
    lexi_feedback_reminder_iframe.src = browser.extension.getURL("pages/feedback_reminder.html");

    lexi_feedback_reminder_iframe_container.appendChild(lexi_feedback_reminder_iframe);
    document.body.appendChild(lexi_feedback_reminder_iframe_container);
    lexi_feedback_reminder_iframe.onload = function() {
        // resizeIframe(this);
        console.log("lexi_feedback_reminder_iframe loaded.");
        // iFrameResize({log:true}, '#lexi-feedback-reminder-iframe');
    };
}

function inject_feedback_form() {
    var lexi_feedback_modal_iframe_container = document.createElement("div");
    lexi_feedback_modal_iframe_container.id = "lexi-feedback-modal-iframe-container";
    lexi_feedback_modal_iframe_container.style = "position:fixed; left: 0; right: 0; " +
        "bottom: 0; top: 0px; z-index: 1000001; display: block;";

    var lexi_feedback_modal_iframe = document.createElement("iframe");
    lexi_feedback_modal_iframe.onload = function() {
        // resizeIframe(this);
        console.log("lexi_feedback_modal_iframe loaded.");
    };
    lexi_feedback_modal_iframe.id = "lexi-feedback-modal-iframe";
    lexi_feedback_modal_iframe.src = browser.extension.getURL("pages/feedback_form.html");
    lexi_feedback_modal_iframe.style = "height: 100%; width: 100%; border: none;";

    lexi_feedback_modal_iframe_container.appendChild(lexi_feedback_modal_iframe);
    document.body.appendChild(lexi_feedback_modal_iframe_container);
}

/* ******** IFRAMES UTILS ******** */

function close_iframe(iframe_id, full_delete) {
    console.log("Removing iframe: "+iframe_id);
    var iframe_container = document.getElementById(iframe_id+"-container");
    if (iframe_container) {
        if (full_delete) {
            document.body.removeChild(iframe_container);
        } else {
            iframe_container.style.display = "none";
        }
    }
}

function close_feedback_reminder_iframe(full_delete){
    close_iframe("lexi-feedback-reminder-iframe", full_delete);
}

function close_notifier_iframe(full_delete){
    close_iframe("lexi-notifier-iframe", full_delete);
}

function close_feedback_modal_iframe(full_delete) {
    close_iframe("lexi-feedback-modal-iframe", full_delete);
}

function close_login_iframe(full_delete) {
    close_iframe("lexi-login-modal-iframe", full_delete);
}

/**
 *
 * @param msg
 * @param display_closer
 */
function display_message(msg, display_closer) {
    // Send message to notifier iframe
    var notify_iframe = document.getElementById("lexi-notifier-iframe");
    var event_data = {"type": "display_message", "msg": msg, "display_closer": display_closer};
    notify_iframe.contentWindow.postMessage(event_data, "*");
    // show if it's been hidden
    $("#lexi-notifier-iframe-container").show();
}

function display_loading_animation() {
    var notify_iframe = document.getElementById("lexi-notifier-iframe");
    var event = {"type": "display_loading_animation"};
    notify_iframe.contentWindow.postMessage(event, "*");
}

function toggle_feedback_reminder() {
    var _feedback_reminder = document.getElementById("lexi-feedback-reminder-iframe-container");
    if (_feedback_reminder) {
        if (simplifications) {
            if (! feedback_submitted) {
                _feedback_reminder.style.display = "block";
            }
        }
    }
}

function toggle_feedback_modal() {
    console.log("Toggling feedback modal");
    if (simplifications) {
        if (feedback_submitted) {
            console.log("Feedback already submitted, doing nothing.");
        } else {
            // if (document.getElementById("lexi-feedback-modal-iframe-container")) {
            if (document.getElementById("lexi-feedback-modal")) {
                console.log("Feedback reminder already there, doing nothing.")
            } else {
                console.log("Should display now...");
                inject_feedback_form();
            }
        }
    }
}

function register_feedback_action() {
    // insert_feedback_modal();
    $("html").bind("mouseleave", function () {
        console.log("mouse leaving HTML body area...");
        toggle_feedback_reminder();
    });
}

function handle_feedback(rating, feedback_text) {
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_text);
    setTimeout(close_feedback_modal_iframe(), 1000);
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));
}

function resize_iframe(iframe_id, width, height) {
    var obj = document.getElementById(iframe_id);
    obj.style.width = width;
    obj.style.height = height;

    var container = document.getElementById(iframe_id+"-container");
    container.style.width = width;
    container.style.height = height;
}


/* ******************************* *
 * ******************************* *
 * ****** MESSAGE LISTENERS ****** *
 * ******************************* *
 * ******************************* */

/* these are for cross-origin communication between frames */

window.addEventListener("message", function (event) {
    console.log(event.data);
    if (event.data.type == "close_notifier_iframe") {
        close_notifier_iframe();
    } else if (event.data.type == "solicit_feedback") {
        close_feedback_reminder_iframe();
        toggle_feedback_modal();
    } else if (event.data.type == "delete_feedback_iframe") {
        close_feedback_modal_iframe(true);
    } else if (event.data.type == "close_login_iframe") {
        close_login_iframe(true);
    } else if (event.data.type == "feedback") {
        handle_feedback(event.data.rating, event.data.feedback_text);
    } else if (event.data.type == "resize_iframe") {
        // resize_iframe(event.data.iframe_id, event.data.width, event.data.height);
    }
});

/* ******************************* *
 * ******************************* *
 * ********* AJAX CALLS ********** *
 * ******************************* *
 * ******************************* */

/**
 * Makes an AJAX call to backend requesting simplifications based on some HTML.
 * @param {string} url -
 * @param {string} html -
 * @returns {Promise}
 */
function simplifyAjaxCall(url, html) {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    request['user'] = USER;  // legacy
    request['html'] = html;
    request['url'] = window.location.href;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            display_message(browser.i18n.getMessage("lexi_unknown_server_error"));
        };
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/**
 *
 * @param {string} url
 * @param {string} rating
 * @param {string} feedback_text
 * @returns {Promise}
 */
function feedbackAjaxCall(url, rating, feedback_text) {
    console.log("Sending feedback for session id:");
    console.log(session_id);
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    request['user'] = USER;  // legacy
    request['simplifications'] = simplifications;
    request['rating'] = rating;
    request['feedback_text'] = feedback_text;
    request['url'] = window.location.href;
    request['session_id'] = session_id;
    console.log(request);
    return new Promise(function(resolve, reject) {
        // console.log(html.slice(0, 20));
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
            // console.log(this.responseText);
        };
        // xhr.onerror = reject;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
        feedback_submitted = true;
    })
}

/* ******************************* *
 * ******************************* *
 * ************ MAIN ************* *
 * ******************************* *
 * ******************************* */

browser.storage.sync.get('lexi_user', function (usr_object) {
    USER = usr_object.lexi_user.userId;
    console.log("Started lexi extension. User: "+USER);
    inject_lexi_notifier(function(){
        inject_feedback_reminder();
        load_simplifications();
    });
});
   
 
