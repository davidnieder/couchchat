var welcomeString = ''
+ '<span id="welcome-message">Welcome {{user}}!</span>';

var dateLine = ''
+ '<span class="date-line u-cf"><hr>{{date}}<hr></span>';

var messageBubble = ''
+ '<div id="{{id}}" class="message-bubble u-cf {{float}}">'
+   '<div class="message-bubble-head">{{name}} ({{time}}):</div>'
+   '<div class="message-bubble-body">{{message}}</div>'
+ '</div>';

var messageBubbleTemporary = ''
+ '<div id="{{id}}" class="message-bubble message-not-acked u-cf u-float-right">'
+   '<div class="message-bubble-head">{{name}}:</div>'
+   '<div class="message-bubble-body">{{message}}</div>'
+ '</div>';

var sessionError = ''
+ '<div class="u-cf error-message">'
+   'Your session timed out. '
+   '<a href="">Log back in.</a>'
+ '</div>';

var genericError = ''
+ '<div class="u-cf error-message">'
+   'A network error occurred. '
+   '<a href="">Try reloading this page.</a>'
+ '</div>';

