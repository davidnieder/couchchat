var couchchat = function()  {

  /* couchchat.ui */
  var ui = (function($) {
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
      var main = {};
      var $container = $('#main-view');

      /* chat header */
      main.header = (function()  {
        var $container = $('#header');
        var $settingsLink = $('#settings-link');
        var $logoutLink = $('#logout-link');
        var $userListLink = $('#user-list-link');

        var init = function() {
          /* link click-event handlers */
          $settingsLink.click(function(event) {
            event.preventDefault();
            main.settings.toggle();
          });
          $logoutLink.click(function(event) {
            event.preventDefault();
            net.doLogout();
          });
          $userListLink.click(function(event) {
            event.preventDefault();
            main.userList.toggle();

            if (main.userList.isVisible())  {
              $userListLink.text('Hide List');
            } else {
              $userListLink.text('User List');
            }
          });

          welcomeUser();
        };

        var height = function() {
          return $container.outerHeight(true);
        };

        var welcomeUser = function() {
          user = models.userList.getPrimary();
          if (user) {
            message = 'Welcome ' + user.name + '!';
            $container.find('#welcome-message').prepend(message);
          }
        }

        return  {
          init: init,
          height: height
        };
      })();

      main.settings = (function()  {
        var $container = $('#settings');

        var init = function() {
          $('#close-settings-link').click(function(event) {
            event.preventDefault();
            toggle();
          });
        }

        var toggle = function() {
          $container.slideToggle({step:main.scale,done:main.scale});
        };

        var height = function() {
          if ($container.css('display') == 'none')
            return 0;
          return $container.outerHeight(true);
        };

        return  {
          init: init,
          toggle: toggle,
          height: height
        };
      })();

      main.userList = (function()  {
        var $container = $('#user-list');

        var toggle = function() {
          $container.toggle();
        };

        var setHeight = function(height)  {
          $container.outerHeight(height);
        };

        var isVisible = function()  {
          return $container.css('display') == 'none' ? false : true;
        };

        return  {
          toggle: toggle,
          setHeight: setHeight,
          isVisible: isVisible
        };
      })();

      /* chat messages */
      main.messageView = (function() {
        var $container = $('#message-view');

        var getHeight = function(outerHeight) {
          return $container.outerHeight(outerHeight);
        };

        var setHeight = function(height)  {
          $container.outerHeight(height);
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
          getHeight: getHeight,
          setHeight: setHeight,
          scrollToBottom: scrollToBottom,
          addMessage: addMessage,
          messageAcked: messageAcked
        };
      })();

      /* chat message input */
      main.messageInput = (function()  {
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
          messageController.newLocalMessage($messageInputField.val());
          $messageInputField.val('');
        };

        return  {
          init: init,
          height: height,
          focus: focus
        };
      })();

      main.init = function() {
        this.header.init();
        this.settings.init();
        this.messageInput.init();

        $(window).resize(this.scale);
      };

      main.show = function() {
        $container.show();
        this.scale();
        this.messageView.scrollToBottom();
        this.messageInput.focus();
      };

      main.scale = function()  {
        var space = $(window).height()
                    - main.header.height()
                    - main.settings.height()
                    - main.messageInput.height()
                    - main.messageView.getHeight(true)
                    + main.messageView.getHeight(false);
        main.messageView.setHeight(space);
        main.userList.setHeight(space);
      };

      return main;
    })();

    ui.init = function()  {
      ui.loadingView.hide();
      ui.main.init();
      ui.main.show();
    };

    return ui;
  })(jQuery);

  /* couchchat.net */
  var net = (function($) {
    var chatDb = 'couchchat_chat',
        authDb = 'couchchat_auth',
        authPath = '/' + authDb + '/_design/auth/_show/landing',
        newMessagePath = '/' + chatDb + '/_design/chat/_update/new_message';

    var init = function() {
      getSession();
    };

    var getSession = function() {
      $.couch.session({
        success: function(resp) {
          if (resp.userCtx.name)  {
            models.userList.add(resp.userCtx.name, true);
            getInitialMessages(10);

            $.couch.db(chatDb).changes(0, {'filter':'chat/messages'})
              .onChange(messageListener);
          }
          else  {
            /* user not logged-in */
            redirect(authPath);
          }
        },
        error: onNetError
      });
    };

    var doLogout = function() {
      $.couch.logout({
        success: redirect(authPath),
        error: onNetError});
    };

    var sendMessage = function(message)  {
      $.couch.db(chatDb).update('chat/new_message', message, {
          success: onSendMessageSuccess,
          error: onNetError
        });
    };

    var onSendMessageSuccess = function(resp) {
      messageController.onLocaleMessageAcked(resp.id, resp.time);
    }

    var getMessage = function(id) {
      $.couch.db(chatDb).list('chat/viewGuard', 'messages_by_id', {key:id}, {
          success: function(resp) {
            if (resp.total_rows == 1)  {
              messageController.newRemoteMessage(resp.rows[0].id,
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
          success: function(resp)  {
            if (resp.total_rows)  {
              messageController.init();
              /* messages are ordered descending. need to add them ascending */
              for (var i=resp.rows.length-1; i>=0; i--) {
                var doc = { message: resp.rows[i].value.message,
                            user: resp.rows[i].value.user,
                            time: resp.rows[i].key };
                messageController.newRemoteMessage(resp.rows[i].id, doc);
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
        messageController.onNewRemoteMessageAvailable(results[i].id);
      }
    };

    var getUUID = function()  {
      return $.couch.newUUID(10);
    };

    var redirect = function(path) {
      window.location.replace(window.location.origin + path);
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
  })(jQuery);

  /* couchchat.models */
  var models = (function()  {
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
  })();

  /* couchchat.messageController */
  var messageController = (function()  {
    var Message;
    var messageMap;
    var user;

    var init = function() {
      Message = models.Message;
      messageMap = models.messageMap;
      user = models.userList.getPrimary();

      ui.init();
    };

    var newRemoteMessage = function(id, doc) {
      var msg = new Message(id, doc.message, doc.user, doc.time);
      var primary = msg.user == user.name ? true : false;
      ui.main.messageView.addMessage(msg, primary, true);
    };

    var onNewRemoteMessageAvailable = function(id) {
      if (!(id in messageMap))  {
        net.getMessage(id);
      }
    };

    var newLocalMessage = function(input)  {
      var msg = new Message(net.getUUID(), input, user.name);
      messageMap[msg.id] = msg;
      net.sendMessage(msg);
      ui.main.messageView.addMessage(msg, true, false);
    };

    var onLocaleMessageAcked = function(id, time)  {
      messageMap[id].time = new Date(parseInt(time));
      ui.main.messageView.messageAcked(messageMap[id]);
    }

    return {
      init: init,
      newRemoteMessage: newRemoteMessage,
      onNewRemoteMessageAvailable: onNewRemoteMessageAvailable,
      newLocalMessage: newLocalMessage,
      onLocaleMessageAcked: onLocaleMessageAcked
    };
  })();

  /* net.init() -> getSession() -> getInitialMessages()
   * -> messageController.init() -> ui.init()
   */
  net.init();
};
