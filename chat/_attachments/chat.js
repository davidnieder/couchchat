var couchchat = {};

couchchat.ui =
(function($, couchchat) {
  var ui = {};

  /* loading indicator */
  ui.loadingView = (function() {
    var $container = $('#loading-view');
    var show = function() {
      $container.show();
    };
    var hide = function() {
      $container.hide();
    };

    return  {
      hide: hide
    };
  })();

  /* main (chat) view */
  ui.main = (function()  {
    var $container = $('#main-view');

    /* chat header */
    var header = (function()  {
      var $container = $('#header');
      var $settingsLink = $('#settings-link');
      var $logoutLink = $('#logout-link');
      var $userListLink = $('#user-list-link');

      var init = function() {
        $settingsLink.click(settingsLinkClicked);
        $logoutLink.click(logoutLinkClicked);
        $userListLink.click(userListLinkClicked);

        welcomeUser();
      };

      var height = function() {
        return $container.outerHeight(true);
      };

      var welcomeUser = function() {
        user = couchchat.models.userList.getPrimary();
        if (user) {
          message = 'Welcome ' + user.name + '!';
          $container.find('span :first').prepend(message);
        }
      }

      var settingsLinkClicked = function(event) {
        event.preventDefault();
        alert('not implemented');
      };
      var logoutLinkClicked = function(event) {
        event.preventDefault();
        couchchat.net.doLogout();
      };
      var userListLinkClicked = function(event) {
        event.preventDefault();
        alert('not implemented');  
      };

      return  {
        init: init,
        height: height
      };
    })();

    /* chat messages */
    var messageView = (function() {
      var $container = $('#message-view');

      var init = function() {
        $(window).resize(scale);
      };

      var scale = function()  {
        var space = $(window).height()
                    - header.height()
                    - messageInput.height()
                    - $container.outerHeight(true)
                    + $container.outerHeight();
        $container.outerHeight(space);
      };

      var scrollToBottom = function() {
        $container.animate({scrollTop: $container.prop('scrollHeight')},
            'slow');
      };

      var addMessage = function(message, primary, isAcked)  {
        var template = isAcked ? messageBubble : messageBubbleTemporary;
        var float = primary ? 'u-pull-left' : 'u-pull-right';
        var time = message.time ? formatTime(message.time) : undefined;

        template = Mustache.render(template,
            {id:message.id, float:float, name:message.user,
             time:time, message:message.message});

        $container.append(template);
        scrollToBottom();
      };

      var messageAcked = function(message) {
        var template = Mustache.render(messageBubble,
              {id:message.id, float:'u-float-right', name:message.user,
               time:formatTime(message.time), message:message.message});
        $('#'+message.id).replaceWith(template);
      };

      var formatTime = function(time) {
        /* returns 'HH:MM' */
        time = time.toLocaleTimeString();
        return time.substr(0, time.lastIndexOf(':'));
      }

      var showError = function(error) {
      };

      return  {
        init: init,
        scale: scale,
        scrollToBottom: scrollToBottom,
        addMessage: addMessage,
        messageAcked: messageAcked
      };
    })();

    /* chat message input */
    var messageInput = (function()  {
      var $container = $('#footer');
      var $messageInputField = $('#message-input');
      var $messageSendButton = $('#message-send');

      var init = function() {
        $messageSendButton.click(newMessage);
      };

      var height = function() {
        return $container.outerHeight(true);
      };

      var focus = function()  {
        $messageInputField.focus();
      };

      var newMessage = function(event) {
        event.preventDefault();
        if (!$messageInputField.val()) {
          return;
        }
        couchchat.messageController.newLocalMessage($messageInputField.val());
        $messageInputField.val('');
      };

      return  {
        init: init,
        height: height,
        focus: focus
      };
    })();

    var init = function() {
      header.init();
      messageView.init();
      messageInput.init();
    };

    var show = function() {
      $container.show();
      messageView.scale();
      messageView.scrollToBottom();
      messageInput.focus();
    };

    return  {
      header: header,
      messageView: messageView,
      messageInput: messageInput,
      init: init,
      show: show
    };
  })();

  return ui;
})(jQuery, couchchat);

couchchat.net =
(function($, couchchat) {
  var chatDb = 'couchchat_chat',
      authDb = 'couchchat_auth',
      authURL = '/' + authDb + '/_design/auth/_show/landing',
      newMessageURL = '/' + chatDb + '/_design/chat/_update/new_message';

  var init = function() {
    getSession();
    $.couch.db(chatDb).changes(0, {'filter':'chat/messages'})
      .onChange(messageListener);
  };

  var getSession = function() {
    $.couch.session({async: false,
      success: function(resp) {
        if (resp.userCtx.name)  {
          couchchat.models.userList.add(resp.userCtx.name, true);
        }
        else  {
          /* user not logged-in */
          redirect(authURL);
        }
      },
      error: onNetError
    });
  };

  var doLogout = function() {
    $.couch.logout({async: false,
      success: redirect(authURL),
      error: onNetError});
  };

  var sendMessage = function(message)  {
    // TODO integrate in $.couch.costum.js
    $.ajax({
      url: newMessageURL,
      type: 'POST',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(message),
      success: onSendMessageSuccess,
      error: onNetError
    });
  };

  var onSendMessageSuccess = function(resp) {
    couchchat.messageController.onLocaleMessageAcked(resp.id, resp.time);
  }

  var getMessage = function(id) {
    $.couch.db(chatDb).list('chat/viewGuard', 'messages_by_id', {key:id}, {
        success: function(resp) {
          if (resp.total_rows == 1)  {
            couchchat.messageController.newRemoteMessage(resp.rows[0].id,
                resp.rows[0].value);
          } else {
            console.log('net.getMessage'+(id)+': total_rows='+resp.total_rows);
          }
        },
        error: onNetError});
  };

  var getInitialMessages = function(count) {
    $.couch.db(chatDb).list('chat/viewGuard', 'messages_by_time',
        {descending: true, limit: count}, {
        async: false,
        success: function(resp)  {
          if (resp.total_rows)  {
            /* messages are ordered descending. need to add them ascending */
            for (var i=resp.rows.length-1; i>=0; i--) {
              var doc = { message: resp.rows[i].value.message,
                          user: resp.rows[i].value.user,
                          time: resp.rows[i].key };
              couchchat.messageController.newRemoteMessage(resp.rows[i].id, doc);
            }
          } else {
            /* show 'no messages found' or sth */
          }
        },
        error: onNetError});
  };

  var messageListener = function(changes) {
    var results = changes.results
    for (var i in results)  {
      couchchat.messageController.onNewRemoteMessageAvailable(results[i].id);
    }
  };

  var getUUID = function()  {
    return $.couch.newUUID(10);
  };

  var redirect = function(page) {
    window.location.href = page;
  };

  var onNetError = function() {
  };

  return  {
    init: init,
    doLogout: doLogout,
    sendMessage: sendMessage,
    getMessage: getMessage,
    getInitialMessages: getInitialMessages,
    getUUID: getUUID
  };
})(jQuery, couchchat);

couchchat.models =
(function(couchchat)  {
  var User = function(name, primary)  {
    primary = primary === true || false;
    this.name = name;
    this.primary = primary;
  };

  var userList = (function()  {
    var userList = new Array();

    var add = function(name, primary)  {
      if (primary)  {
        for (var i in userList)
          if (userList[i].primary)
            return false;
      }
      var user = new User(name, primary);
      userList.push(user);
      return user;
    };

    var getPrimary = function()  {
      for (var i in userList)
        if (userList[i].primary)
          return userList[i];
    };

    return {
      add: add,
      getPrimary: getPrimary,
    };
  })();

  var Message = function(id, message, user, time) {
    this.id = id;
    this.message = message;
    this.user = user;
    this.time = time ? new Date(parseInt(time)) : time;
  };

  var messageMap = {};

  return  {
    userList: userList,
    Message: Message,
    messageMap: messageMap
  };
})(couchchat);

couchchat.messageController =
(function(couchchat)  {
  var Message;
  var messageMap;
  var user;

  var init = function() {
    Message = couchchat.models.Message;
    messageMap = couchchat.models.messageMap;
    user = couchchat.models.userList.getPrimary();
    couchchat.net.getInitialMessages(10);
  };

  var newRemoteMessage = function(id, doc) {
    var msg = new Message(id, doc.message, doc.user, doc.time);
    var primary = msg.user == user.name ? true : false;
    couchchat.ui.main.messageView.addMessage(msg, primary, true);
  };

  var onNewRemoteMessageAvailable = function(id) {
    if (!(id in messageMap))  {
      couchchat.net.getMessage(id);
    }
  };

  var newLocalMessage = function(input)  {
    var msg = new Message(couchchat.net.getUUID(), input, user.name);
    messageMap[msg.id] = msg;
    couchchat.net.sendMessage(msg);
    couchchat.ui.main.messageView.addMessage(msg, true, false);
  };

  var onLocaleMessageAcked = function(id, time)  {
    messageMap[id].time = new Date(parseInt(time));
    couchchat.ui.main.messageView.messageAcked(messageMap[id]);
  }

  return {
    init: init,
    newRemoteMessage: newRemoteMessage,
    onNewRemoteMessageAvailable: onNewRemoteMessageAvailable,
    newLocalMessage: newLocalMessage,
    onLocaleMessageAcked: onLocaleMessageAcked
  };
})(couchchat);

couchchat.init = function() {
  couchchat.net.init();
  couchchat.messageController.init();

  couchchat.ui.loadingView.hide();
  couchchat.ui.main.init();
  couchchat.ui.main.show();
};
