/**
 * Created by joachim on 2/1/18.
 */

window.browser = (function () {
    return window.msBrowser ||
        window.chrome ||
        window.browser;
})();


var FrameManager = {

    currentFrameId : '',
    currentFrameHeight : 0,
    lastFrameId : '',
    lastFrameHeight : 0,
    resizeTimerId : null,

    init: function() {

        if (FrameManager.resizeTimerId == null) {

            FrameManager.resizeTimerId = window.setInterval(FrameManager.resizeFrames, 500);

        }

    },

    resizeFrames: function() {

        FrameManager.retrieveFrameIdAndHeight();

        if ((FrameManager.currentFrameId != FrameManager.lastFrameId) || (FrameManager.currentFrameHeight != FrameManager.lastFrameHeight)) {

            var iframe = document.getElementById(FrameManager.currentFrameId.toString());

            if (iframe == null) return;

            iframe.style.height = FrameManager.currentFrameHeight.toString() + "px";

            FrameManager.lastFrameId = FrameManager.currentFrameId;
            FrameManager.lastFrameHeight = FrameManager.currentFrameHeight;
            window.location.hash = '';

        }

    },

    retrieveFrameIdAndHeight: function() {

        if (window.location.hash.length == 0) return;

        var hashValue = window.location.hash.substring(1);

        if ((hashValue == null) || (hashValue.length == 0)) return;

        var pairs = hashValue.split('&');

        if ((pairs != null) && (pairs.length > 0)) {

            for(var i = 0; i < pairs.length; i++) {

                var pair = pairs[i].split('=');

                if ((pair != null) && (pair.length > 0)) {

                    if (pair[0] == 'frameId') {

                        if ((pair[1] != null) && (pair[1].length > 0)) {

                            FrameManager.currentFrameId = pair[1];
                        }
                    } else if (pair[0] == 'height') {

                        var height = parseInt(pair[1]);

                        if (!isNaN(height)) {

                            FrameManager.currentFrameHeight = height;
                            FrameManager.currentFrameHeight += 15;

                        }
                    }
                }
            }
        }

    },

    registerFrame: function(frame) {

        var currentLocation = location.href;
        var hashIndex = currentLocation.indexOf('#');

        if (hashIndex > -1) {

            currentLocation = currentLocation.substring(0, hashIndex);
        }
        console.log("frame: "+frame);
        console.log("frame.contentwindow: "+frame.contentWindow);
        var y = (frame.contentWindow || frame.contentDocument);
        console.log(y);
        y = frame;
        if (y.document) y = y.document;
        y.location = frame.src + '?frameId=' + frame.id + '#' + currentLocation;

    }
};

window.setTimeout(FrameManager.init, 300);