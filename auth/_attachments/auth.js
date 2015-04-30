var setPosition = function($container, divider) {
  divider = divider ? divider : 1;
  var height = $(window).height();
  var margin = height/divider - $container.height()/2;
  margin = margin<2 ? 2 : margin;
  $container.css('margin-top', margin);
};

/* couchchat.login */
(function($, couchchat) {
  if (!couchchat.login)  {
    return;
  }

  var $container;
  var $nameField;
  var $passwordField;
  var $submitButton;
  var $loginError;

  var submitClicked = function(event)  {
    event.preventDefault();
    if ($nameField.val() &&
        $passwordField.val()) {
      $loginError.hide();
      doLogin();
    } else {
      $loginError.show();
    }
  };
  var doLogin = function() {
    $.couch.login({
      'name': $nameField.val(),
      'password': $passwordField.val(),
      'success': loginSuccessful,
      'error': loginFailed
    });
  };
  var loginFailed = function() {
    $loginError.show();
    $passwordField.val('');
    $nameField.focus();
  };
  var loginSuccessful = function(data, status, jqXHR) {
    if (data.ok)  {
      window.location.href = '../auth/_show/landing';
    } else {
      loginFailed();
    }
  };

  couchchat.login = {
    init: function()  {
      $container = $('#login-view');
      $nameField = $('#login-name');
      $passwordField = $('#login-password');
      $submitButton = $('#login-submit');
      $loginError = $('#login-error');
      $submitButton.on('click', submitClicked);
    },
    show: function()  {
      $container.show();
      setPosition($container, 3);
      $nameField.focus();
    }
  };
})(jQuery, couchchat);

/* couchchat.signup */
(function($, couchchat) {
  if (!couchchat.signup) {
    return;
  }

  var $container;
  var $nameField;
  var $passwordField;
  var $passwordRepeatField;
  var $submitButton;
  var $signupError;
  var errors = {
    passwordError: 'Passwords do not match',
    nameExists: 'Username already in use',
    allFieldsRequired: 'All fields are required',
    genericError: 'Signup failed. Please try again later'
  };

  var submitClicked = function(event)  {
    event.preventDefault();
    if (!($nameField.val() && $passwordField.val()
          && $passwordRepeatField.val())) {
      $signupError.html(errors.allFieldsRequired);
      $signupError.show();
      return;
    }
    if ($passwordField.val() != $passwordRepeatField.val()) {
      $signupError.html(errors.passwordError);
      $signupError.show();
      $passwordField.focus();
      return;
    }
    $signupError.hide();
    doSignup();
  };
  var doSignup = function() {
    $.couch.signup(
      {'name': $nameField.val(),'request': 'couchchat:user'},
      $passwordField.val(),
      {'success': signupSuccessful,'error': signupFailed});
  };
  var signupFailed = function(data, status, jqXHR) {
    if (status == 'conflict') {
      $signupError.html(errors.nameExists);
      $nameField.focus();
    } else {
      $signupError.html(errors.genericError);
    }
    $signupError.show();
  };
  var signupSuccessful = function(data, status, jqXHR) {
    if (data.ok)  {
      $.couch.login({name:$nameField.val(),password:$passwordField.val(),
                     success:redirect,error:redirect});
    } else {
      signupFailed();
    }
  };
  var redirect = function() {
    window.location.href = '../auth/_show/landing';
  };

  couchchat.signup = {
    init: function()  {
      $container = $('#signup-view');
      $nameField = $('#signup-name');
      $passwordField = $('#signup-password');
      $passwordRepeatField = $('#signup-password-repeat');
      $submitButton = $('#signup-submit');
      $signupError = $('#signup-error');
      $submitButton.on('click', submitClicked);
    },
    show: function()  {
      $container.show();
      setPosition($container, 3);
      $nameField.focus();
    }
  };
})(jQuery, couchchat);

/* user status */
(function($, couchchat) {
  if (!couchchat.status)  {
    return;
  }
  
  var $container;
  var $statusMessage;
  var $status = {};

  var showStatus = function(data, status, jqXHR)  {
    if (data.ok)  {
      if (data.userCtx.name)  {
        $status.login.html('yes');
        $status.login.addClass('happy-state');
        $status.username.html(data.userCtx.name);
        if (data.userCtx.roles.indexOf('couchchat:user') != -1) {
          $status.role.html('valid-user');
          $status.role.addClass('happy-state');
        } else {
          $status.role.html('activation-pending');
          $status.role.addClass('sad-state');
          $statusMessage.show();
        }
      } else {
        $status.login.html('no');
        $status.login.addClass('sad-state');
        $status.username.html('-');
        $status.role.html('-');
      }
    } else  {
      $.statusMessage.html('Error');
      $.statusMessage.show();
    }
  }

  couchchat.status = {
    init: function()  {
      $container = $('#status-view');
      $statusMessage = $('#status-message');
      $status.login = $('#status-login');
      $status.username = $('#status-username');
      $status.role = $('#status-userrole');
      $.couch.session({success:showStatus,error:showStatus});

    },
    show: function()  {
      $container.show();
      setPosition($container, 4);
    }
  };
})(jQuery, couchchat);
