var templates = {
  welcomeString: ''
    + '<span id="welcome-message">Welcome {{user}}!</span>',
  
  colorField: ''
    + '<div id="{{id}}" class="color-field" style="background-color:{{color}};">'
    + '</div>',
  
  layoutOption: ''
    + '<option>{{layout}}</option>',
  
  dateLine: ''
    + '<span class="date-line u-cf"><hr>{{date}}<hr></span>',
  
  messageBubble: ''
    + '<div id="{{id}}" class="message-bubble u-cf {{float}}" '
    +   'style=background-color:{{color}} data-couchchat-user="{{name}}">'
    +   '<div class="message-bubble-head">{{name}} ({{time}}):</div>'
    +   '<div class="message-bubble-body">{{message}}</div>'
    + '</div>',
  
  messageBubbleTemporary: ''
    + '<div id="{{id}}" class="message-bubble message-not-acked u-cf u-float-right">'
    +   '<div class="message-bubble-head">{{name}}:</div>'
    +   '<div class="message-bubble-body">{{message}}</div>'
    + '</div>',
  
  userListEntry: ''
    + '<div id="user-{{name}}">'
    +   '<span style="color:{{color}}">{{name}}</span> '
    +   '<span class="{{statusClass}}">{{status}}</span>'
    + '</div>',
  
  sessionError: ''
    + '<div id="session-error-msg" class="u-cf error-message">'
    +   'Your session timed out. '
    +   '<a href="{{ url }}">Log back in.</a>'
    + '</div>',
  
  genericError: ''
    + '<div class="u-cf error-message">'
    +   'A network error occurred. '
    +   '<a href="">Try reloading this page.</a>'
    + '</div>',
};
