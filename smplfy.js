/**
 * Created by joachim on 10/12/16.
 */

function getSelectedText() {
    var post_data = {};
    var selection = getSelectionRange();
    if (selection) {
        var startNode = selection[0].parentNode;
        var endNode = selection[2].parentNode;
        post_data["startNode"] = startNode;
        post_data["startNodeText"] = startNode.textContent;
        post_data["startOffset"] = selection[1];
        post_data["endNode"] = endNode;
        post_data["endNodeText"] = endNode.textContent;
        post_data["endOffset"] = selection[3];
        post_data["betweenNodesText"] = null;
        post_data["betweenNodes"] = [];
        post_data["outerHtml"] = startNode.outerHTML;
        if (startNode != endNode) {  // TODO test if child relation between nodes, too!
            var betweenText = "";
            var betweenNodes = [];
            var curNode = startNode.nextSibling;
            while (curNode && curNode != endNode) {
                betweenText = betweenText.concat(" ");
                betweenText = betweenText.concat(curNode.textContent);
                betweenNodes.push(curNode);
                curNode = curNode.nextSibling;
            }
            post_data["betweenNodes"] = betweenNodes;
            post_data["betweenNodesText"] = betweenText;
        }
    }
    return post_data;
}


function getRestResponse(post_data) {
    // console.log(JSON.stringify(post_data));
    $(document).ready(function() {
        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            headers: { 'access-control-allow-origin': '*' },
            url: "http://127.0.0.1:5000/post",
            data: JSON.stringify(post_data),
            success: processResponse
            // success: function(data) {
            //     // console.log(data.textOut);
            //     console.log("FOOOO");
            //     // $('.length').append(data.length);
            //     // $('.textOut').append(data.textOut);
            //     // console.log(data.length);
            //     response = data.textOut;
            //     console.log(response.slice(0, 50));
            //     // post_data.startNode.textContent = data.textOut;
            //     post_data.startNode.outerHTML = data.textOut;
            // }
        });
    });
}


function ajaxCall(url, html) {
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
        xhr.send(JSON.stringify(html));
    })
}

function load_simplifications() {
    ajaxCall("http://127.0.0.1:5000/post", document.documentElement.outerHTML).then(function (result) {
        document.documentElement.innerHTML = result['html'];
    });

    // var rest_response = getRestResponse(post_data);
    // console.log(post_data);
    // console.log("REST RESPONSE: ");
    // console.log(rest_response);
    // post_data.startNode.textContent = "FOO";
    // post_data.startNode.textContent = rest_response;
}


function processResponse(data) {
    $('.length').append(data.length);
    $('.textOut').append(data.textOut);
    console.log("textOut");
    console.log(data.textOut);
    var response = data.textOut;
    // return data;
}


/**
 * Gets the char offset from the document start for a given node
 * @param node
 * @returns {Number} The char offset from the document start
 */
function getNodeOffset(node) {
    var range = document.createRange();
    range.selectNodeContents(document);
    range.setEnd(node, 0);
    return range.toString().length;
}

/**
 * Gets the current selection and finds its start and end (nodes and char offsets)
 * @returns {*[]} startNode, offset_in_startNode, endNode, offset_in_endNode
 */
function getSelectionRange() {
    var sel = window.getSelection();
    var startNode = sel.anchorNode;
    var endNode = sel.focusNode;
    var start = sel.anchorOffset;
    var end = sel.focusOffset;
    // if selected from right to left within same node, flip start/end
    if (startNode == endNode && start > end) {
        start = sel.focusOffset;
        end = sel.anchorOffset;
    }
    // if selected bottom to top across nodes, flip start/end
    if (getNodeOffset(startNode) > getNodeOffset(endNode)) {
        startNode = sel.focusNode;
        endNode = sel.anchorNode;
        start = sel.focusOffset;
        end = sel.anchorOffset;
    }
    if (startNode == endNode && start == end) {
        alert("Please don't select using doubleclick. TODO do nothing.");
    //    TODO do nothing
    }
    console.log([startNode, start, endNode, end]);
    return [startNode, start, endNode, end];
}

// CSS rules
function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

addStyleString('.simple {display: none}');
addStyleString('.normal:hover {background: yellow}');
addStyleString('simple: {background: green}');


function simplify() {

}


var simple = (function(html) {
    var res;
    ajaxCall("http://127.0.0.1:5000/post", html).then(function (result) {
        // console.log(result['html']);
        // document.onmouseup = simplify(result['html']);
        res = result;
    });
    return res;
});

console.log("Started EZRead extension.");
load_simplifications();
document.onmouseup = simplify;
