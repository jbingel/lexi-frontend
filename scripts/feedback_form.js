/**
 * Created by joachim on 10/13/17.
 */


function send_close_feedback_message() {
    // This will be heard by background.js, which will forward it to simplify.js
    browser.runtime.sendMessage({type:'delete_feedback_iframe'}, function () {
        return true;
    });
}

function send_feedback_contents_message(rating, feedback_text) {
    // This will be heard by background.js, which will forward it to simplify.js
    browser.runtime.sendMessage({type:'feedback', rating: rating, feedback_text: feedback_text}, function () {
        return true;
    });
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
stars[0].onchange = function(){sendFeedback(1)};
stars[1].onchange = function(){sendFeedback(2)};
stars[2].onchange = function(){sendFeedback(3)};
stars[3].onchange = function(){sendFeedback(4)};
stars[4].onchange = function(){sendFeedback(5)};


function sendFeedback(rating) {
    var feedback_text = $("#lexi-feedback-text").val();
    send_feedback_contents_message(rating, feedback_text)
}

