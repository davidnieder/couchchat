var welcomeString = ''
+ '<span id="welcome-message">Welcome {{user}}!</span>';

var colorField = ''
+ '<div id="{{id}}" class="color-field" style="background-color:{{color}};">'
+ '</div>';

var layoutOption = ''
+ '<option>{{layout}}</option>';

var dateLine = ''
+ '<span class="date-line u-cf"><hr>{{date}}<hr></span>';

var messageBubble = ''
+ '<div id="{{id}}" class="message-bubble u-cf {{float}}" '
+   'style=background-color:{{color}} data-couchchat-user="{{name}}">'
+   '<div class="message-bubble-head">{{name}} ({{time}}):</div>'
+   '<div class="message-bubble-body">{{message}}</div>'
+ '</div>';

var messageBubbleTemporary = ''
+ '<div id="{{id}}" class="message-bubble message-not-acked u-cf u-float-right">'
+   '<div class="message-bubble-head">{{name}}:</div>'
+   '<div class="message-bubble-body">{{message}}</div>'
+ '</div>';

var userListEntry = ''
+ '<div id="user-{{name}}">'
+   '<span style="color:{{color}}">{{name}}</span> '
+   '<span class="{{statusClass}}">{{status}}</span>'
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

