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

var SERVER_URL = "http://127.0.0.1:5000";
var simplifications = {};

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
function changeText(elemId) {
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
}

/**
 *
 */
function make_simplification_listeners() {
    $(".simplify").each(function () {
        this.addEventListener('click', function () {
            // changeText(this.id, this.dataset.alt1, this.dataset.alt2);
            changeText(this.id);
        })
    })
}

/**
 *
 * @param {string} usr
 */
function load_simplifications(usr) {
    simplifyAjaxCall(SERVER_URL+"/post", document.body.outerHTML, usr).then(function (result) {
        document.body.outerHTML = result['html'];
        simplifications = result['simplifications'];
        console.log(simplifications);
        var header = document.getElementById("ezread");
        header.textContent = "Simplifications loaded. " +
            "Click on highlighted words to simplify them.";
        // Add submit feedback button
        var button = document.createElement("button");
        button.innerHTML = "Click when done!";
        button.id = "feedback_button";
        header.appendChild(button);
        button.addEventListener('click', function() {
            feedbackAjaxCall(SERVER_URL+"/feedback", usr);
        });
        make_simplification_listeners();
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
    var header = document.createElement("div");
    header.id = "ezread";
    document.body.insertBefore(header, document.body.firstChild);
    console.log(document.documentElement.innerHTML);
}

var usr = "xyz";  // TODO: get user ID
console.log("Started EZRead extension. User: "+usr);
// register_styles();
add_ezread_header();
document.getElementById("ezread").textContent = "Loading simplifications...";
load_simplifications(usr);




