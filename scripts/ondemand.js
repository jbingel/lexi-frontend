/**
 * Created by joachim on 3/10/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

var max_node_identifier_id = 0;
var lexi_ondemand_id = 0;
var request_ids = [];

/* Useful URLs (`settings` is declared in config.js) */
var SERVER_URL = settings.LEXI_SERVER_URL;
var SERVER_URL_FEEDBACK = SERVER_URL+settings.feedback_route;
var SERVER_URL_SIMPLIFY = SERVER_URL+settings.simplify_route;

/* Lexi logo */
var logo_url = browser.runtime.getURL("img/lexi.png");

var frontend_version = browser.runtime.getManifest().version;

/**
 * Id of current user
 * @type {string}
 */
var USER = "default"; // will be overwritten in main (see bottom)

/**
 * Flag whether feedback has been submitted, used to decide
 * whether to open feedback modal again
 * @type {boolean}
 */
var feedback_submitted = false;

/**
 * TODO description below not accurate anymore, update
 * Stores all simplifications as returned from backend. Each simplification
 * has an ID starting with `lexi_'. This object maps an ID to another
 * object containing the fields: (i) `original': the original text,
 * (ii) `simple': the simple version, (iii): `is_simplified': a boolean
 * var indicating whether the sentence has been selected for simplification.
 * @type {{}}
 */
var simplifications = {};
/**
 * Stores simplification element IDs for simplifications that have been
 * clicked (e.g. to find out whether or not to add a bad_feedback_icon).
 * @type {Array}
 */
var clicked_simplifications = [];


function parents(node) {
    var nodes = [node];
    for (; node; node = node.parentNode) {
        nodes.unshift(node)
    }
    return nodes
}

function commonAncestor(node1, node2) {
    if (node1 == node2) {
        console.log("Identical start and end node.");
        return node1.parentNode;
    }

    var parents1 = parents(node1);
    var parents2 = parents(node2);

    if (parents1[0] != parents2[0]) throw "No common ancestor!"

    for (var i = 0; i < parents1.length; i++) {
        if (parents1[i] != parents2[i]) return parents1[i - 1];
    }
}


function getSelectedNodes() {
    var nodes = [];
    var range = getSelectionRange();

    if (range) {
        var ancestorNode = commonAncestor(range[0], range[2]);
        console.log(ancestorNode);
        var offsets_in_ancestor = getSelectionCharacterOffsetWithin(ancestorNode);
        console.log(ancestorNode, offsets_in_ancestor);

        nodes.push({
            "node": ancestorNode,
            "startOffset": offsets_in_ancestor.start,
            "endOffset": offsets_in_ancestor.end
        });
        //
        // var firstNode = range[0].parentNode;
        // var lastNode = range[2].parentNode;
        // // var firstNode = range[0];
        // // var lastNode = range[2];
        //
        // // typical case: selection is within one node
        // if (firstNode == lastNode) {
        //     nodes.push({
        //         "node": firstNode,
        //         "startOffset": range[1],
        //         "endOffset": range[3]
        //     });
        //
        // // else: first and last node are not the same
        // } else { // TODO test if child relation between nodes, too!
        //     nodes.push({
        //         "node": firstNode,
        //         "startOffset": range[1],
        //         "endOffset": firstNode.outerHTML.length
        //     });
        //     var curNode = firstNode.nextSibling;
        //     while (curNode && curNode != lastNode) {
        //         nodes.push({
        //             "node": curNode,
        //             "startOffset": 0,
        //             "endOffset": 0
        //         });
        //         curNode = curNode.nextSibling;
        //     }
        //     nodes.push({
        //         "node": lastNode,
        //         "startOffset": 0,
        //         "endOffset": range[3]
        //     });
        // }
    }
    // clear_selection();
    return nodes;
}

/**
 * Gets the char offset from the document start for a given node
 * @param node
 * @returns {Number} The char offset from the document start
 */
function getNodeOffset(node) {
    var range = document.createRange();
    range.selectNodeContents(document.body);
    range.setEnd(node, 0);
    console.log(range, range.toString());
    console.log("Offset", range.toString().length);
    return range.toString().length;
}

function toType (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function getNodeSrcOffset(node) {
    var node_identifier = "lexi-node-id-" + max_node_identifier_id.toString();
    max_node_identifier_id += 1;
    console.log(node, node_identifier);
    console.log("Type:", toType(node));
    node.setAttribute("data-lexi-node-id", node_identifier);
    return document.body.innerHTML.indexOf(node_identifier) + node_identifier.length - 13;
}


/**
 * Gets selection offset relative to a parent element
 * https://stackoverflow.com/questions/4811822/
 * @param element the parent element
 * @returns {{start: number, end: number}}
 */
function getSelectionCharacterOffsetWithin(element) {
    var start = 0;
    var end = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            start = preCaretRange.toString().length;
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            end = preCaretRange.toString().length;
        }
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToStart", textRange);
        start = preCaretTextRange.text.length;
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        end = preCaretTextRange.text.length;
    }
    return { start: start, end: end };
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

    if (startNode == endNode && start == end) {
        // nothing selected, nothing to do
        return null;
    }

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
    console.log(startNode, start, endNode, end);
    return [startNode, start, endNode, end];
}

function clear_selection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {  // IE?
        document.selection.empty();
    }
}

function offer_simplification(mouse_event) {
    var selected_nodes = getSelectedNodes();
    console.log(selected_nodes);
    // limit functionality to when a single node is selected, else backend is overloaded
    // also don't insert another button when the mouseup event is on this Lexi button
    if (selected_nodes.length == 1 &&
        mouse_event.srcElement.className != "lexi-ondemand-simplification-button") {
        var node = selected_nodes[0];
        inject_simplification_button(node["node"], node["startOffset"], node["endOffset"],
            mouse_event.clientX, mouse_event.clientY);
    }
}


function simplify(node, start, end) {
    // var selected_nodes = getSelectedNodes();
    // limit functionality to when a single node is selected, else backend is overloaded
    // if (selected_nodes.length == 1) {
    //     var node = selected_nodes[0]["node"];
    console.log(node);
    // display_message(browser.i18n.getMessage("lexi_simplifications_loading"), false);
    if (end <= 0) {end = node.textContent.length}
    return new Promise(function (resolve, reject) {
        simplifyAjaxCall(SERVER_URL_SIMPLIFY, node.outerHTML, start, end).then(function (result) {
            simplifications = Object.assign(simplifications, result['simplifications']);  // updates the object
            request_ids.push(result['request_id']);
            console.log(simplifications);
            console.log("Lexi request ID: "+result['request_id']);
            console.log("Backend version: "+result['backend_version']);
            console.log(result);
            if (simplifications) {
                // replace original HTML with markup returned from backup
                // (enriched w/ simplifications)
                console.log(result['html']);
                node.outerHTML = result['html'];
                make_interface_listeners();
                // Create listeners for clicks on simplification spans
                make_simplification_listeners();
                // prepare for feedback
                register_feedback_action();
                resolve(simplifications);
            } else {
                display_message(browser.i18n.getMessage("lexi_simplifications_error"));
                reject(new Error("Could not simplify."));
            }
        });
    })
    // }
}


/* ******************************* *
 * ******************************* *
 * ********* AJAX CALLS ********** *
 * ******************************* *
 * ******************************* */

/**
 * Makes an AJAX call to backend requesting simplifications based on some HTML.
 * @param {string} url -
 * @param {string} html -
 * @param {string} startOffset -
 * @param {string} endOffset -
 * @returns {Promise}
 */
function simplifyAjaxCall(url, html, startOffset, endOffset) {
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    request['html'] = html;
    request['startOffset'] = startOffset;
    request['endOffset'] = endOffset;
    request['url'] = window.location.href;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = function(e){
            display_message(browser.i18n.getMessage("lexi_unknown_server_error"));
        };
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhr.setRequestHeader("access-control-allow-origin", "*");
        xhr.send(JSON.stringify(request));
    })
}

/**
 *
 * @param {string} url
 * @param {string} rating
 * @param {string} feedback_text
 * @returns {Promise}
 */
function feedbackAjaxCall(url, rating, feedback_text) {
    console.log("Sending feedback for request IDs:"+request_ids);
    var request = {};
    request['frontend_version'] = frontend_version;
    request['email'] = USER;
    request['simplifications'] = simplifications;
    request['rating'] = rating;
    request['feedback_text'] = feedback_text;
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


function toggle_feedback_reminder() {
    var _feedback_reminder = document.getElementById("lexi-feedback-reminder");
    if (_feedback_reminder) {
        if (simplifications) {
            if (! feedback_submitted) {
                _feedback_reminder.style.display = "block";
            }
        }
    }
}

function inject_simplification_button(node, start, end, mouse_x, mouse_y) {
    var simplification_button = document.createElement("div");
    simplification_button.setAttribute("class", "lexi-ondemand-simplification-button");
    simplification_button.setAttribute("id", "lexi-ondemand-simplification-"+lexi_ondemand_id.toString());
    simplification_button.setAttribute("style",
        "top:"+(mouse_y-20).toString()+"px; left:"+(mouse_x+20).toString()+"px;");
    var lexi_logo = document.createElement("img");
    lexi_logo.setAttribute("class", "lexi-ondemand-simplification-button");
    lexi_logo.src = logo_url;
    console.log(simplification_button);
    lexi_logo.addEventListener("click", function () {
        clear_selection();
        lexi_ondemand_id += 1;
        simplification_button.style.display = "none";
        simplify(node, start, end);
    });
    simplification_button.appendChild(lexi_logo);
    document.body.appendChild(simplification_button);
}

function register_feedback_action() {
    $("html").bind("mouseleave", function () {
        console.log("mouse leaving HTML body area...");
        toggle_feedback_reminder();
    });
}

function display_message(msg, display_closer) {
    var notify_elem = document.getElementById("lexi-notifier");
    notify_elem.style.display = "block";
    var notify_elem_text = document.getElementById("lexi-notifier-text");
    notify_elem_text.innerHTML = msg;
    var notifier_closer = document.getElementById("lexi-notifier-close");
    if (display_closer == false) {
        notifier_closer.style.opacity = "none";
    } else if (display_closer == true) {
        notifier_closer.style.display = "block";
    }
}

function inject_notification_container() {
    var notification_container = document.createElement("div");
    notification_container.setAttribute("id", "lexi-notification-container");
    document.body.appendChild(notification_container);
}

function feedback_reminder_choice_handler(do_give_feedback) {
    close_feedback_reminder();
    if (do_give_feedback) {
        toggle_feedback_modal();
    }
}

function close_iframe(iframe_id, full_delete) {
    console.log("Removing iframe: "+iframe_id);
    var iframe_container = document.getElementById(iframe_id+"-container");
    if (iframe_container) {
        if (full_delete) {
            document.body.removeChild(iframe_container);
        } else {
            iframe_container.style.display = "none";
        }
    }
}

function close_feedback_reminder(full_delete) {
    $("#lexi-feedback-reminder").hide();
}

function close_notifier(full_delete) {
    $("#lexi-notifier").hide();
}

function close_feedback_modal_iframe(full_delete) {
    close_iframe("lexi-feedback-modal-iframe", full_delete);
}

function toggle_feedback_modal() {
    console.log("Toggling feedback modal");
    if (simplifications) {
        if (feedback_submitted) {
            console.log("Feedback already submitted, doing nothing.");
        } else {
            if (document.getElementById("lexi-feedback-modal-iframe-container")) {
            // if (document.getElementById("lexi-feedback-modal")) {
                console.log("Feedback reminder already there, doing nothing.")
            } else {
                console.log("Should display now...");
                inject_feedback_form();
            }
        }
    }
}

function make_interface_listeners() {
    var feedback_btn_now = document.getElementById("lexi-feedback-button-now");
    feedback_btn_now.addEventListener('click', function() {
        feedback_reminder_choice_handler(true)
    });
    var feedback_reminder_close = document.getElementById("lexi-feedback-reminder-close");
    feedback_reminder_close.addEventListener('click', function() {
        feedback_reminder_choice_handler(false)
    });
    var lexi_notifier_close = document.getElementById("lexi-notifier-close");
    lexi_notifier_close.addEventListener('click', function() {
        close_notifier();
    });
}


/**
 *
 * @param {string} elemId
 */
function change_text(elemId) {
    console.log(simplifications);
    var elem = document.getElementById(elemId);
    var choices = simplifications[elemId].choices;
    var original = simplifications[elemId].original;
    simplifications[elemId].selection++; // increment by 1
    var display = simplifications[elemId].selection % choices.length;
    elem.innerHTML = choices[display];
    elem.setAttribute("data-displaying-original",
        (choices[display] == original).toString());
    console.log(simplifications[elemId]);
    console.log(clicked_simplifications);
}


/**
 *
 */
function make_simplification_listeners() {
    $(".lexi-simplify").each(function () {
        console.log(this.id, this);
        this.onclick = function() {
            change_text(this.id);
            if (jQuery.inArray(this.id, clicked_simplifications) == -1) {
                // insert_thumbsdown_icon(this);
                clicked_simplifications.push(this.id);
                console.log(clicked_simplifications);
            }
        };
    })
}

/**
 *
 */
function inject_lexi_notifier(callback){
    var lexi_notifier = document.createElement("div");
    lexi_notifier.setAttribute("id", "lexi-notifier");
    lexi_notifier.setAttribute("class", "lexi-frontend lexi-notification animate");
    lexi_notifier.setAttribute("style", "display:none");

    var lexi_notifier_flexbox = document.createElement("div");
    lexi_notifier_flexbox.setAttribute("class", "flexbox");

    var lexi_logo = document.createElement("img");
    lexi_logo.setAttribute("class", "lexi-logo");
    lexi_logo.setAttribute("src", logo_url);

    var lexi_notifier_text = document.createElement("div");
    lexi_notifier_text.setAttribute("id", "lexi-notifier-text");
    lexi_notifier_text.setAttribute("class", "lexi-notification-content");
    // lexi_notifier_text.setAttribute("style", "float: left; max-width: 270px");
    var lexi_notifier_close = document.createElement("div");
    lexi_notifier_close.setAttribute("id", "lexi-notifier-close");
    lexi_notifier_close.setAttribute("class", "close");
    // lexi_notifier_close.setAttribute("style", "float: right; margin-left: 15px; font-size:150%");
    lexi_notifier_close.innerHTML = "&times;";

    var notification_container = document.getElementById("lexi-notification-container");
    notification_container.appendChild(lexi_notifier);
    lexi_notifier.appendChild(lexi_notifier_flexbox);
    lexi_notifier_flexbox.appendChild(lexi_logo);
    lexi_notifier_flexbox.appendChild(lexi_notifier_text);
    lexi_notifier_flexbox.appendChild(lexi_notifier_close);

    lexi_notifier_close.onclick = function () {
        $("#lexi-notifier").hide();
    };
    // setTimeout(function (){
    //     console.log("registering");
    //
    //     lexi_notifier_close.onclick = function() {
    //         console.log("closing...");
    //         close_notifier();
    //     }}, 5000);

    if (callback) callback();
}


/**
 *
 */
function inject_feedback_reminder() {
    var feedback_reminder = document.createElement("div");
    feedback_reminder.setAttribute("id", "lexi-feedback-reminder");
    feedback_reminder.setAttribute("class", "lexi-frontend lexi-notification animate");
    feedback_reminder.style.display = "none";  // deactivated per default

    var lexi_feedback_reminder_flexbox = document.createElement("div");
    lexi_feedback_reminder_flexbox.setAttribute("class", "flexbox");

    var lexi_logo = document.createElement("img");
    lexi_logo.setAttribute("class", "lexi-logo");
    lexi_logo.setAttribute("src", logo_url);

    var lexi_feedback_reminder_text = document.createElement("div");
    lexi_feedback_reminder_text.setAttribute("id", "lexi-feedback-reminder-text");
    lexi_feedback_reminder_text.setAttribute("class", "lexi-notification-content");
    lexi_feedback_reminder_text.textContent = browser.i18n.getMessage("lexi_feedback_reminder");

    // button listeners declared in make_interface_listeners()
    var open_feedback_modal_btn_now = document.createElement("button");
    open_feedback_modal_btn_now.setAttribute("id", "lexi-feedback-button-now");
    open_feedback_modal_btn_now.setAttribute("class", "lexi-button");
    open_feedback_modal_btn_now.textContent = browser.i18n.getMessage("lexi_feedback_reminder_ok");

    var feedback_reminder_close = document.createElement("div");
    feedback_reminder_close.setAttribute("id", "lexi-feedback-reminder-close");
    feedback_reminder_close.setAttribute("class", "close");
    feedback_reminder_close.innerHTML = "&times;";
    feedback_reminder_close.style.display = "none";  // setting this for now, might want to activate again later

    var notification_container = document.getElementById("lexi-notification-container");
    lexi_feedback_reminder_flexbox.appendChild(lexi_logo);
    lexi_feedback_reminder_flexbox.appendChild(lexi_feedback_reminder_text);
    lexi_feedback_reminder_flexbox.appendChild(feedback_reminder_close);
    feedback_reminder.appendChild(lexi_feedback_reminder_flexbox);
    feedback_reminder.appendChild(open_feedback_modal_btn_now);
    notification_container.appendChild(feedback_reminder);
}

function inject_feedback_form() {
    var lexi_feedback_modal_iframe_container = document.createElement("div");
    lexi_feedback_modal_iframe_container.id = "lexi-feedback-modal-iframe-container";
    lexi_feedback_modal_iframe_container.style = "position:fixed; left: 0; right: 0; " +
        "bottom: 0; top: 0px; z-index: 1000001; display: block;";

    var lexi_feedback_modal_iframe = document.createElement("iframe");
    lexi_feedback_modal_iframe.onload = function() {
        // resizeIframe(this);
        console.log("lexi_feedback_modal_iframe loaded.");
    };
    lexi_feedback_modal_iframe.id = "lexi-feedback-modal-iframe";
    lexi_feedback_modal_iframe.src = browser.extension.getURL("pages/feedback_form.html");
    lexi_feedback_modal_iframe.style = "height: 100%; width: 100%; border: none;";

    lexi_feedback_modal_iframe_container.appendChild(lexi_feedback_modal_iframe);
    document.body.appendChild(lexi_feedback_modal_iframe_container);
}

function handle_feedback(rating, feedback_text) {
    feedbackAjaxCall(SERVER_URL_FEEDBACK, rating, feedback_text);
    setTimeout(close_feedback_modal_iframe(), 1000);
    display_message(browser.i18n.getMessage("lexi_feedback_submitted"));
}

function handle_simplify_all(message, sender, sendResponse) {
    if (message.type === "simplify_all") {
        return simplify_all().then(function () {
            // send this message to popup script. sendResponse or sending Promise doesn't work somehow
            // TODO adapt this to send Promise instead:
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
            browser.runtime.sendMessage({"type": "simplification_done"});
        })
    }
}

function simplify_all() {
    return new Promise(function(resolve, reject) {
        simplify(document.body, 0, 0)
            .then(function (value) {resolve(true)})
            .catch(function() {console.log('error');}
        );
    })
}

/* ******************************* *
 * ******************************* *
 * ****** MESSAGE LISTENERS ****** *
 * ******************************* *
 * ******************************* */

/* these are for cross-origin communication between frames */

/* Messages from backgroundscripts */
browser.runtime.onMessage.addListener(handle_simplify_all);
//
//     function (message) {
//     if (message.type === "simplify_all") {
//         handle_simplify_all(message)
//     }
// });

/* Messages from other content scripts */
window.addEventListener("message", function (event) {
    console.log(event.data);
    if (event.data.type == "close_notifier") {
        close_notifier();
    } else if (event.data.type == "solicit_feedback") {
        close_feedback_reminder();
        toggle_feedback_modal();
    } else if (event.data.type == "delete_feedback_iframe") {
        close_feedback_modal_iframe(true);
    } else if (event.data.type == "close_login_iframe") {
        close_login_iframe(true);
    } else if (event.data.type == "feedback") {
        handle_feedback(event.data.rating, event.data.feedback_text);
    } else if (event.data.type == "resize_iframe") {
        // resize_iframe(event.data.iframe_id, event.data.width, event.data.height);
    }
});


/* ******************************* *
 * ******************************* *
 * ************ MAIN ************* *
 * ******************************* *
 * ******************************* */

console.log("Lexi: Ondemand simplification available.");

browser.storage.sync.get('lexi_user', function (usr_object) {
    USER = usr_object.lexi_user.userId;
    console.log("Started lexi extension. User: "+USER);
    inject_notification_container();
    inject_lexi_notifier();
    inject_feedback_reminder();
    // load_simplifications();
    document.onmouseup = function (event) {
        $(".lexi-ondemand-simplification-button").each(function (){
            this.style.display = "none";
        });
        offer_simplification(event);
    }
});
