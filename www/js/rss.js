(function(GLOBAL){
    function loadRSS(url, postCount, callback) {
        var gurl="http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&output=json_xml&callback=?&q="+url+"&num=" + postCount;

        $.getJSON(gurl, function(data) {
            console.log(data)
            if (data.responseData.feed) {
                callback(data.responseData.feed, data.responseData.xmlString)
            } else {
                console.error('no data received')
            }
        })
    }

    //http://stackoverflow.com/questions/295566/sanitize-rewrite-html-on-the-client-side/430240#430240
    var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

    var tagOrComment = new RegExp(
        '<(?:'
        // Comment body.
        + '!--(?:(?:-*[^->])*--+|-?)'
        // Special "raw text" elements whose content should be elided.
        + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
        + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
        // Regular name
        + '|/?[a-z]'
        + tagBody
        + ')>',
        'gi');
    function removeTags(html) {
      var oldHtml;
      do {
        oldHtml = html;
        html = html.replace(tagOrComment, '');
      } while (html !== oldHtml);
      return html.replace(/</g, '&lt;');
    }


    function parseRSS(data, xml) {
        var program = {}, podcasts = [], entry
        console.log('parsing', data)

        for (var i = 0, l = data.entries.length; i < l; i++) {
            entry = data.entries[i]
            podcasts.push({
                title : entry.title,
                content : removeTags(entry.content),
                image : 0
            })
        }

        // Find podcast media urls
        var mediaFinder = /\<enclosure url=\"([a-zA-Z0-9\.\/\:\_]+)\"/g,
            match, current = 0
        
        while ((match = mediaFinder.exec(xml)))
            podcasts[current++].podcastUrl = match[1]

        podcasts.forEach(function (pod) {
            console.log(pod.content.replace('\n', ''))
        })

    }

    GLOBAL.rss = {
        load : loadRSS,
        parse : parseRSS
    }
})(window)