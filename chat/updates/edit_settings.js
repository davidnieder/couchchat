function(doc, req)  {
  var settings;
  var body = JSON.parse(req.body);

  if (!doc) {
    var config = require('config').config;
    var color = parseInt(Math.random() * config.colors.length);

    var settings = {
      layout: config.layouts[0],
      color: config.colors[color]
    };
  } else {
    settings = doc.settings;
  }

  if (doc)  {
    doc['settings'] = body.settings || settings;
    doc['lastSeen'] = Date.now();
    return [doc, JSON.stringify({ok: true})];

  } else {
    var newDoc = {
      _id: config.userDocPrefix + req.userCtx.name,
      type: 'userdoc',
      name: req.userCtx.name,
      settings: body.settings || settings,
      lastSeen: Date.now()
    };
    return [newDoc, JSON.stringify({ok: true})];
  }
}
