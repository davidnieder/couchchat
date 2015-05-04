function(doc, req)  {
  if (doc.type == 'message' && doc.user != req.userCtx.name) {
    return true;
  }
  if (doc.type == 'userdoc' && doc._id != req.userCtx.name) {
    return true;
  }
  
  return false;
}
