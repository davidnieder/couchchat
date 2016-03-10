/* vim: set foldmethod=marker foldmarker={{{,}}} : */
var couchchat = function()  {

  /* couchchat.events {{{ */
  /* very simple pub/sub system */
  var events = (function() {
    var eventMap = {};

    this.on = function(event, callback)  {
      if (!eventMap[event])  {
        eventMap[event] = new Array();
      }
      eventMap[event].push(callback);
    };

    this.trigger = function(event) {
      var args = Array.prototype.slice.call(arguments, 1, arguments.length);
      if (eventMap[event]) {
        eventMap[event].forEach(function(callback)  {
          callback.apply(callback, args);
        });
      } else {
        /* debug */
        console.log('debug: nobody cares about "' + event + '"');
      }
    };

    return this;
  }).call(new Object()); /* }}} */

  /* couchchat.ui {{{ */
  var ui = (function($) {

    /* ui.loadingView {{{ */
    var loadingView = (function() {
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
    var errorView = (function()  {
      var $container = $('#error-view');

      var init = function() {
        events.on('net:early-error', show);
      };

      var show = function() {
        loadingView.hide();
        $container.show();
      };

      return {
        init: init,
        show: show
      };
    })(); /* }}} */

    /* ui.notifications {{{ */
    var notifications = (function()  {
      var isVisible = true;
      var windowTitle;
      var newMessageSound = new Audio(config.sounds.newMessage);
      var messageCounter = 0;

      var init = function() {
        windowTitle = document.title;

        events.on('new-message', onNewMessage);
        $(window).focus(onFocus);
        $(window).focus(function() { isVisible = true; });
        $(window).blur(function() { isVisible = false; });
      };

      var onNewMessage = function() {
        if (!isVisible) {
          messageCounter++;
          document.title = '(' + messageCounter + ') ' + windowTitle;

          newMessageSound.play();
        }
      };

      var onFocus = function()  {
        messageCounter = 0;
        document.title = windowTitle;
      };

      return {
        init: init,
      };
    })(); /* }}} */

    /* ui.main {{{ */
    var main = (function()  {
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
            events.trigger('ui:logout-requested');
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

          events.on('net:session-fetched', welcomeUser);
        };

        var height = function() {
          return $container.outerHeight(true);
        };

        var welcomeUser = function(username) {
          $container.prepend(Mustache.render(templates.welcomeString,
                {user:username}));
        }

        return  {
          init: init,
          height: height
        };
      })(); /* }}} */

      /* ui.main.settings {{{ */
      main.settings = (function()  {
        var $container = $('#settings');
        var $layoutSelect = $('#settings-layout-select');
        var $colorPicker = $('#settings-color-picker');
        var $pickedColor;

        var init = function() {
          $('#settings-close-link').click(function(event) {
            event.preventDefault();
            toggle();
          });
          $('#settings-save-button').click(function(event)  {
            event.preventDefault();
            onSave();
          });

          /* add pre-defined colors to settings */
          for (var i in config.colors)  {
            var field = Mustache.render(templates.colorField, {
              id:config.colors[i].replace('#',''), color:config.colors[i]});
            $colorPicker.append(field);
          }
          $('.color-field').click(onColorPick);

          /* add available layouts to select element */
          for (var i in config.layouts) {
            var option = Mustache.render(templates.layoutOption,
                {layout:config.layouts[i]});
            $layoutSelect.append(option);
          }

          events.on('primary-settings-changed', onUserLoaded);
        };

        var onSave = function() {
          events.trigger('ui:settings-saved', {
            color: '#' + $pickedColor.prop('id'),
            layout: $layoutSelect.val()
          });
        };

        var onColorPick = function(event) {
          var $target = $(event.target);

          $pickedColor.removeClass('active-color-field');
          $pickedColor = $target;
          $pickedColor.addClass('active-color-field');

          /* show results immediately */
          main.messageView.onColorChanged(models.userList.getPrimary().name,
              '#'+$pickedColor.prop('id'));
        };

        var onUserLoaded = function(username, settings) {
          $pickedColor = $(settings.color);
          $pickedColor.addClass('active-color-field');
          $layoutSelect.val(settings.layout);
        };

        var toggle = function() {
          $container.slideToggle({step:main.scale, done:main.scale});
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
          events.on('user-status-changed', update);
          events.on('net:session-fetched', function(name) {
            update(name, 'online');
          });
        };

        /* populates/updates the user-list div */
        var update = function(name, status) {
          var statusClass = status=='online' ? 'user-online' : 'user-offline';
          var template = Mustache.render(templates.userListEntry,
              {name:name, statusClass:statusClass,
               status:status});

          if ($container.find('#user-'+name).length)  {
            $container.find('#user-'+name).replaceWith(template);
          } else {
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

          events.on('net:error', showError);
          events.on('net:no-more-old-messages', noMoreOldMessages);
          events.on('user-settings-changed', function(name, settings) {
            onColorChanged(name, settings.color);
          });
        };

        var addMessage = function(message, isPrimary, isAcked, isOld) {
          var template = isAcked ? templates.messageBubble
                                 : templates.messageBubbleTemporary;
          var float = isPrimary ? 'u-pull-left' : 'u-pull-right';
          var time = message.time ? formatTime(message.time) : undefined;
          var color = models.userList.getUserColor(message.user);

          template = Mustache.render(template,
              {id:message.id, float:float, color:color, name:message.user,
               time:time, message:message.message});

          if (isAcked)  {
            template = autoEmbed(template);
          }

          if (isOld)  {
            /* add message as first message (top of div) */
            $loadMore.after(template);
            $loadMore.find('img').first().hide();
            $loadMore.find('a').first().show();

            if (message.newDate)  {
              $('#'+message.id).after(Mustache.render(templates.dateLine, {
                date: formatDate(message.time)}));
            }
          } else {
            /* add message as last message (bottom of div) */
            if (message.newDate)  {
              $container.append(Mustache.render(templates.dateLine, {
                date: formatDate(message.time)}));
            }

            $container.append(template);
            scrollToBottom();
          }

          if (template.indexOf('</iframe>') != -1) {
            $(window).resize();
          }
        };

        var messageAcked = function(message) {
          if (message.newDate)  {
            $container.append(Mustache.render(templates.dateLine, {
              date: formatDate(message.time)}));
          }

          var template = Mustache.render(templates.messageBubble,
                {id:message.id, float:'u-float-right', name:message.user,
                 color:models.userList.getPrimary().settings.color,
                 time:formatTime(message.time), message:message.message});
          template = autoEmbed(template);
          $('#'+message.id).replaceWith(template);

          if (template.indexOf('</iframe>') != -1) {
            $(window).resize();
          }
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

          /* loading of embeded content can disrupt above animation
           * set scroll position a second time after timeout */
          setTimeout(function() {
            $container.scrollTop($container.prop('scrollHeight'));
          }, 3000);
        };

        var noMoreOldMessages = function()  {
          $loadMore.find('a').first().hide();
          $loadMore.find('img').first().hide();
          $loadMore.text('No more messages found.');
        };

        /* returns 'HH:MM' locale time */
        var formatTime = function(date) {
          var time = date.toLocaleTimeString();
          return time.substr(0, time.lastIndexOf(':'));
        };

        var formatDate = function(date) {
          return date.toLocaleDateString();
        };

        var onLoadMoreClicked = function(event)  {
          event.preventDefault();
          events.trigger('ui:older-messages-requested');
          $loadMore.find('a').first().hide();
          $loadMore.find('img').first().show();
        };

        var onColorChanged = function(user, color)  {
          /* select all messages from 'user' and set new color */
          var $divs = $container.children('div [data-couchchat-user='+user+']');
          $divs.css('background-color', color);
        };

        var showError = function(error) {
          if (error == 'sessionError')  {
            if ($('#session-error-msg').length > 0) return;
            $container.append(Mustache.render(templates.sessionError,
                  {url:config.authPath}));
            main.messageInput.disable();
          } else {
            $container.append(templates.genericError);
          }
          scrollToBottom();
        };

        return  {
          init: init,
          addMessage: addMessage,
          messageAcked: messageAcked,
          getHeight: getHeight,
          setHeight: setHeight,
          scrollToBottom: scrollToBottom,
          onColorChanged: onColorChanged
        };
      })(); /* }}} */

      /* ui.main.messageInput {{{ */
      main.messageInput = (function()  {
        var $container = $('#footer');
        var $messageInputField = $('#message-input');
        var $messageSendButton = $('#message-send');

        var init = function() {
          $messageSendButton.click(newMessage);
          $(window).on('focus', focus);
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
          events.trigger('ui:new-message', $messageInputField.val());
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

    var init = function()  {
      errorView.init();
      notifications.init();
      main.init();

      events.on('net:initialized', show);
    };

    var show = function()  {
      loadingView.hide();
      main.show();
    };

    return {
      init: init,
      main: main
    };
  })(jQuery); /* }}} */

  /* couchchat.net {{{ */
  var net = (function($) {
    this.init = function() {
      getSession();

      events.on('ui:logout-requested', doLogout);
      events.on('ui:older-messages-requested', getOlderMessages);
      events.on('upload-user-settings', sendUserDoc);
    };

    this.sendMessage = function(message)  {
      $.couch.db(config.chatDb).update('chat/new_message', message, {
          success: function(response) {
            events.trigger('net:sent-message-acked', response.id, response.time);
          },
          error: onNetError
        });
    };

    this.getMessage = function(id) {
      $.couch.db(config.chatDb).list('chat/viewGuard', 'messages_by_id',
          {key:id}, {
          success: function(resp) {
            if (resp.total_rows == 1)  {
              events.trigger('net:fetched-new-message', resp.rows[0].id,
                                                        resp.rows[0].value);
            } else {
              /* don't know when this would happen */
              console.log('net:getMessage('+id+'): total_rows='+resp.total_rows);
            }
          },
          error: onNetError});
    };

    this.getUUID = function()  {
      return $.couch.newUUID(config.uuidCacheSize);
    };

    var getUserList = function()  {
      $.couch.db(config.chatDb).list('chat/viewGuard', 'user_docs', {}, {
        success: function(resp) {
          for (var i in resp.rows)  {
            events.trigger('net:fetched-user-document', resp.rows[i].value.name,
                resp.rows[i].value.settings, resp.rows[i].value.lastSeen);
          }

          if (!models.userList.getPrimary().settings)  {
            /* user has no doc on server, create one and fetch the list again
             * should only happen on very first request */
            var name = models.userList.getPrimary().name;
            var endpoint = 'chat/edit_settings/' + config.userDocPrefix + name;
            $.couch.db(config.chatDb).update(endpoint, {}, {
              success: getUserList,
              error: onEarlyNetError
            });
            return;
          } else {
            /* ping the server regularly, updates the lastVisit field
             * and keeps the sesson alive */
            heartbeat();
            setInterval(heartbeat, config.heartbeatFrequency);


            getInitialMessages();
          }
        },
        error: onEarlyNetError});
    };

    var getUserDoc = function(id) {
      $.couch.db(config.chatDb).list('chat/viewGuard', 'user_docs', {
        key: id}, {
        success: function(resp) {
          if (resp.total_rows == 1) {
            events.trigger('net:fetched-user-document', resp.rows[0].value.name,
                resp.rows[0].value.settings, resp.rows[0].value.lastSeen);
          } else {
            /* don't know when this would happen */
            console.log('net:getUserDoc('+id+'): total_rows='+resp.total_rows);
          }
        },
        error: onNetError}
      );
    };

    var sendUserDoc = function(username, settings) {
      var endpoint = 'chat/edit_settings/' + config.userDocPrefix + username;
      $.couch.db(config.chatDb).update(endpoint, {
        settings: settings}, {
        error: onNetError }
      );
    };

    var getSession = function() {
      $.couch.session({
        success: function(resp) {
          if (resp.userCtx.name)  {
            events.trigger('net:session-fetched', resp.userCtx.name);
            getUserList();

            /* register database change listener */
            $.couch.db(config.chatDb).changes(0, {'filter':'chat/messages_userdocs'})
              .onChange(onDatabaseChange);
          } else  {
            /* user not logged-in */
            redirect(config.authPath);
          }
        },
        error: onEarlyNetError
      });
    };

    var getInitialMessages = function() {
      $.couch.db(config.chatDb).list('chat/viewGuard', 'messages_by_time', {
          descending: true, limit: config.bulkFetchCount},  {
          success: function(resp)  {
            if (resp.total_rows > 0)  {
              /* messages are ordered descending. need to add them ascending */
              for (var i=resp.rows.length-1; i>=0; i--) {
                var doc = { message: resp.rows[i].value.message,
                            user: resp.rows[i].value.user,
                            time: resp.rows[i].key };
                events.trigger('net:fetched-new-message', resp.rows[i].id, doc);
              }
            }
            if (resp.total_rows < config.bulkFetchCount) {
              events.trigger('net:no-more-old-messages');
            }
            events.trigger('net:initialized');
          },
          error: onEarlyNetError }
      );
    };

    var getOlderMessages = function()  {
      $.couch.db(config.chatDb).list('chat/viewGuard', 'messages_by_time', {
        descending: true, startkey: models.messages.getOldestTime().getTime(),
        skip: 1, limit: config.bulkFetchCount}, {
        success: function(resp) {
          for (var i in resp.rows) {
            var doc = { message: resp.rows[i].value.message,
                        user: resp.rows[i].value.user,
                        time: resp.rows[i].key };
            events.trigger('net:fetched-new-message', resp.rows[i].id, doc);
          }
          if (resp.total_rows < config.bulkFetchCount) {
            events.trigger('net:no-more-old-messages');
          }
        },
        error: onNetError});
    };

    var onDatabaseChange = function(changes) {
      var results = changes.results;
      for (var i in results)  {
        if (results[i].id.indexOf(config.userDocPrefix) == 0) {
          /* user document change */
          getUserDoc(results[i].id);
        } else {
          /* message document change */
          events.trigger('net:new-message-available', results[i].id);
        }
      }
    };

    var doLogout = function() {
      $.couch.logout({
        success: redirect(config.authPath),
        error: onNetError});
    };

    var heartbeat = function()  {
      var username = models.userList.getPrimary().name;
      var endpoint = 'chat/edit_settings/' + config.userDocPrefix + username;
      $.couch.db(config.chatDb).update(endpoint, {}, {
        error: onNetError
      });
    };

    var redirect = function(path) {
      window.location.replace(window.location.origin + path);
    };

    var onNetError = function(status, error, reason) {
      if (status == 401)  {
        /* unauthorized */
        events.trigger('net:error', 'sessionError');
      } else if (status == 403)  {
        /* forbidden */
        events.trigger('net:error', 'sessionError');
      }
      // TODO handle more errors specifically
      else {
        events.trigger('net:error', 'unkownError');
      }
    };

    var onEarlyNetError = function()  {
      events.trigger('net:early-error');
    };

    return this;
  }).call(new Object(), jQuery); /* }}} */

  /* couchchat.models {{{ */
  var models = (function()  {

    /* models.userList {{{ */
    var userList = (function() {
      var User = function(name, settings, lastSeen)  {
        this.name = name;
        this.settings = settings;
        this.lastSeen = new Date(lastSeen);
      };
      var users = new Array();

      this.init = function()  {
        setInterval(checkUserStatus, 5000);

        events.on('net:session-fetched', update);
        events.on('net:fetched-user-document', update);
        events.on('ui:settings-saved', onUserSettingChange);
      };

      this.getPrimary = function() {
        return users[0];
      };

      this.getUserColor = function(name) {
        for (var i in users) {
          if (users[i].name == name)  {
            return users[i].settings.color;
          }
        }
      };

      var update = function(name, settings, lastSeen) {
        for (var i in users)  {
          if (users[i].name == name)  {
            users[i].settings = settings;
            users[i].lastSeen = new Date(lastSeen);

            if (i == 0 && settings) {
              events.trigger('primary-settings-changed', users[0].name,
                  users[0].settings);
            } else if (settings)  {
              events.trigger('user-settings-changed', users[i].name,
                  users[i].settings);
            }

            checkUserStatus();
            return;
          }
        }

        users.push(new User(name, settings, lastSeen));
        checkUserStatus();
      };

      var onUserSettingChange = function(settings)  {
        if (settings.color != users[0].settings.color ||
            settings.layout != users[0].settings.layout)  {
          update(users[0].name, settings);
          events.trigger('upload-user-settings', users[0].name,
              users[0].settings);
        }
      };

      var checkUserStatus = function()  {
        for (var i=1; i<users.length; i++) {
          var status = users[i].lastSeen > Date.now()-config.markOfflineAfter ?
                       'online' : 'offline';
          events.trigger('user-status-changed', users[i].name, status)
        }
      };

      return this;
    }).call(new Object());  /* }}} */

    /* models.messages {{{ */
    var messages = (function() {
      var Message = function(id, message, user, time)  {
        this.id = id;
        this.message = message;
        this.user = user;
        this.time = time ? new Date(time) : null;
        this.newDate = false;
      };

      var messageMap = {};
      var oldestMessage = null;
      var newestMessage = null;

      this.init = function()  {
        events.on('ui:new-message', onNewLocaleMessage);
        events.on('net:sent-message-acked', onLocaleMessageAcked);
        events.on('net:fetched-new-message', onNewRemoteMessage);
        events.on('net:new-message-available', onNewRemoteMessageAvailable);
      };

      this.getOldestTime = function() {
        return oldestMessage.time;
      };

      var add = function(id, message, user, time)  {
        var msg = new Message(id, message, user, time);
        messageMap[id] = msg;

        if (oldestMessage)  {
          if (msg.time < oldestMessage.time)  {
            if (dayTransition(msg.time, oldestMessage.time))
              msg.newDate = true;
            oldestMessage = msg;
          }
        } else {
          oldestMessage = msg;
        }
        if (newestMessage)  {
          if (msg.time > newestMessage.time) {
            if (dayTransition(newestMessage.time, msg.time))
              msg.newDate = true;
            newestMessage = msg;
          }
        } else {
          newestMessage = msg;
        }

        return msg;
      };

      /* checks if one or more calendar days have passed between A and B */
      var dayTransition = function(dateA, dateB)  {
        // TODO don't fail silently
        if (!(dateA && dateB)) return false;

        dateA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
        dateB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
        var days = Math.floor(Math.abs(dateA-dateB)/1000/60/60/24);

        return days >= 1;
      };

      var setTime = function(msgId, time) {
        if (!messageMap[msgId].time)
          messageMap[msgId].time = time;
      };

      var onNewRemoteMessage = function(id, doc) {
        var msg = add(id, doc.message, doc.user, doc.time);
        var isPrimary = msg.user == models.userList.getPrimary().name;

        ui.main.messageView.addMessage(msg, isPrimary, true,
            msg.time<newestMessage.time);

        if (!isPrimary && msg.time == newestMessage.time) {
          events.trigger('new-message');
        }
      };

      var onNewRemoteMessageAvailable = function(id) {
        if (!messages[id])  {
          net.getMessage(id);
        }
      };

      var onNewLocaleMessage = function(input)  {
        var msg = add(net.getUUID(), input, models.userList.getPrimary().name);
        net.sendMessage(msg);
        ui.main.messageView.addMessage(msg, true, false);
      };

      var onLocaleMessageAcked = function(id, time)  {
        setTime(id, new Date(parseInt(time)));
        ui.main.messageView.messageAcked(messageMap[id]);
      };

      return this;
    }).call(new Object());  /* }}} */

    var init = function() {
      userList.init();
      messages.init();
    };

    return  {
      init: init,
      userList: userList,
      messages: messages
    };
  })(); /* }}} */


  ui.init();
  net.init();
  models.init();
};
