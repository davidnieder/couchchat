// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

(function($) {

  $.couch = $.couch || {};
  /** @lends $.couch */

  var uuidCache = [];

  $.extend($.couch, {
    urlPrefix: '',

    session: function(options) {
      options = options || {};
      return ajax({
        type: "GET", url: this.urlPrefix + "/_session",
        async: options.async==false ? false : true,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Accept', 'application/json');
        },
        complete: function(req) {
          var resp = $.parseJSON(req.responseText);
          if (req.status == 200) {
            if (options.success) options.success(resp);
          } else if (options.error) {
            options.error(req.status, resp.error, resp.reason);
          } else {
            throw "An error occurred getting session info: " + resp.reason;
          }
        }
      });
    },

    /**
     * @private
     */
    userDb : function(callback) {
      return $.couch.session({
        success : function(resp) {
          var userDb = $.couch.db(resp.info.authentication_db);
          callback(userDb);
        }
      });
    },

    signup: function(user_doc, password, options) {
      options = options || {};
      user_doc.password = password;
      user_doc.roles = user_doc.roles || [];
      user_doc.type = "user";
      var user_prefix = "org.couchdb.user:";
      user_doc._id = user_doc._id || user_prefix + user_doc.name;

      return $.couch.userDb(function(db) {
        db.saveDoc(user_doc, options);
      });
    },

    login: function(options) {
      options = options || {};
      return $.ajax({
        type: "POST", url: this.urlPrefix + "/_session", dataType: "json",
        data: {name: options.name, password: options.password},
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Accept', 'application/json');
        },
        complete: function(req) {
          var resp = $.parseJSON(req.responseText);
          if (req.status == 200) {
            if (options.success) options.success(resp);
          } else if (options.error) {
            options.error(req.status, resp.error, resp.reason);
          } else {
            throw 'An error occurred logging in: ' + resp.reason;
          }
          if (options.complete) options.complete();
        }
      });
    },

    logout: function(options) {
      options = options || {};
      return $.ajax({
        type: "DELETE", url: this.urlPrefix + "/_session", dataType: "json",
        async: options.async==false ? false : true,
        username : "_", password : "_",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Accept', 'application/json');
        },
        complete: function(req) {
          var resp = $.parseJSON(req.responseText);
          if (req.status == 200) {
            if (options.success) options.success(resp);
          } else if (options.error) {
            options.error(req.status, resp.error, resp.reason);
          } else {
            throw 'An error occurred logging out: ' + resp.reason;
          }
          if (options.complete) options.complete();
        }
      });
    },

    db: function(name, db_opts) {
      db_opts = db_opts || {};
      var rawDocs = {};
      function maybeApplyVersion(doc) {
        if (doc._id && doc._rev && rawDocs[doc._id] &&
            rawDocs[doc._id].rev == doc._rev) {
          // todo: can we use commonjs require here?
          if (typeof Base64 == "undefined") {
            throw 'Base64 support not found.';
          } else {
            doc._attachments = doc._attachments || {};
            doc._attachments["rev-"+doc._rev.split("-")[0]] = {
              content_type :"application/json",
              data : Base64.encode(rawDocs[doc._id].raw)
            };
            return true;
          }
        }
      }
      return /** @lends $.couch.db */{
        name: name,
        uri: this.urlPrefix + "/" + encodeURIComponent(name) + "/",

        info: function(options) {
          return ajax(
            {url: this.uri},
            options,
            "Database information could not be retrieved"
          );
        },

        changes: function(since, options) {

          options = options || {};
          // set up the promise object within a closure for this handler
          var timeout = 100, db = this, active = true,
            listeners = [],
            xhr = null,
            promise = /** @lends $.couch.db.changes */ {
            onChange : function(fun) {
              listeners.push(fun);
            },
            stop : function() {
              active = false;
              if (xhr){
                xhr.abort();
              }
            }
          };
          // call each listener when there is a change
          function triggerListeners(resp) {
            $.each(listeners, function() {
              this(resp);
            });
          }
          // when there is a change, call any listeners, then check for
          // another change
          options.success = function(resp) {
            timeout = 100;
            if (active) {
              since = resp.last_seq;
              triggerListeners(resp);
              getChangesSince();
            }
          };
          options.error = function() {
            if (active) {
              setTimeout(getChangesSince, timeout);
              timeout = timeout * 2;
            }
          };
          // actually make the changes request
          function getChangesSince() {
            var opts = $.extend({heartbeat : 10 * 1000}, options, {
              feed : "longpoll",
              since : since
            });
            xhr = ajax(
              {url: db.uri + "_changes"+encodeOptions(opts)},
              options,
              "Error connecting to "+db.uri+"/_changes."
            );
          }
          // start the first request
          if (since) {
            getChangesSince();
          } else {
            db.info({
              success : function(info) {
                since = info.update_seq;
                getChangesSince();
              }
            });
          }
          return promise;
        },

        list: function(list, view, options, ajaxOptions) {
          var list = list.split('/');
          var options = options || {};
          var type = 'GET';
          var data = null;
          if (options['keys']) {
            type = 'POST';
            var keys = options['keys'];
            delete options['keys'];
            data = toJSON({'keys': keys });
          }
          return ajax({
              type: type,
              data: data,
              url: this.uri + '_design/' + list[0] +
                   '/_list/' + list[1] + '/' + view + encodeOptions(options)
              },
              ajaxOptions, 'An error occurred accessing the list'
          );
        }
      };
    },

    newUUID: function(cacheNum) {
      if (cacheNum === undefined) {
        cacheNum = 1;
      }
      if (!uuidCache.length) {
        ajax({url: this.urlPrefix + "/_uuids", data: {count: cacheNum}, async:
              false}, {
            success: function(resp) {
              uuidCache = resp.uuids;
            }
          },
          "Failed to retrieve UUID batch."
        );
      }
      return uuidCache.shift();
    }
  });

  /**
   * @private
   */
  function ajax(obj, options, errorMessage, ajaxOptions) {
    var timeStart;
    var defaultAjaxOpts = {
      contentType: "application/json",
      headers:{"Accept": "application/json"}
    };

    options = $.extend({successStatus: 200}, options);
    ajaxOptions = $.extend(defaultAjaxOpts, ajaxOptions);
    errorMessage = errorMessage || "Unknown error";
    timeStart = (new Date()).getTime();
    return $.ajax($.extend($.extend({
      type: "GET", dataType: "json", cache : maybeUseCache(),
      beforeSend: function(xhr){
        if(ajaxOptions && ajaxOptions.headers){
          for (var header in ajaxOptions.headers){
            xhr.setRequestHeader(header, ajaxOptions.headers[header]);
          }
        }
      },
      complete: function(req) {
        var reqDuration = (new Date()).getTime() - timeStart;
        try {
          var resp = $.parseJSON(req.responseText);
        } catch(e) {
          if (options.error) {
            options.error(req.status, req, e);
          } else {
            throw errorMessage + ': ' + e;
          }
          return;
        }
        if (options.ajaxStart) {
          options.ajaxStart(resp);
        }
        if (req.status == options.successStatus) {
          if (options.beforeSuccess) options.beforeSuccess(req, resp, reqDuration);
          if (options.success) options.success(resp, reqDuration);
        } else if (options.error) {
          options.error(req.status, resp && resp.error ||
                        errorMessage, resp && resp.reason || "no response",
                        reqDuration);
        } else {
          throw errorMessage + ": " + resp.reason;
        }
      }
    }, obj), ajaxOptions));
  }

  /**
   * @private
   */
  // Convert a options object to an url query string.
  // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
  function encodeOptions(options) {
    var buf = [];
    if (typeof(options) === "object" && options !== null) {
      for (var name in options) {
        if ($.inArray(name,
                      ["error", "success", "beforeSuccess", "ajaxStart"]) >= 0)
          continue;
        var value = options[name];
        if ($.inArray(name, ["key", "startkey", "endkey"]) >= 0) {
          value = toJSON(value);
        }
        buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
      }
    }
    return buf.length ? "?" + buf.join("&") : "";
  }

  /**
   * @private
   */
  function toJSON(obj) {
    return obj !== null ? JSON.stringify(obj) : null;
  }

  /**
   * @private
   */
  function maybeUseCache() {
    if (!navigator){
      return true;
    }
    else if (/(MSIE|Trident)/.test(navigator.userAgent)){
      return false;
    }
    return true;
  }

})(jQuery);
