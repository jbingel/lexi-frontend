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
// var SERVER_URL = "https://www.readwithlexi.net/lexi/";
var SERVER_URL = "http://localhost:5000";
var SERVER_URL_FEEDBACK = SERVER_URL+"/feedback";
var SERVER_URL_SIMPLIFY = SERVER_URL+"/simplify";


/* ******************************* *
 * ******************************* *
 * ********* FUNCTIONS *********** *
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
        "html": html,
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
    simplifications[elemId].selection++; // increment by 1
    var display = simplifications[elemId].selection % choices.length;
    elem.innerHTML = choices[display];
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
 *
 */
function create_lexi_notifier(){
    var lexi_notifier = document.createElement("div");
    lexi_notifier.setAttribute("id", "lexi-notifier");
    lexi_notifier.setAttribute("class", "lexi-frontend");
    var lexi_notifier_text = document.createElement("p");
    lexi_notifier_text.setAttribute("id", "lexi-notifier-text");
    lexi_notifier_text.setAttribute("style", "float: left; max-width: 270px");
    var lexi_notifier_close = document.createElement("span");
    lexi_notifier_close.setAttribute("id", "lexi-notifier-close");
    lexi_notifier_close.setAttribute("class", "close");
    lexi_notifier_close.setAttribute("style", "float: right; margin-left: 15px; font-size:150%");
    lexi_notifier_close.innerHTML = "&times;";

    document.body.appendChild(lexi_notifier);
    lexi_notifier.appendChild(lexi_notifier_text);
    lexi_notifier.appendChild(lexi_notifier_close);
}

/**
 *
 */
function create_feedback_reminder() {
    var feedback_reminder = document.createElement("div");
    feedback_reminder.setAttribute("id", "lexi-feedback-reminder");
    feedback_reminder.setAttribute("class", "lexi-frontend animate");
    feedback_reminder.innerHTML = '<span style="float:left;">'+
        browser.i18n.getMessage("lexi_feedback_reminder")+"</span>";
    feedback_reminder.style.display = "none";  // deactivated per default

    // button listeners declared in make_interface_listeners()
    var open_feedback_modal_btn_now = document.createElement("button");
    open_feedback_modal_btn_now.setAttribute("id", "lexi-feedback-button-now");
    open_feedback_modal_btn_now.setAttribute("class", "lexi-button");
    open_feedback_modal_btn_now.textContent = browser.i18n.getMessage("lexi_feedback_reminder_ok");

    var feedback_reminder_close = document.createElement("span");
    feedback_reminder_close .setAttribute("id", "lexi-feedback-reminder-close");
    feedback_reminder_close .setAttribute("class", "close");
    feedback_reminder_close .setAttribute("style", "float: right; margin-left: 15px; font-size:150%");
    feedback_reminder_close .innerHTML = "&times;";

    feedback_reminder.appendChild(feedback_reminder_close);
    feedback_reminder.appendChild(open_feedback_modal_btn_now);
    document.body.appendChild(feedback_reminder);
}

function feedback_reminder_choice_handler(do_give_feedback) {
    $("#lexi-feedback-reminder").hide();
    if (do_give_feedback) {
        toggle_feedback_modal();
    }
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
        document.getElementById("lexi-notifier").style.display = "none";
    });
}

/**
 *
 * @param msg
 */
function display_message(msg) {
    // Modify notifier
    var notify_elem = document.getElementById("lexi-notifier");
    notify_elem.style.display = "block";
    var notify_elem_text = document.getElementById("lexi-notifier-text");
    notify_elem_text.innerHTML = msg;
    notify_elem_text.style.display = "inline";
}

function display_loading_animation() {
    var notify_elem = document.getElementById("lexi-notifier-text");
    var loading_animation = browser.runtime.getURL("img/loading.gif");
    var current_notifier_msg = notify_elem.textContent;
    var msg_plus_loading = "<span>"+current_notifier_msg+"</span>" +
        "  <img id='lexi-loading-animation' src="+loading_animation+" />";
    display_message(msg_plus_loading);
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
        display_message(browser.i18n.getMessage("lexi_simplifications_loading_longtext"));
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
            // TODO this is quite ugly, better make sure the iframe isn't sent to backend
            var login_iframe = document.getElementById("lexi-login-modal-iframe-container");
            if (login_iframe) {
                document.body.removeChild(login_iframe);
            }
            display_message(browser.i18n.getMessage("lexi_simplifications_loaded"));
            // Create listeners for clicks on simplification spans
            make_simplification_listeners();
            // re-declare listeners for Lexi backend, those were deleted when 
            // page HTML is overwritten above
            make_interface_listeners();
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

function inject_feedback_form() {
    var lexi_feedback_modal_iframe_container = document.createElement("div");
    lexi_feedback_modal_iframe_container.id = "lexi-feedback-modal-iframe-container";
    lexi_feedback_modal_iframe_container.style = "position:fixed; left: 0; right: 0; " +
        "bottom: 0; top: 0px; z-index: 1000001; display: block;";

    var lexi_feedback_modal_iframe = document.createElement("iframe");
    lexi_feedback_modal_iframe.onload = function() {
        console.log("lexi_feedback_modal_iframe loaded.");
    };
    lexi_feedback_modal_iframe.id = "lexi-feedback-modal-iframe";
    lexi_feedback_modal_iframe.src = browser.extension.getURL("pages/feedback_form.html");
    lexi_feedback_modal_iframe.style = "height: 100%; width: 100%; border: none;";

    lexi_feedback_modal_iframe_container.appendChild(lexi_feedback_modal_iframe);
    document.body.appendChild(lexi_feedback_modal_iframe_container);
}

function remove_feedback_form() {
    console.log("Removing feedback iframe.");
    var _lexi_feedback_modal_iframe_container =
        document.getElementById("lexi-feedback-modal-iframe-container");
    document.body.removeChild(_lexi_feedback_modal_iframe_container);
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
        // toggle_feedback_modal();
        toggle_feedback_reminder();
    });
}

function handle_feedback(rating, feedback_text) {
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_text);
    setTimeout(remove_feedback_form(), 1000);
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));
}

/* ******************************* *
 * ******************************* *
 * ****** MESSAGE LISTENERS ****** *
 * ******************************* *
 * ******************************* */

browser.runtime.onMessage.addListener(function (request) {
    // Close feedback form (by deleting feedback iframe)
    if (request.type === 'delete_feedback_iframe_echo') {
        remove_feedback_form()
    }
    // Receive feedback and pass on to handling function
    if (request.type === 'feedback_echo') {
        handle_feedback(request.rating, request.feedback_text);
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
            var lexi_header = document.getElementById("lexi_header");
            lexi_header.innerHTML = "Unknown Error Occured. Server response not received.";
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
 * @param {string} feedback_txt
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
    create_lexi_notifier();
    create_feedback_reminder();
    make_interface_listeners();
    display_message(browser.i18n.getMessage("lexi_simplifications_loading"));
    load_simplifications();
});
   
 
