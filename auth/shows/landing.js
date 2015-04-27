function(doc, req)  {
  if (req.userCtx.name &&
      req.userCtx.roles.indexOf('couchchat:user') != -1) {
    /* user is logged-in and in couchchat "group" */
    /* redirect to chat */
    return {
      code: 302,
      headers: {Location: '/couchchat_chat/_design/chat/index.html'},
      body: 'see /couchchat_chat/_design/chat/index.html'
    };
  }
  else if (req.userCtx.name &&
           req.userCtx.roles.indexOf('couchchat:user') == -1) {
    /* user logged-in but no in couchchat "group" */
    /* redirect to info page */
    return {
      code: 302,
      headers: {Location: '../status.html'},
      body: 'see ../status.html'
    };
  }
  else  {
    /* redirect to login */
    return {
      code: 302,
      headers: {Location: '../login.html'},
      body: 'see ../login.html'
    };
  }
}
