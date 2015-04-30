function(doc) {
  if (doc.type == 'message') {
    if (doc.message && doc.user && doc.time) {
      emit(doc.time, {message:doc.message, user:doc.user});
    }
  }
}
