/**
 * Created by joachim on 10/13/17.
 */

var this_iframe_id = "lexi-feedback-modal-iframe";


function send_close_feedback_message() {
    var event = {"type": "delete_feedback_iframe"};
    parent.postMessage(event, "*");
}

function send_feedback_contents_message(rating, feedback_text) {
    var event = {
        "type": "feedback",
        "rating": rating,
        "feedback_text": feedback_text
    };
    parent.postMessage(event, "*");
}

var close_button = document.getElementById("lexi-feedback-modal-close-btn");
var close_x = document.getElementById("lexi-feedback-modal-close-x");
close_x.onclick = close_button.onclick = function () {
    send_close_feedback_message();
};
// var form = document.getElementById("lexi-feedback-rating");
var stars = document.getElementsByName("lexi-rating");
console.log(stars.length.toString()+" stars");
console.log(stars);
// stars[0].bind("onchange", )
stars[0].onchange = function(){sendFeedback(5)};
stars[1].onchange = function(){sendFeedback(4)};
stars[2].onchange = function(){sendFeedback(3)};
stars[3].onchange = function(){sendFeedback(2)};
stars[4].onchange = function(){sendFeedback(1)};


function sendFeedback(rating) {
    var feedback_text = $("#lexi-feedback-text").val();
    send_feedback_contents_message(rating, feedback_text)
}
