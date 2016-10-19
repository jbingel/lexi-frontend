/**
 * Created by joachim on 10/12/16.
 */

function doSomethingWithSelectedText() {
    var selection = getSelectionRange();
    if (selection) {
        // console.log(selection[0]);
        // console.log(selection[0].toString());
        // console.log(JSON.stringify(selection[0]));
        var startNode = selection[0].parentNode;
        var endNode = selection[2].parentNode;
        console.log(startNode);
        console.log(endNode);
        var post_data = {};
        post_data["startNode"] = startNode.textContent;
        post_data["startOffset"] = selection[1];
        post_data["endNode"] = endNode.textContent;
        post_data["endOffset"] = selection[3];
        post_data["textBetween"] = null;
        if (startNode != endNode) {
            var textBetween = "";
            var curNode = startNode.nextSibling;
            while (curNode && curNode != endNode) {
                console.log(curNode);
                textBetween = textBetween.concat(" ");
                textBetween = textBetween.concat(curNode.textContent);
                curNode = curNode.nextSibling;
                console.log(textBetween);
            }
            post_data["textBetween"] = textBetween;
        }

        //
        // var post_data = {
        //     "startNode": selection[0],
        //     "startOffset": selection[1],
        //     "endNode": selection[2],
        //     "endOffset": selection[3]
        // };
        console.log(JSON.stringify(post_data));
        $(document).ready(function() {
            // $.post("http://localhost:5000/post",
            //     {"myarg": 3},
            //     function (response, status) {
            //         console.log(response);
            //         alert(response.status);
            //         alert(response.myarg);
            //     }
            // );
            //
            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                headers: { 'access-control-allow-origin': '*' },
                url: "http://127.0.0.1:5000/post",
                data: JSON.stringify(post_data)
            }).then(function(data) {
                $('.myarg').append(data.myarg);
                console.log(data.myarg);
            });
        });
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
        alert("Please don't select using doubleclick. TODO do nothing.");
    //    TODO do nothing
    }
    console.log([startNode, start, endNode, end]);
    return [startNode, start, endNode, end];
}
console.log("Started EZRead extension.");
document.onmouseup = doSomethingWithSelectedText;
