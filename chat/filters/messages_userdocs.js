function(doc, req)  {
  var config = require('config').config;

  if (doc.type == 'message' && doc.user != req.userCtx.name) {
    return true;
  }
  if (doc.type == 'userdoc' &&
      doc._id != config.userDocPrefix + req.userCtx.name) {
    return true;
  }
  
  return false;
}
