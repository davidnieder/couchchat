function(newDoc, oldDoc, userCtx, secObj) {

  var require = function(field) {
    if (!newDoc[field]) {
      throw({forbidden: 'document must have a ' + field});
    }
  };

  /* document must have a type */
  require('type');

  /* there are only two types of documents */
  if (newDoc.type != 'message' && newDoc.type != 'setting' ) {
    throw({forbidden: 'forbidden document type'});
  }

  /* message document validation */
  if (newDoc.type == 'message') {
    if (oldDoc) {
      /* can't modify messages */
      throw({forbidden: 'messages can not be modified'});
    }

    require('message');
    require('user');
    require('time');

    if (newDoc.user != userCtx.name)  {
      throw({forbidden: 'uncool dude!'});
    }
  }

  /* setting document validation */
  // ...
}
