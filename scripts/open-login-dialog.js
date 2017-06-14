/**
 * Created by joachim on 6/7/17.
 */

// chrome.runtime.sendMessage({type:'request_password'});

// Handle requests for passwords
// chrome.runtime.onMessage.addListener(function(request, sender) {
//     alert(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
//     if (request.type === 'request_password') {
//         chrome.tabs.create({
//             url: chrome.extension.getURL('user_cred.html'),
//             active: false
//         }, function(tab) {
//             // After the tab has been created, open a window to inject the tab
//             chrome.windows.create({
//                 tabId: tab.id,
//                 type: 'popup',
//                 focused: true
//                 // incognito, top, left, ...
//             });
//         });
//     }
// });