function(newDoc, oldDoc, userCtx, secObj) {
  var config = require('config').config;

  var requiredField = function(field) {
    if (!newDoc[field]) {
      throw({forbidden: 'document must have a ' + field});
    }
  };

  var elementInList = function(element, list) {
    for (var i in list) {
      if (element == list[i]) {
        return;
      }
    }
    throw({forbidden: 'invalid value ' + element});
  };

  /* give admins admin rights ;) */
  if (userCtx.roles.indexOf('_admin') != -1)  {
    return;
  }

  /* document must have a type */
  requiredField('type');

  /* there are only two types of documents */
  if (newDoc.type != 'message' && newDoc.type != 'userdoc' ) {
    throw({forbidden: 'forbidden document type'});
  }

  /* message document validation */
  if (newDoc.type == 'message') {
    if (oldDoc) {
      /* can't modify messages */
      throw({forbidden: 'messages can not be modified'});
    }

    requiredField('message');
    requiredField('user');
    requiredField('time');

    if (newDoc.user != userCtx.name)  {
      throw({forbidden: 'uncool dude!'});
    }
  }

  /* user document validation */
  if (newDoc.type == 'userdoc') {

    requiredField('name');
    requiredField('settings');
    requiredField('lastSeen');

    if (newDoc.name != userCtx.name) {
      /* name must be equal to name in _users db */
      throw({forbidden: 'invalid name field'});
    }

    if (newDoc.settings.length != 2 &&
        !newDoc.settings.color &&
        !newDoc.settings.layout)  {
      throw({forbidden: 'invalid settings field'});
    }

    elementInList(newDoc.settings.color, config.colors);
    elementInList(newDoc.settings.layout, config.layouts);

    if (newDoc._id != config.userDocPrefix+userCtx.name)  {
      /* id has to be equal to prefix + username */
      throw({forbidden: 'invalid doc id'});
    }

  }
}
