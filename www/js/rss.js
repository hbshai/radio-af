(function(GLOBAL){
    // mockup for RAF json data
    var programs = {};

    // fill mock with data
    programs["bastforeigar"] = {
        name: "Bäst Före Igår", 
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/Programbild.jpg&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/bastforeigar/feed/?post_type=podcasts"
    };

    programs["Studentaftonpodden"] = {
        name: "Studentaftonpodden", 
        image:"http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/10/Officiell_Poddlogo_final_black.png&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/studentaftonpodden/feed/?post_type=podcasts"
    };

    programs["correcto"] = {
        name: "Correcto", 
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/correctobarcelona.png&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/correcto/feed/?post_type=podcasts"
    };

    programs["klagomuren"] = {
        name: "Klagomuren",
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/klagomuren.jpg&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/klagomuren/feed/?post_type=podcasts"
    };

    programs["ordgasm"] = {
        name: "Ordgasm",
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/09/ordgasmbild2.png&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/ordgasm/feed/?post_type=podcasts"
    };

    programs["etikpubspodden"] = {
        name: "Etikpubspodden",
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/lse-logga2.jpg&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/etikpubspodden/feed/?post_type=podcasts"
    };

    programs["gronkult"] = {
        name: "Grönkult",
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/02/gk2.png&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/gronkult/feed/?post_type=podcasts"
    };

    programs["iluven"] = {
        name: "I Luvén",
        image: "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/09/I-Luv%C3%A9n-programbild.png&w=950&h=670&q=100&zc=1",
        rss: "http://www.radioaf.se/program/iluven/feed/?post_type=podcasts"
    };


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
    function parseRSS(data, xml) {
        var program = {}, podcasts = [], entry

        // TODO: how do we extract podcast.author (#podd-title) a.k.a. program name

        for (var i = 0, l = data.entries.length; i < l; i++) {
            entry = data.entries[i];
            // get the url image
            var imgUrl = entry.content.split('src="')[1].split('" alt=')[0];
            // parse out the path
            imgUrl = imgUrl.split("radioaf.se")[1];

            //console.log(timthumbBase + imgUrl + sizeParams);
            var author = programs[entry.author].name || entry.author;
            podcasts.push({
                title : entry.title,
                author: author,
                program: author,
                programImage: programs[entry.author].image,
                index: -1337,
                content : removeTags(entry.content),
                duration: 0,
                date: entry.publishedDate, // so that we can order correctly in ~the flow~
                image : timthumbBase + imgUrl + sizeParams
            })
        }

        // Find podcast media urls
        var mediaFinder = /\<enclosure url=\"([a-zA-Z0-9\.\/\:\_]+)\"/g,
            match, current = 0
        
        while ((match = mediaFinder.exec(xml)))
            podcasts[current++].podcastUrl = match[1]

        return podcasts;

        // podcasts.forEach(function (pod) {
        //     console.log(pod.content.replace('\n', ''))
        // })
    }

    function findRSS(programName, cb) {
        loadRSS(programs[programName].rss, 10, function(data, xml) {
            var podcasts = parseRSS(data, xml);
            cb(podcasts);
        });

    }

    GLOBAL.rss = {
        load : loadRSS,
        parse : parseRSS,
        find : findRSS
    }
})(window)
