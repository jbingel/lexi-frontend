/**
 * Created by joachim on 5/9/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();

function configure() {
    browser.tabs.executeScript(null, {file: "scripts/inject_login_form.js"}, function() {
        return true;
    });
}

function doInCurrentTab(tabCallback) {
    browser.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {tabCallback(tabArray[0]);}
    );
}

var button_simplify = document.getElementById("button-simplify-all");
button_simplify.onclick = function (ev) {
    console.log("Trying to call simplification for whole page.");
    var activeTabId;
    doInCurrentTab(function (tab) {
        activeTabId = tab.id;
        browser.tabs.sendMessage(activeTabId, {type:'simplify_all'}, function () {
            return true;
        });
    });

};

var button_configure = document.getElementById("button-configure");
button_configure.onclick = function (ev) {
    configure();
};
