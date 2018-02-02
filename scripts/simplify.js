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
/* Lexi logo */
var logo_url = browser.runtime.getURL("img/lexi.png");

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
            // the login iframe might still be there before the HTML is sent to backend,
            // in which case it will be returned by the backend and re-injected above
            // TODO this is quite ugly, better make sure the iframes aren't sent to backend
            close_login_iframe(true);
            display_message(browser.i18n.getMessage("lexi_simplifications_loaded"));
            make_interface_listeners();
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

function inject_notification_container() {
    var notification_container = document.createElement("div");
    notification_container.setAttribute("id", "lexi-notification-container");
    document.body.appendChild(notification_container);
}

/**
 *
 */
function inject_lexi_notifier(callback){
    var lexi_notifier = document.createElement("div");
    lexi_notifier.setAttribute("id", "lexi-notifier");
    lexi_notifier.setAttribute("class", "lexi-frontend lexi-notification animate");

    var lexi_notifier_flexbox = document.createElement("div");
    lexi_notifier_flexbox.setAttribute("class", "flexbox");

    var lexi_logo = document.createElement("img");
    lexi_logo.setAttribute("class", "lexi-logo");
    lexi_logo.setAttribute("src", logo_url);

    var lexi_notifier_text = document.createElement("div");
    lexi_notifier_text.setAttribute("id", "lexi-notifier-text");
    lexi_notifier_text.setAttribute("class", "lexi-notification-content");
    // lexi_notifier_text.setAttribute("style", "float: left; max-width: 270px");
    var lexi_notifier_close = document.createElement("div");
    lexi_notifier_close.setAttribute("id", "lexi-notifier-close");
    lexi_notifier_close.setAttribute("class", "close");
    // lexi_notifier_close.setAttribute("style", "float: right; margin-left: 15px; font-size:150%");
    lexi_notifier_close.innerHTML = "&times;";

    var notification_container = document.getElementById("lexi-notification-container");
    notification_container.appendChild(lexi_notifier);
    lexi_notifier.appendChild(lexi_notifier_flexbox);
    lexi_notifier_flexbox.appendChild(lexi_logo);
    lexi_notifier_flexbox.appendChild(lexi_notifier_text);
    lexi_notifier_flexbox.appendChild(lexi_notifier_close);

    lexi_notifier_close.onclick = function () {
        $("#lexi-notifier").hide();
    };
    // setTimeout(function (){
    //     console.log("registering");
    //
    //     lexi_notifier_close.onclick = function() {
    //         console.log("closing...");
    //         close_notifier();
    //     }}, 5000);

    if (callback) callback();
}

/**
 *
 */
function inject_feedback_reminder() {
    var feedback_reminder = document.createElement("div");
    feedback_reminder.setAttribute("id", "lexi-feedback-reminder");
    feedback_reminder.setAttribute("class", "lexi-frontend lexi-notification animate");
    feedback_reminder.style.display = "none";  // deactivated per default

    var lexi_feedback_reminder_flexbox = document.createElement("div");
    lexi_feedback_reminder_flexbox.setAttribute("class", "flexbox");

    var lexi_logo = document.createElement("img");
    lexi_logo.setAttribute("class", "lexi-logo");
    lexi_logo.setAttribute("src", logo_url);

    var lexi_feedback_reminder_text = document.createElement("div");
    lexi_feedback_reminder_text.setAttribute("id", "lexi-feedback-reminder-text");
    lexi_feedback_reminder_text.setAttribute("class", "lexi-notification-content");
    lexi_feedback_reminder_text.textContent = browser.i18n.getMessage("lexi_feedback_reminder");
    
    // button listeners declared in make_interface_listeners()
    var open_feedback_modal_btn_now = document.createElement("button");
    open_feedback_modal_btn_now.setAttribute("id", "lexi-feedback-button-now");
    open_feedback_modal_btn_now.setAttribute("class", "lexi-button");
    open_feedback_modal_btn_now.textContent = browser.i18n.getMessage("lexi_feedback_reminder_ok");

    var feedback_reminder_close = document.createElement("div");
    feedback_reminder_close.setAttribute("id", "lexi-feedback-reminder-close");
    feedback_reminder_close.setAttribute("class", "close");
    feedback_reminder_close.innerHTML = "&times;";
    feedback_reminder_close.style.display = "none";  // setting this for now, might want to activate again later

    var notification_container = document.getElementById("lexi-notification-container");
    lexi_feedback_reminder_flexbox.appendChild(lexi_logo);
    lexi_feedback_reminder_flexbox.appendChild(lexi_feedback_reminder_text);
    lexi_feedback_reminder_flexbox.appendChild(feedback_reminder_close);
    feedback_reminder.appendChild(lexi_feedback_reminder_flexbox);
    feedback_reminder.appendChild(open_feedback_modal_btn_now);
    notification_container.appendChild(feedback_reminder);
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

function close_feedback_reminder(full_delete) {
    $("#lexi-feedback-reminder").hide();
}

function close_notifier(full_delete) {
    $("#lexi-notifier").hide();
}

function close_feedback_modal_iframe(full_delete) {
    close_iframe("lexi-feedback-modal-iframe", full_delete);
}

function close_login_iframe(full_delete) {
    close_iframe("lexi-login-modal-iframe", full_delete);
}

function make_interface_listeners() {
    var feedback_btn_now = document.getElementById("lexi-feedback-button-now");
    feedback_btn_now.addEventListener('click', function() {
        feedback_reminder_choice_handler(true)
    });
    var feedback_reminder_close = document.getElementById("lexi-feedback-reminder-close");
    feedback_reminder_close.addEventListener('click', function() {
        feedback_reminder_choice_handler(false)
    });
    var lexi_notifier_close = document.getElementById("lexi-notifier-close");
    lexi_notifier_close.addEventListener('click', function() {
        close_notifier();
    });
}

function feedback_reminder_choice_handler(do_give_feedback) {
    close_feedback_reminder();
    if (do_give_feedback) {
        toggle_feedback_modal();
    }
}

/**
 *
 * @param msg
 * @param display_closer
 */
function display_message(msg, display_closer) {
    var notify_elem = document.getElementById("lexi-notifier");
    notify_elem.style.display = "block";
    var notify_elem_text = document.getElementById("lexi-notifier-text");
    notify_elem_text.innerHTML = msg;
    var notifier_closer = document.getElementById("lexi-notifier-close");
    if (display_closer == false) {
        notifier_closer.style.opacity = "none";
    } else if (display_closer == true) {
        notifier_closer.style.display = "block";
    }
}

function display_loading_animation() {
    var notifier_text_elem = document.getElementById("lexi-notifier-text");
    var loading_animation = browser.runtime.getURL("img/loading.gif");
    var cur_notify_elem_text = notifier_text_elem.textContent;
    var msg_plus_loading = "<span>"+cur_notify_elem_text+"</span>" +
        "  <img id='lexi-loading-animation' src="+loading_animation+" />";
    display_message(msg_plus_loading);
}

function toggle_feedback_reminder() {
    var _feedback_reminder = document.getElementById("lexi-feedback-reminder");
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
    if (event.data.type == "close_notifier") {
        close_notifier();
    } else if (event.data.type == "solicit_feedback") {
        close_feedback_reminder();
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
    inject_notification_container();
    inject_lexi_notifier();
    inject_feedback_reminder();
    load_simplifications();
});
   
 
