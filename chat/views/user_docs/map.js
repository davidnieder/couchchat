function(doc) {
  if (doc.type == 'userdoc')  {
    if (doc.settings && doc.lastSeen) {
      emit(doc._id, {name:doc.name, settings:doc.settings,
                     lastSeen:doc.lastSeen});
    }
  }
}
