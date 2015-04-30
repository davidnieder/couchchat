function(head, req) {
  var row, results = new Array();

  start({
    'headers': {
      'Content-Type': 'application/json'
    }
  });

  while (row = getRow())  {
      results.push(row);
  }

  return toJSON({total_rows:results.length, rows:results});
}
