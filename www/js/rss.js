(function(GLOBAL){
    function loadRSS(url, postCount, callback) {
        var gurl="http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&output=json_xml&callback=?&q="+url+"&num=" + postCount;

        $.getJSON(gurl, function(data) {
            //console.log(data.responseData.feed)
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

    // base url for radioaf's wordpress plugin that crops imagesizes
    var timthumbBase = "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=";
    // NOTE: the shrunk images don't conform to the same width unless the height param
    // is also present
    var sizeParams = "&w=142&h=100&q=100";


     String.prototype.capitalize = function(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function parseRSS(data, xml, program, callb) {
        var podcasts = [], entry, imgUrl

        for (var i = 0, l = data.entries.length; i < l; i++) {
            entry = data.entries[i];
            // get the url image
            imgUrl = entry.content.split('src="')[1].split('" alt=')[0];
            // parse out the path
            imgUrl = imgUrl.split("radioaf.se")[1];

            //console.log(timthumbBase + imgUrl + sizeParams);
            podcasts.push({
                title : entry.title,
                author: program.name || entry.author,
                program: program.name,
                programImage: program.image,
                index: i,
                content : removeTags(entry.content),
                duration: 0,
                date: entry.publishedDate, // so that we can order correctly in ~the flow~
                image : timthumbBase + imgUrl + sizeParams
            });
        }

        // Find podcast media urls
        var mediaFinder = /\<enclosure url=\"([a-zA-Z0-9\.\/\:\_]+)\"/g,
            match, current = 0;
        
        while ((match = mediaFinder.exec(xml)))
            podcasts[current++].podcastUrl = match[1];

        var current = 0;
        podcasts.forEach(function (podd, index){
            /**
             * Make a HEAD request for the resource (podcast) to find the
             * actual size, in bytes. Assuming that all programs use 128kbps
             * we can calculate the duration.
             */ 
            $.ajax({
                type: "HEAD",
                async: true,
                url: podd.podcastUrl,
            }).done(function (message, text, jqXHR){
                var poddSize = jqXHR.getResponseHeader('Content-Length') * 8; // byte --> bits
                podd.duration = Math.floor(poddSize / (128 * 1024)); // bits/128kbps = s
            }).always(function (){
                // When all podcasts have been failed/done, proceed.
                current++;
                if (current === podcasts.length && callb)
                    callb(podcasts);
            });
        })        
    
        return podcasts;
    }

    function findRSS(programKey, cb) {
        if (/\s|ö|å|ä/g.test(programKey))
            console.warn("findRSS: " + programKey + " should not contain whitespace/non-ascii chars!");
        
        return window.app.programs[programKey].podcasts;
    }

    GLOBAL.rss = {
        load : loadRSS,
        parse : parseRSS,
        find : findRSS
    }
})(window)
