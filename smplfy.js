/**
 * Created by joachim on 10/12/16.
 */

/**
 * Returns <p> element and character offsets for selected text
 * @returns {Array}
 */

function doSomethingWithSelectedText() {
    var selection = getSelectionRange();
    if (selection) {
        // alert("Selection " + selection);
    }
}

function getNodeOffset(node) {
    var range = document.createRange();
    range.selectNodeContents(document);
    range.setEnd(node, 0);
    return range.toString().length;
}

function getSelectionRange() {
    var sel = window.getSelection();
    var p = sel.anchorNode;
    // if (p.nodeType == 3) {
    //     p = p.parentNode;
    // }
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
