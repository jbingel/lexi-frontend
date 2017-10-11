/**
 * Created by joachim on 10/7/17.
 */

function get_message(message_id, language, args) {
    var pattern = retrieve_message_pattern(message_id, language);
    return pattern;
}


function retrieve_message_pattern(message_id, language) {
    var default_msgs = require("_locales/en.json");
    var msgs = require("_locales/{}.json".format(language));
    var pattern_out = msgs.get(message_id);
    if (!pattern_out) {
        pattern_out = default_msgs.get(message_id)
    }
    return pattern_out;
}