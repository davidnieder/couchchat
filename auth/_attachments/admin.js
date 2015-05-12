var couchchat = (function($)  {
  var $container;
  var $error;
  var $userTable;
  var tableRowTemplate;
  var userDocs = new Object();

  var populateList = function(response) {
    response = response.rows;
    for (var i in response) {
      if (response[i].id.indexOf('org.couchdb.user:') == 0) {
        if (response[i].doc.roles.indexOf('couchchat:user') != -1)  {
          updateList(response[i].doc, 'deactivate');
        } else if (response[i].doc['request'] == 'couchchat:user')  {
          updateList(response[i].doc, 'activate');
        } else {
          continue;
        }
      }
    }
    $userTable.show();
    $userTable.find('a').click(changeUserStatus);
  };

  var updateList = function(user, action) {
    var id = user._id,
        name = id.split(':')[1],
        status, statusClass, link;
    userDocs[id] = user;

    if (action == 'deactivate')  {
      status = 'valid-user';
      statusClass = 'happy-state';
      link = 'deactivate';
    } else if (action == 'activate')  {
      status = 'activation-pending';
      statusClass = 'sad-state';
      link = 'activate';
    }

    var template = Mustache.render(tableRowTemplate, {
      name:name, statusClass:statusClass, status:status, id:id, link:link});

    if ($('#user-'+name).length) {
      $('#user-'+name).replaceWith(template);
      $('#user-'+name).find('a').click(changeUserStatus);
    } else {
      $userTable.find('tbody').append(template);
    }
  };

  var changeUserStatus = function(event) {
    event.preventDefault();
    var $link = $(this);
    var action = $link.text();
    var userDoc = userDocs[$link.attr('data-user-id')];

    if (action == 'delete') {
      $.couch.db('_users').removeDoc(userDoc, {
        success: function() {
          $('#user-'+userDoc._id.split(':')[1]).remove();
        },
        error: showError
      });
    } else {
      if (action == 'activate') {
        delete userDoc.request;
        userDoc.roles.push('couchchat:user');
      } else {
        userDoc.request = 'couchchat:user';
        userDoc.roles.splice(userDoc.roles.indexOf('couchchat:user'), 1);
      }

      $.couch.db('_users').saveDoc(userDoc,  {
        success: function() {
          updateList(userDoc, action=='activate' ? 'deactivate' : 'activate');
        },
        error: showError
      });
    }
  };

  var showError = function(status, error) {
    $error.text('An error occurred: ' + status + ' ' + error);
    $error.show();
  };

  admin = {
    init: function()  {
      $container = $('#admin-view');
      $error = $('#error');
      $userList = $('#user-list');
      $userTable = $('#user-table');
      tableRowTemplate = $('#table-row').html();
      Mustache.parse(tableRowTemplate);

      $.couch.db('_users').allDocs({include_docs:true,skip:1, /* skip ddoc */
        success: populateList,
        error: showError
      });
    },
    show: function() {
      $container.show();
    }
  };

  return couchchat = {
    admin: admin
  }
})(jQuery);
