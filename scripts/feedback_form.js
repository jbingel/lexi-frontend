/**
 * Created by joachim on 10/13/17.
 */

// jQuery(window).bind('beforeunload', function(){
//     return 'my text';
// });

window.onbeforeunload = function () {
    console.log("leaving...");
    var body = document.body;
    // body.
};

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


function sendFeedback(rating) {
    // sleep(5); //TODO find out what goes here.
    var feedback_txt = $("#lexi-feedback-text").val();
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_txt);
    feedback_submitted = true;
    setTimeout(toggle_feedback_modal(), 1000);
    // toggle_feedback_modal();
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));
}

/* ******************************* *
 * ******************************* *
 * ********* AJAX CALLS ********** *
 * ******************************* *
 * ******************************* */

/**
 *
 * @param {string} url
 * @param {string} rating
 * @param {string} feedback_txt
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