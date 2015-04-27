function() {
  /* no documents for this db */
  throw({forbidden: 'read-only database'});
}
