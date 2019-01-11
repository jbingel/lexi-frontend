# Frontend for the lexi browser plugin

## Changelog

### Version 0.4.9
+ Restructuring, code cleanup
+ hot key Ctrl+Shift+L to simplify whole page

### Version 0.4.8
+ Identify language and limit simplifications to supported languages, display warning if not supported 
+ Provide language ID to simplification call

### Version 0.4.7
+ Warning if no user registered (e.g. after fresh install)

### Version 0.4.6
+ Connection check at browser action
+ Check for new version at browser action

### Version 0.4.5
+ Popup menu to change user and simplify whole page

### Version 0.4.4
+ Allow to simplify whole page again (targets with available synonyms)

### Version 0.4.3
+ Terms and conditions link

### Version 0.4.2
+ Disabled simplification of entire page after login/registration

### Version 0.4.1
+ Fixed bugs with on-demand simplifications
+ `session_id` renamed to `request_id`
+ Fixed on-demand simplification interface

### Version 0.4.0
+ Moved to on-demand simplifications
+ Removed thumbsdown and feedback text

### Version 0.3.4
+ Improved CSS to prevent linebreaks at thumbsdown

### Version 0.3.3
+ Allow execution of Lexi only once per tab load
+ better style of notification boxes

### Version 0.3.2
+ marking original word
+ change user in context menu
+ division of injected CSS and iframe CSS
+ centralised configuration (e.g. of URLs)
+ slimmer message passing
+ towards resizing frame containers to their content
+ Notifier and feedback reminder back into main frame (due to problems with unresizable iframe containers)

### Version 0.3.1
+ Notifier and feedback reminder in iframes
+ Cleanup of simplify.js

### Version 0.3.0
+ Clarification of why personal data is needed in registration modal
+ Terms and conditions checked in registration modal

### Version 0.2.4
+ Provide 'other' option in educational status
+ Feedback reminder later and not closable
+ Bugfix in star ratings
+ better error handling

### Version 0.2.3
+ small bugfix in manifest.json

### Version 0.2.2
(skipped publication)

### Version 0.2.1
+ changeText() works on `choices` rather than harder-coded `original` and `simple`
+ UX improvements (feedback reminder closable), some CSS improvements

### Version 0.2
+ Include session IDs
+ Notifier closable
+ Feedback reminder instead of modal on every page leave
+ Modals in iframes, much better JS/HTML isolation (and CSS isolation from content page)
+ `selection` key in simplification objects counts all number of clicks, selects word by modulo operation

### Version 0.1.1
+ frontend version number in all requests

### Version 0.1
+ initial release

