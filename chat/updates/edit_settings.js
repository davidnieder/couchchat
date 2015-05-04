function(doc, req)  {
  var defaults = {
    layout: 'bubbles',
    color: '#94CB54'
  };
  var settings = doc ? doc.settings : defaults;
  var body = JSON.parse(req.body);

  if (doc)  {
    doc['settings'] = body.settings || settings;
    doc['lastSeen'] = Date.now();
    return [doc, JSON.stringify({ok: true})];

  } else {
    var newDoc = {
      _id: req.userCtx.name,
      type: 'userdoc',
      settings: body.settings || settings,
      lastSeen: Date.now()
    };
    return [newDoc, JSON.stringify({ok: true})];
  }
}
