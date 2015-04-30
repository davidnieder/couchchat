function(doc) {
  if (doc.type == 'message') {
    if (doc.message && doc.user && doc.time) {
      emit(doc._id, {message:doc.message, user:doc.user, time:doc.time});
    }
  }
}
