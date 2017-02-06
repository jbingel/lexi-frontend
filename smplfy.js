/**
 * Created by joachim on 10/12/16.
 */

// function getSelectedText() {
//     var post_data = {};
//     var selection = getSelectionRange();
//     if (selection) {
//         var startNode = selection[0].parentNode;
//         var endNode = selection[2].parentNode;
//         post_data["startNode"] = startNode;
//         post_data["startNodeText"] = startNode.textContent;
//         post_data["startOffset"] = selection[1];
//         post_data["endNode"] = endNode;
//         post_data["endNodeText"] = endNode.textContent;
//         post_data["endOffset"] = selection[3];
//         post_data["betweenNodesText"] = null;
//         post_data["betweenNodes"] = [];
//         post_data["outerHtml"] = startNode.outerHTML;
//         if (startNode != endNode) {  // TODO test if child relation between nodes, too!
//             var betweenText = "";
//             var betweenNodes = [];
//             var curNode = startNode.nextSibling;
//             while (curNode && curNode != endNode) {
//                 betweenText = betweenText.concat(" ");
//                 betweenText = betweenText.concat(curNode.textContent);
//                 betweenNodes.push(curNode);
//                 curNode = curNode.nextSibling;
//             }
//             post_data["betweenNodes"] = betweenNodes;
//             post_data["betweenNodesText"] = betweenText;
//         }
//     }
//     return post_data;
// }

var simplifications = {};

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

function feedbackAjaxCall(url, html, usr) {
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

function make_simplification_listeners() {
    $(".simplify").each(function () {
        this.addEventListener('click', function () {
            // changeText(this.id, this.dataset.alt1, this.dataset.alt2);
            changeText(this.id);
        })
    })
}

function load_simplifications(usr) {
    simplifyAjaxCall("http://127.0.0.1:5000/post", document.body.outerHTML, usr).then(function (result) {
        document.body.outerHTML = result['html'];
        simplifications = result['simplifications'];
        console.log(simplifications);
        var header = document.getElementById("ezread");
        header.textContent = "Simplifications loaded. " +
            "Click on highlighted spans to simplify them.";
        // Add submit feedback button
        var button = document.createElement("button");
        button.innerHTML = "Click when done!";
        button.id = "feedback_button";
        header.appendChild(button);
        button.addEventListener('click', function() {
            feedbackAjaxCall("http://127.0.0.1:5000/feedback", "fooo", usr);
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

// CSS rules
function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.head.appendChild(node);
}

function add_ezread_header() {
    var header = document.createElement("div");
    header.id = "ezread";
    document.body.insertBefore(header, document.body.firstChild);
    console.log(document.documentElement.innerHTML);
}

var usr = "xyz";
console.log("Started EZRead extension. User: "+usr);
// register_styles();
add_ezread_header();
document.getElementById("ezread").textContent = "Loading simplifications...";
load_simplifications(usr);




