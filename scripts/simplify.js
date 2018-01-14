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

/* Lexi logo */
var logo_url = browser.runtime.getURL("img/lexi.png");

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

function debugsimplify(html) {
    return {
        "html": html,
        "simplifications": ["foo"]
    }
}

function sendFeedback(rating) {
    // sleep(5); //TODO find out what goes here.
    var feedback_txt = $("#lexi_feedback_text").val();
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_txt);
    feedback_submitted = true;
    setTimeout(toggle_feedback_modal(), 1000);
    // toggle_feedback_modal();
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));
}

/**
 *
 * @param {string} url
 * @param {string} rating
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
                add_bad_feedback_icon(this);
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
function add_bad_feedback_icon(element) {
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
    // ln.setAttribute("style", "width: 30px; height: 30px; background: blue; position: fixed; z-index:1000; " +
    //     "margin:0 auto; top: 80px");
    // ln.style.display = 'none';
    // $("#lexi_notifier").on({
    //     mouseleave: function() {
    //         $(this).delay(200).fadeTo(500, 1);
    //         // $(this).style.display='block';
    //     },
    //     mouseenter: function() {
    //         alert("mouse enter");
    //         $(this).stop().fadeTo(500, 0);
    //         // $(this).style.display='none';
    //     }
    // });
    document.body.appendChild(ln);
}

function display_message(msg) {
    // Modify toolbar
    // var header = document.getElementById("lexi_header");
    // header.textContent = msg;
    var notify_elem = document.getElementById("lexi-notifier");
    // notify_elem.style.display = 'block';
    notify_elem.innerHTML = '<p>'+msg+'</p>';
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

            insert_feedback_js(); // TODO this works, but move this somewhere it makes more sense conceptually
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

var updated_elems = [];

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

function insert_feedback_js() {
    var modal = document.getElementById("lexi-feedback-modal");
    var close_button = document.getElementById("lexi-feedback-modal-close-btn");
    var close_x = document.getElementById("lexi-feedback-modal-close-x");
    close_x.onclick = close_button.onclick = function () {
        modal.style.display = "none";
    };
    // var form = document.getElementById("lexi-feedback-rating");
    var stars = document.getElementsByName("lexi-rating");
    console.log(stars.length.toString()+" stars");
    console.log(stars);
    // stars[0].bind("onchange", )
    stars[0].onchange = function(){sendFeedback(1)};
    stars[1].onchange = function(){sendFeedback(2)};
    stars[2].onchange = function(){sendFeedback(3)};
    stars[3].onchange = function(){sendFeedback(4)};
    stars[4].onchange = function(){sendFeedback(5)};
}

// /**
//  * Gets the char offset from the document start for a given node
//  * @param node
//  * @returns {Number} The char offset from the document start
//  */
// function getNodeOffset(node) {
//     var range = document.createRange();
//     range.selectNodeContents(document);
//     range.setEnd(node, 0);
//     return range.toString().length;
// }
//
// /**
//  * Gets the current selection and finds its start and end (nodes and char offsets)
//  * @returns {*[]} startNode, offset_in_startNode, endNode, offset_in_endNode
//  */
// function getSelectionRange() {
//     var sel = window.getSelection();
//     var startNode = sel.anchorNode;
//     var endNode = sel.focusNode;
//     var start = sel.anchorOffset;
//     var end = sel.focusOffset;
//     // if selected from right to left within same node, flip start/end
//     if (startNode == endNode && start > end) {
//         start = sel.focusOffset;
//         end = sel.anchorOffset;
//     }
//     // if selected bottom to top across nodes, flip start/end
//     if (getNodeOffset(startNode) > getNodeOffset(endNode)) {
//         startNode = sel.focusNode;
//         endNode = sel.anchorNode;
//         start = sel.focusOffset;
//         end = sel.anchorOffset;
//     }
//     if (startNode == endNode && start == end) {
//         alert("Please don't select using doubleclick. TODO do nothing.");
//     //    TODO do nothing
//     }
//     console.log([startNode, start, endNode, end]);
//     return [startNode, start, endNode, end];
// }

/**
 * Adds a header/toolbar to the page that informs about the
 * app's status and holds the button for sending feedback.
 */
function add_lexi_header() {
    var header_height = "25px";
    var header = document.createElement("div");
    header.id = "lexi_header";
    header.className = "lexi-frontend";
    console.log(document.body);
    header.style.height = header_height;
    // var firstElem = document.body.firstElementChild;
    // firstElem.style.marginTop = '30px';
    // TODO insert button again (See earlier version), when clicked toggle feedback
    var bodyStyle = document.body.style;
    var cssTransform = 'transform' in bodyStyle ? 'transform' : 'webkitTransform';
    bodyStyle[cssTransform] = 'translateY(' + header_height + ')';
    // document.body.appendChild(header);
    document.documentElement.appendChild(header);
    console.log(document.documentElement.innerHTML.substr(0, 1000)+" ...");
    return header;
}

function insert_feedback_modal() {
    var form_html = "";
    form_html += '<div id="lexi-feedback-modal" class="lexi-frontend lexi-modal">';
    form_html += '<div class="lexi-modal-content animate">';
    form_html += '<div class="lexi-rate-area lexi-modal-container">';
    form_html += '<span id="lexi-feedback-modal-close-x" title="Close" style="float: right; " class="close">&times;</span>';
    form_html += '<img id="lexi-logo" src="'+logo_url+'" /><br/>';
    // form_html += '<p>'+browser.i18n.getMessage("lexi_feedback_solicit")+'</p>';
    form_html += '<form id="lexi-feedback-rating" >';
    form_html += '<p>'+browser.i18n.getMessage("lexi_feedback_solicit_freetext")+'</p>';
    form_html += '<textarea id = "lexi_feedback_text"></textarea>';
    form_html += '<p>'+browser.i18n.getMessage("lexi_feedback_solicit")+'</p>';
    form_html += '<div id="lexi-feedback-rating-stars">';
    form_html += '<input type="radio" id="5-star" name="lexi-rating" value="5" /><label for="5-star" title="Amazing">★ </label>';
    form_html += '<input type="radio" id="4-star" name="lexi-rating" value="4" /><label for="4-star" title="Good">★ </label>';
    form_html += '<input type="radio" id="3-star" name="lexi-rating" value="3" /><label for="3-star" title="Average">★ </label>';
    form_html += '<input type="radio" id="2-star" name="lexi-rating" value="2" /><label for="2-star" title="Not Good">★ </label>';
    form_html += '<input type="radio" id="1-star" name="lexi-rating" value="1" /><label for="1-star" title="Bad">★ </label>';
    form_html += '</div>';
    form_html += '<button id="lexi-feedback-modal-close-btn" type="button" class="lexi-button">';
    form_html += browser.i18n.getMessage("lexi_feedback_readon");
    form_html += '</button>';
    form_html += '</form>';
    form_html += '</div>';
    form_html += '</div>';
    form_html += '</div>';
    document.body.innerHTML += form_html;
    return document.getElementById("lexi-feedback-modal");
}

// function feedback_modal_isopen() {
//     var feedback_modal = document.getElementById("lexi_feedback_modal");
//     if (!feedback_modal) {
//         return false;
//     } else {
//         if (feedback_modal.style.display == "none") {
//             return false;
//         }
//     }
//     return true;
// }

function toggle_feedback_modal() {
    var feedback_modal = document.getElementById("lexi-feedback-modal");
    if (simplifications) {
        if (!feedback_modal) {
            // feedback_modal = insert_feedback_modal();
            // feedback_modal.style.display = "block";
        } else {
            if (feedback_submitted) {
                feedback_modal.style.display = "none";
            } else {
                feedback_modal.style.display = "block";
            }
        }
    }
    // feedback_modal.style.display = "block";
}


// function solicit_feedback() {
//     if (!feedback_modal_isopen() && !feedback_submitted){
//         console.log("opening feedback form");
//         insert_feedback_modal();
//         var feedback_modal = document.getElementById("lexi_feedback_modal");
//         feedback_modal.style.display = "block";
//         console.log("feedback form now open");
//     } else {
//         console.log("feedback form already open, or feedback already submitted");
//     }
// }

function register_feedback_action() {
    // insert_feedback_modal();
    $("html").bind("mouseleave", function () {
        console.log("mouse leaving HTML body area...");
        toggle_feedback_modal();
    });
}

browser.storage.sync.get('lexi_user', function (usr_object) {
    USER = usr_object.lexi_user.userId;
    console.log("Started lexi extension. User: "+USER);
    // add_lexi_header();
    create_lexi_notifier();
    insert_feedback_modal();
    display_message(browser.i18n.getMessage("lexi_simplifications_loading"));
    // incremental_load_simplifications();
    load_simplifications(USER);
    insert_feedback_js();
});


// var links = document.getElementsByTagName("a");
// for (var i=0, link; link=links[i]; i++) {
//     link.onmouseover = function() {
//         // solicit_feedback();
//         toggle_feedback_modal();
//     };
// }
