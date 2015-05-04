function(doc, req)  {
  var resp = function(id, time) {
    return {
      'headers': {
        'Content-Type': 'application/json'
      },
      'body': JSON.stringify({'ok': true, 'id': id, 'time': time})
    };
  };

  var body = JSON.parse(req.body);
  var newDoc = {
    _id: body.id,
    type: 'message',
    message: body.message,
    user: body.user,
    time: Date.now()
  };

  return [newDoc, resp(newDoc._id, newDoc.time)];
}

