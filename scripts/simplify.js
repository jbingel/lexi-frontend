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
var USER = "default"; // will be overwritten

/**
 * stores whether feedback has been submitted, to decide whether to open
 * feedback modal again
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
    var orig = simplifications[elemId].original;
    var simple = simplifications[elemId].simple;
    var selection = simplifications[elemId].selection;
    // var is_simplified = simplifications[elemId].is_simplified;
    if (selection == 0 || selection == 1) {
        elem.innerHTML = simple;
        // simplifications[elemId].is_simplified = true;
        simplifications[elemId].selection = 2;
    } else if (selection == 2) {
        elem.innerHTML = orig;
        // simplifications[elemId].is_simplified = false;
        simplifications[elemId].selection = 1;
    }
    console.log(simplifications[elemId]);
    console.log(clicked_simplifications);
}

/**
 *
 * @param element
 * @param img
 */
function toggle_bad_feedback(element, img) {
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
            // change_text(this.id, this.dataset.alt1, this.dataset.alt2);
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
        // change_text(this.id, this.dataset.alt1, this.dataset.alt2);
        toggle_bad_feedback(feedback_span, img);
    })
}

function create_lexi_notifier(){
    var ln = document.createElement("div");
    ln.setAttribute("id", "lexi-notifier");
    ln.setAttribute("class", "lexi-frontend");
    document.body.appendChild(ln);
}

function display_message(msg) {
    // Modify notifier
    var notify_elem = document.getElementById("lexi-notifier");
    notify_elem.innerHTML = '<p>'+msg+'</p>';
}

function display_loading_animation() {
    var notify_elem = document.getElementById("lexi-notifier");
    var loading_animation = browser.runtime.getURL("img/loading.gif");
    var current_notifier_msg = notify_elem.textContent;
    var msg_plus_loading = "<p><span>"+current_notifier_msg+"</span>" +
        "  <img id='lexi-loading-animation' src="+loading_animation+" /></p>";
    display_message(msg_plus_loading);
}

/**
 *  Sends an AJAX call to the server to ask for all simplifications. To this end,
 *  the entire document's <body> HTML is sent to the backend, which returns the
 *  HTML enriched with certain <span> elements that denote the simplifications.
 *  Adds feedback button to app toolbar.
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
        console.log(simplifications);

        if (simplifications) {
            document.body.outerHTML = result['html'];
            display_message(browser.i18n.getMessage("lexi_simplifications_loaded"));
            // var header = document.getElementById("lexi_header");
            // var button = document.createElement("button");
            // button.innerHTML = "Click when done!";
            // button.id = "feedback_button";
            // header.appendChild(button);
            // button.addEventListener('click', function() {
            //     feedbackAjaxCall(SERVER_URL+"/feedback", USER);
            // });
            // Create listeners for clicks on simplification spans
            make_simplification_listeners();

            // insert_feedback_js(); // TODO this works, but move this somewhere it makes more sense conceptually
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
            };
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
    console.log(_lexi_feedback_modal_iframe_container);
    document.body.removeChild(_lexi_feedback_modal_iframe_container);
}

function toggle_feedback_modal() {
    console.log("Toggling feedback modal");
    if (simplifications) {
        if (feedback_submitted) {
            console.log("Feedback already submitted, doing nothing.");
        } else {
            if (document.getElementById("lexi-feedback-modal-iframe-container")) {
                console.log("Form already there, doing nothing.")
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
        toggle_feedback_modal();
    });
}

function handle_feedback(rating, feedback_txt) {
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_txt);
    setTimeout(remove_feedback_form(), 1000);
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));

}

/* ******************************* *
 * ******************************* *
 * ****** MESSAGE LISTENERS ****** *
 * ******************************* *
 * ******************************* */

browser.runtime.onMessage.addListener(function (request) {
    // Close login form (by deleting login iframe)
    if (request.type === 'delete_feedback_iframe_echo') {
        remove_feedback_form()
    }

    if (request.type === 'feedback_echo') {
        handle_feedback(request.rating, request.feedback_txt);
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
    request['user'] = USER;
    request['html'] = html;
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
function feedbackAjaxCall(url, rating, feedback_txt) {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['user'] = USER;
    request['simplifications'] = simplifications;
    request['rating'] = rating;
    request['feedback_txt'] = feedback_txt;
    request['url'] = window.location.href;
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
    // add_lexi_header();
    create_lexi_notifier();
    // insert_feedback_modal();
    display_message(browser.i18n.getMessage("lexi_simplifications_loading"));
    // incremental_load_simplifications();
    load_simplifications();
    // debugsimplify(0);
});
