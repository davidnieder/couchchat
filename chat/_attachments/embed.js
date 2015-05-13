var autoEmbed = (function() {

  var sites = {
    youtube:  {
      regEx: /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
      embedCode: '<div class="video-embed">'
                + '<iframe src="https://www.youtube.com/embed/{{{id}}}"'
                + ' frameborder="0" allowfullscreen></iframe><br>'
                + '<a href="{{{link}}}" target="_blank">{{link}}</a>'
                +'</div>'
    },
    vimeo:  {
      regEx: /^(https?:\/\/(?:www|player)?vimeo.com\/)(\d+)*/,
      embedCode: '<div class="video-embed">'
                + '<iframe src="https://player.vimeo.com/video/{{{id}}}"'
                + ' frameborder="0" allowfullscreen></iframe><br>'
                + '<a href="{{{link}}}" target="_blank">{{link}}</a>'
                +'</div>'
    }
  };

  var decodeSlash = function(string)  {
    return string.replace(new RegExp('&#x2F;', 'g'), '/');
  };

  var cleanup = function(string)  {
    return string.replace(new RegExp('</a>;', 'g'), '</a>');
  };

  var embed = function(autolinker, match) {
    if (match.getType() != 'url') {
      return true;
    }

    for (var i in sites)  {
      var result = match.getUrl().match(sites[i].regEx);
      if (result && result[2]) {
        var template = Mustache.render(sites[i].embedCode,
              {id:result[2],link:match.getUrl()});
        return template;
      }
    }

    return true;
  };

  /* make iframes change size with their parents */
  var timeout;
  var scaleIframe = function() {
    /* debounce event */
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(function() {
      var width = parseInt($('#message-view').width()) * 60 / 100; // width:60%
      var aspectRation = 0.5625; // 9/16

      $('iframe').each(function() {
        var $iframe = $(this);
        $iframe.width(width);
        $iframe.height(width*aspectRation);
      });
    }, 100);
  };
  $(window).resize(scaleIframe);

  var autolinker = new Autolinker({stripPrefix: false, phone:false,
    twitter:false, hashtag:false, replaceFn:embed});
 
  return function(message) {
    message = decodeSlash(message);
    message = autolinker.link(message);
    return cleanup(message);
  };
})();
