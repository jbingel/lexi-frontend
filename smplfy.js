/**
 * Created by joachim on 10/12/16.
 */

function doSomethingWithSelectedText() {
    var selection = getSelectionRange();
    if (selection) {
        var startNode = selection[0];
        var endNode = selection[2];
        // TODO: use ajax to connect to REST, probably gotta import ajax
        // in background page of extension? [edit: already done]
    }
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
        alert("Please don't select using doubleclick.");
    }
    console.log([startNode, start, endNode, end]);
    return [startNode, start, endNode, end];
}
console.log("Started EZRead extension.");
document.onmouseup = doSomethingWithSelectedText;
