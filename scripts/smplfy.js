/**
 * Created by joachim on 10/12/16.
 */

/**
 * Stores all simplifications as returned from backend. Each simplification has an ID starting with
 * `ezread_'. This object maps an ID to another object containing the fields: (i) `original': the original
 * text, (ii) `simple': the simple version, (iii): `is_simplified': a boolean var indicating whether the
 * sentence has been selected for simplification.
  * @type {{}}
 */
var simplifications = {};
var clicked_simplifications = [];

SERVER_URL = "http://127.0.0.1:5000";

/**
 * Makes an AJAX call to backend requesting simplifications based on some HTML.
 * @param {string} url -
 * @param {string} html -
 * @param {string} usr -
 * @returns {Promise}
 */
function simplifyAjaxCall(url, html, usr) {
    var request = {};
    request['user'] = usr;
    request['html'] = html;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = reject;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/**
 *
 * @param {string} url
 * @param {string} usr
 * @returns {Promise}
 */
function feedbackAjaxCall(url, usr) {
    var request = {};
    request['user'] = usr;
    request['simplifications'] = simplifications;
    return new Promise(function(resolve, reject) {
        // console.log(html.slice(0, 20));
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
            // console.log(this.responseText);
        };
        xhr.onerror = reject;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
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
    var is_simplified = simplifications[elemId].is_simplified;
    if (is_simplified) {
        elem.innerHTML = orig;
        simplifications[elemId].is_simplified = false;
    } else {
        elem.innerHTML = simple;
        simplifications[elemId].is_simplified = true;
    }
    console.log(simplifications[elemId]);
    console.log(clicked_simplifications);
}


function toggle_bad_feedback(element, img) {
    var ref = element.getAttribute("data-reference");
    simplifications[ref].bad_feedback = ! simplifications[ref].bad_feedback;
    console.log(simplifications[ref]);
    if (simplifications[ref].bad_feedback) {
        img.src = chrome.runtime.getURL("img/bad_feedback_selected.png");
    } else {
        img.src = chrome.runtime.getURL("img/bad_feedback.png");
    }
}


/**
 *
 */
function make_simplification_listeners() {
    $(".simplify").each(function () {
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
 *
 */
function add_bad_feedback_icon(element) {
    var elemId = element.id;
    var feedback_span = document.createElement("span");
    feedback_span.setAttribute("class", "bad_feedback");
    feedback_span.setAttribute("data-reference", elemId);
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("img/bad_feedback.png");
    img.setAttribute("class", "bad_feedback_icon");
    element.insertAdjacentElement("afterend", feedback_span);

    feedback_span.appendChild(img);
    feedback_span.addEventListener('click', function () {
        // change_text(this.id, this.dataset.alt1, this.dataset.alt2);
        toggle_bad_feedback(feedback_span, img);
    })
}
// /**
//  *
//  */
// function make_bad_feedback_images() {
//     $(".bad_feedback").each(function () {
//         var img = document.createElement("img");
//         img.src = chrome.runtime.getURL("img/bad_feedback.png");
//         this.appendChild(img);
//         this.addEventListener('click', function () {
//             // change_text(this.id, this.dataset.alt1, this.dataset.alt2);
//             toggle_bad_feedback(this, img);
//         })
//     })
// }

/**
 *
 * @param {string} usr
 */
function load_simplifications(usr) {
    simplifyAjaxCall(SERVER_URL+"/post", document.body.outerHTML, usr).then(function (result) {
        document.body.outerHTML = result['html'];
        simplifications = result['simplifications'];
        console.log(simplifications);
        var header = document.getElementById("ezread_header");
        header.textContent = "Click on underlined words to simplify them.";
        // Add submit feedback button
        var button = document.createElement("button");
        button.innerHTML = "Click when done!";
        button.id = "feedback_button";
        header.appendChild(button);
        button.addEventListener('click', function() {
            feedbackAjaxCall(SERVER_URL+"/feedback", usr);
        });
        make_simplification_listeners();
        // make_bad_feedback_images();
    });
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
 *
 */
function add_ezread_header() {
    var header_height = "30px";
    var header = document.createElement("div");
    header.id = "ezread_header";
    header.className = "ezread";
    console.log(document.body);
    header.style.height = header_height;
    // var firstElem = document.body.firstElementChild;
    // firstElem.style.marginTop = '30px';
    var bodyStyle = document.body.style;
    var cssTransform = 'transform' in bodyStyle ? 'transform' : 'webkitTransform';
    bodyStyle[cssTransform] = 'translateY(' + header_height + ')';
    document.documentElement.appendChild(header);
    console.log(document.documentElement.innerHTML);
}

chrome.storage.sync.get('ezread_user', function (usr_object) {
    var usr = usr_object.ezread_user.userId;
    console.log("Started EZRead extension. User: "+usr);
    // register_styles();
    add_ezread_header();
    document.getElementById("ezread_header").textContent = "Loading simplifications...";
    load_simplifications(usr);
});




