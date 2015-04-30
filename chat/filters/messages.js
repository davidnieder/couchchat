function(doc, req)  {
  if (doc.type == 'message' && doc.user != req.userCtx.name) {
    return true;
  } else {
    return false;
  }
}
