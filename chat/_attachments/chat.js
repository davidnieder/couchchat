var couchchat = function()  {

  /* couchchat.ui {{{ */
  var ui = (function($) {
    var ui = {};

    /* loading indicator {{{ */
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
    })(); /* }}} */

    /* ui.errorView {{{ */
    ui.errorView = (function()  {
      var $container = $('#error-view');
      var show = function() {
        ui.loadingView.hide();
        $container.show();
      };

      return {
        show: show
      };
    })(); /* }}} */

    /* ui.main {{{ */
    ui.main = (function()  {
      var main = {};
      var $container = $('#main-view');

      /* ui.main.header {{{ */
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
          $container.prepend(Mustache.render(welcomeString, {user:user.name}));
        }

        return  {
          init: init,
          height: height
        };
      })(); /* }}} */

      /* ui.main.settings {{{ */
      main.settings = (function()  {
        var $container = $('#settings');
        var $colorPicker = $('#settings-color-picker');
        var $pickedColor;
        var $layoutSelect = $('#settings-layout-select');

        var init = function() {
          $('#settings-close-link').click(function(event) {
            event.preventDefault();
            toggle();
          });
          $('#settings-save-button').click(function(event)  {
            event.preventDefault();
            update();
          });

          var settings = models.userList.getPrimary().settings;

          /* add pre-defined colors to settings */
          for (var i in config.colors)  {
            var field = Mustache.render(colorField, {
              id:config.colors[i].replace('#',''), color:config.colors[i]});
            $colorPicker.append(field);
          }

          $pickedColor = $('#'+settings.color.replace('#', ''));
          $pickedColor.addClass('active-color-field');
          $('.color-field').click(onColorPick);

          /* add available layouts to select element */
          for (var i in config.layouts) {
            var option = Mustache.render(layoutOption,
                {layout:config.layouts[i]});
            $layoutSelect.append(option);
          }

          $layoutSelect.val(settings.layout);
        };

        var update = function() {
          var color = '#' + $pickedColor.prop('id');
          var layout = $layoutSelect.val();

          models.userList.updateSettings(color, layout);
          main.messageView.onColorChanged(models.userList.getPrimary().name,
              '#'+$pickedColor.prop('id'));
          net.sendUserDoc();
        };

        var onColorPick = function(event) {
          var $target = $(event.target);

          $pickedColor.removeClass('active-color-field');
          $target.addClass('active-color-field');

          $pickedColor = $target;

          /* show results immediately */
          models.userList.updateSettings('#'+$pickedColor.prop('id'));
          main.messageView.onColorChanged(models.userList.getPrimary().name,
              '#'+$pickedColor.prop('id'));
        };

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
      })(); /* }}} */

      /* ui.main.userList {{{ */
      main.userList = (function()  {
        var $container = $('#user-list');

        var init = function() {
          update();
          setInterval(update, 5000);
        };

        /* populates/updates the user-list div */
        var update = function() {
          var lastSeenList = models.userList.getLastSeenList();
          for (var i in lastSeenList) {
            var status = 'offline';
            var statusClass = 'user-offline';
            if (lastSeenList[i].lastSeen > (Date.now()-60000))  {
              status = 'online';
              statusClass = 'user-online';
            }

            var template = Mustache.render(userListEntry, {name:lastSeenList[i].name,
              color:lastSeenList[i].color, statusClass:statusClass, status:status });

            if ($container.find('#user-'+lastSeenList[i].name).length)
              $container.find('#user-'+lastSeenList[i].name).html(template);
            else
              $container.append(template);
          }
        };

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
          init: init,
          toggle: toggle,
          setHeight: setHeight,
          isVisible: isVisible
        };
      })(); /* }}} */

      /* ui.main.messageView  {{{ */
      main.messageView = (function() {
        var $container = $('#message-view');
        var $loadMore = $('#load-earlier-messages');

        var init = function() {
          $loadMore.find('a').first().click(onLoadMoreClicked);
        };

        var getHeight = function(outerHeight) {
          return $container.outerHeight(outerHeight);
        };

        var setHeight = function(height)  {
          $container.outerHeight(height);
        };

        var scrollToBottom = function() {
          $container.clearQueue();
          $container.animate({scrollTop: $container.prop('scrollHeight')},
                      'slow');
        };

        var addMessage = function(message, isPrimary, isAcked, isOld) {
          var template = isAcked ? messageBubble : messageBubbleTemporary;
          var float = isPrimary ? 'u-pull-left' : 'u-pull-right';
          var time = message.time ? formatTime(message.time) : undefined;
          var color = models.userList.getUserColor(message.user);

          template = Mustache.render(template,
              {id:message.id, float:float, color:color, name:message.user,
               time:time, message:message.message});

          if (isOld)  {
            /* add message as first message */
            $loadMore.after(template);
            $loadMore.find('img').first().hide();
            $loadMore.find('a').first().show();

            if (dayTransition(message.time, models.oldestMessageTime))  {
              /* add new-calendar-date indicator after the message */
              $('#'+message.id).after(Mustache.render(dateLine, {
                date: formatDate(models.oldestMessageTime)}));
            }
          } else {
            /* add message as last message */
            if (dayTransition(models.newestMessageTime, message.time))  {
              /* add new-calendar-date indicator above the message */
              $container.append(Mustache.render(dateLine, {
                date: formatDate(message.time)}));
            }

            $container.append(template);
            scrollToBottom();
          }
        };

        var messageAcked = function(message) {
          if (dayTransition(models.newestMessageTime, message.time))  {
            /* add new-calendar-date indicator above the message */
            $('#'+message.id).before(Mustache.render(dateLine,  {
              date: formatDate(message.time)}));
          }
          var template = Mustache.render(messageBubble,
                {id:message.id, float:'u-float-right', name:message.user,
                 color:models.userList.getPrimary().settings.color,
                 time:formatTime(message.time), message:message.message});
          $('#'+message.id).replaceWith(template);
        };

        /* returns 'HH:MM' locale time */
        var formatTime = function(date) {
          var time = date.toLocaleTimeString();
          return time.substr(0, time.lastIndexOf(':'));
        };

        var formatDate = function(date) {
          return date.toLocaleDateString();
        };

        /* checks if B has a greater date than A */
        var dayTransition = function(dateA, dateB)  {
          if (!(dateA && dateB)) return false;

          var nextDay = new Date(dateA.getFullYear(), dateA.getMonth(),
                                 dateA.getDate()+1);
          return nextDay<dateB ? true : false;

          /* better?
           * if (dateA<dateB && dateA.getDate()<dateB.getDate())
           */
        };

        var onLoadMoreClicked = function(event)  {
          event.preventDefault();
          net.getOlderMessages(10);
          $loadMore.find('a').first().hide();
          $loadMore.find('img').first().show();
        };

        var noMoreOldMessages = function()  {
          $loadMore.find('a').first().hide();
          $loadMore.find('img').first().hide();
          $loadMore.text('No more messages found.');
        };

        var onColorChanged = function(user, color)  {
          /* select all messages from 'user' and set new color */
          var $divs = $container.children('div [data-couchchat-user='+user+']');
          $divs.css('background-color', color);
        };

        var showError = function(error) {
          if (error == 'sessionError')  {
            $container.append(sessionError);
            main.messageInput.disable();
          } else {
            $container.append(genericError);
          }
          scrollToBottom();
        };

        return  {
          init: init,
          getHeight: getHeight,
          setHeight: setHeight,
          scrollToBottom: scrollToBottom,
          addMessage: addMessage,
          messageAcked: messageAcked,
          noMoreOldMessages: noMoreOldMessages,
          onColorChanged: onColorChanged,
          showError: showError
        };
      })(); /* }}} */

      /* ui.main.messageInput {{{ */
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

        var disable = function()  {
          $messageInputField.prop('disabled', true);
          $messageSendButton.prop('disabled', true);
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
          focus: focus,
          disable: disable
        };
      })(); /* }}} */

      main.init = function() {
        this.header.init();
        this.userList.init();
        this.messageView.init();
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
    })(); /* }}} */

    ui.init = function()  {
      ui.loadingView.hide();
      ui.main.init();
      ui.main.show();
    };

    return ui;
  })(jQuery); /* }}} */

  /* couchchat.net {{{ */
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
            getUserList();

            /* register database change listener */
            $.couch.db(chatDb).changes(0, {'filter':'chat/messages_userdocs'})
              .onChange(changeListener);
          } else  {
            /* user not logged-in */
            redirect(authPath);
          }
        },
        error: onEarlyNetError
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
              /* don't know when this would happen */
              console.log('net.getMessage'+(id)+': total_rows='+resp.total_rows);
            }
          },
          error: onNetError});
    };

    var getInitialMessages = function(count) {
      $.couch.db(chatDb).list('chat/viewGuard', 'messages_by_time', {
          descending: true, limit: count}, {
          success: function(resp)  {
            messageController.init();
            if (resp.total_rows > 0)  {
              /* messages are ordered descending. need to add them ascending */
              for (var i=resp.rows.length-1; i>=0; i--) {
                var doc = { message: resp.rows[i].value.message,
                            user: resp.rows[i].value.user,
                            time: resp.rows[i].key };
                messageController.newRemoteMessage(resp.rows[i].id, doc);
              }
            }
            if (resp.total_rows < count) {
              ui.main.messageView.noMoreOldMessages();
            }
          },
          error: onEarlyNetError }
      );
    };

    var getOlderMessages = function(count)  {
      $.couch.db(chatDb).list('chat/viewGuard', 'messages_by_time', {
        descending: true, startkey: models.oldestMessageTime.getTime(), skip: 1,
        limit: count}, {
        success: function(resp) {
          for (var i in resp.rows) {
            var doc = { message: resp.rows[i].value.message,
                        user: resp.rows[i].value.user,
                        time: resp.rows[i].key };
            messageController.newRemoteMessage(resp.rows[i].id, doc);
          }
          if (resp.total_rows < 10) {
            ui.main.messageView.noMoreOldMessages();
          }
        },
        error: onNetError});
    };

    var getUserList = function()  {
      $.couch.db(chatDb).list('chat/viewGuard', 'user_docs', {}, {
        success: function(resp) {
          for (var i in resp.rows)  {
            models.userList.update(resp.rows[i].key,
                                   resp.rows[i].value.settings,
                                   resp.rows[i].value.lastSeen);
          }

          if (!models.userList.getPrimary().settings)  {
            /* user has no doc on server, create one and fetch the list again
             * should only happen on very first request */
            var user = models.userList.getPrimary()
            $.couch.db(chatDb).update('chat/edit_settings/' + user.name, {}, {
              success: getUserList,
              error: onEarlyNetError
            });
            return;
          } else {
            /* ping the server regularly, updates the lastVisit field
             * and keeps the sesson alive */
            heartBeat();
            setInterval(heartBeat, 30000);

            getInitialMessages(10);
          }
        },
        error: onEarlyNetError});
    };

    var sendUserDoc = function() {
      var user = models.userList.getPrimary().name;
      $.couch.db(chatDb).update('chat/edit_settings/' + user, {
        settings: models.userList.getPrimary().settings}, {
        error: onNetError }
      );
    };

    var getUserDoc = function(id) {
      $.couch.db(chatDb).list('chat/viewGuard', 'user_docs', {
        key: id}, {
        success: function(resp) {
          if (resp.total_rows == 1) {
            models.userList.update(resp.rows[0].key,
                                   resp.rows[0].value.settings,
                                   resp.rows[0].value.lastSeen);
          } else {
            /* don't know when this would happen */
            console.log('getUserDoc('+id+'): total_rows='+resp.total_rows);
          }
        },
        error: onNetError }
      );
    };

    var changeListener = function(changes) {
      var results = changes.results;
      for (var i in results)  {
        if (models.userList.hasUser(results[i].id))  {
          /* userdoc change */
          getUserDoc(results[i].id);
        } else {
          /* message change */
          messageController.onNewRemoteMessageAvailable(results[i].id);
        }
      }
    };

    var heartBeat = function()  {
      var user = models.userList.getPrimary()
      $.couch.db(chatDb).update('chat/edit_settings/' + user.name, {});
    };

    var getUUID = function()  {
      return $.couch.newUUID(10);
    };

    var redirect = function(path) {
      window.location.replace(window.location.origin + path);
    };

    var onNetError = function(status, error, reason) {
      if (status == 403)  {
        /* forbidden */
        ui.main.messageView.showError('sessionError');
      }
      // TODO handle more errors specifically
      else {
        ui.main.messageView.showError('unkownError');
      }
    };

    var onEarlyNetError = function()  {
      ui.errorView.show();
    };

    return  {
      init: init,
      doLogout: doLogout,
      sendMessage: sendMessage,
      getMessage: getMessage,
      getInitialMessages: getInitialMessages,
      getOlderMessages: getOlderMessages,
      sendUserDoc: sendUserDoc,
      getUUID: getUUID
    };
  })(jQuery); /* }}} */

  /* couchchat.models {{{ */
  var models = (function()  {
    var User = function(name, primary, settings, lastSeen)  {
      primary = primary === true || false;
      this.name = name;
      this.primary = primary;
      this.settings = settings;
      this.lastSeen = new Date(lastSeen);
    };

    var userList = (function()  {
      var userList = new Array();

      var add = function(name, primary, settings, lastSeen) {
        for (var i in userList) {
          if (userList[i].name == name) {
            userList[i].settings = settings;
            userList[i].lastSeen = new Date(lastSeen);
            return;
          }
        }

        var user = new User(name, primary, settings, lastSeen);
        userList.push(user);
        return user;
      };

      var update = function(name, settings, lastSeen) {
        for (var i in userList) {
          if (userList[i].name == name) {
            if (userList[i].settings &&
                userList[i].settings.color != settings.color) {
              console.log('color changed');
              ui.main.messageView.onColorChanged(name, settings.color);
            }
            userList[i].settings = settings;
            userList[i].lastSeen = new Date(lastSeen);
            return;
          }
        }
        var user = new User(name, false, settings, lastSeen);
        userList.push(user);
      };

      /* returns the user this session belongs to */
      var getPrimary = function()  {
        for (var i in userList)
          if (userList[i].primary)
            return userList[i];
      };

      /* checks if there is a user with 'name' in the list */
      var hasUser = function(name)  {
        for (var i in userList) {
          if (userList[i].name == name) {
            return true;
          }
        }
        return false;
      };

      /* returns an array with {name, lastSeen, color} maps */
      var getLastSeenList = function()  {
        var list = new Array();
        for (var i in userList) {
          list.push({name:userList[i].name, lastSeen:userList[i].lastSeen,
                     color:userList[i].settings.color});
          if (userList[i].primary)  {
            /* pretty sure the 'primary' user is online right now */
            list[i].lastSeen = new Date();
          }
        }
        return list;
      };

      var getUserColor = function(name) {
        for (var i in userList) {
          if (userList[i].name == name)  {
            return userList[i].settings.color;
          }
        }
      };

      /* set settings of the primary user */
      var updateSettings = function(color, layout)  {
        var settings = getPrimary().settings;
        settings.color = color || settings.color;
        settings.layout = layout  || settings.layout;
      };

      return {
        add: add,
        update: update,
        getPrimary: getPrimary,
        hasUser: hasUser,
        getLastSeenList: getLastSeenList,
        getUserColor: getUserColor,
        updateSettings: updateSettings
      };
    })();

    var Message = function(id, message, user, time) {
      this.id = id;
      this.message = message;
      this.user = user;
      this.time = time ? new Date(parseInt(time)) : time;
    };

    var messageMap = {};
    var oldestMessageTime = null;
    var newestMessageTime = null;

    return  {
      userList: userList,
      Message: Message,
      messageMap: messageMap,
      oldestMessageTime: oldestMessageTime,
      newestMessageTime: newestMessageTime
    };
  })(); /* }}} */

  /* couchchat.messageController {{{ */
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
      var isPrimary = msg.user == user.name ? true : false;

      if (!models.oldestMessageTime)
        models.oldestMessageTime = msg.time;

      if (msg.time < models.oldestMessageTime)  {
        ui.main.messageView.addMessage(msg, isPrimary, true, true);
        models.oldestMessageTime = msg.time;
      } else {
        ui.main.messageView.addMessage(msg, isPrimary, true);
        if (msg.time > models.newestMessageTime)  {
          models.newestMessageTime = msg.time;
        }
      }
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
      if (messageMap[id].time > models.newestMessageTime)  {
        models.newestMessageTime = messageMap[id].time;
      }
    }

    return {
      init: init,
      newRemoteMessage: newRemoteMessage,
      onNewRemoteMessageAvailable: onNewRemoteMessageAvailable,
      newLocalMessage: newLocalMessage,
      onLocaleMessageAcked: onLocaleMessageAcked
    };
  })(); /* }}} */

  /*
   * initial control flow:
   * net.init() -> getSession() -> getUserList -> getInitialMessages() ->
   * messageController.init() -> ui.init()
   */
  net.init();
};
