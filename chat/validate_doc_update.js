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

    requiredField('settings');
    requiredField('lastSeen');

    if (newDoc.settings.length != 2 &&
        !newDoc.settings.color &&
        !newDoc.settings.layout)  {
      throw({forbidden: 'invalid settings field'});
    }

    elementInList(newDoc.settings.color, config.colors);
    elementInList(newDoc.settings.layout, config.layouts);

    if (newDoc._id != userCtx.name)  {
      /* id has to be equal to user name */
      throw({forbidden: 'invalid doc id'});
    }

  }
}
