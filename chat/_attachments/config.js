var config = {
  /* this database */
  chatDb: 'couchchat_chat',
  /* url to redirect to for authorization */
  authPath: '/couchchat_auth/_design/auth/_show/landing',

  /* number of messages to load initially or on 'load older' request */
  bulkFetchCount: 10,
  /* number of milliseconds between heartbeats */
  heartbeatFrequency: 30000,
  /* milliseconds between lastSeen and marking an user as offline */
  markOfflineAfter: 60000,

  uuidCacheSize: 10,

  /* user documents are prefixed with this string */
  userDocPrefix: 'userdoc:',

  colors: ['#94CB54', '#35C9C2', '#6BB3D2', '#A285E2', '#E8875A', '#F8F786'],
  layouts: ['Bubbles', /*'Classic'*/]
};


if (typeof(exports) === 'object') {
     exports.config = config;
};
