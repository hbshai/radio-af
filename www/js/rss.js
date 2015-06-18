(function(GLOBAL) {
    function loadRSS(url, postCount, callback) {
        var gurl = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&output=json_xml&callback=?&q=" + url + "&num=" + postCount;

        $.getJSON(gurl, function(data) {
            //console.log(data.responseData.feed)
            if (data.responseData.feed) {
                callback(data.responseData.feed, data.responseData.xmlString);
            } else {
                console.error("no data received");
            }
        }).error(function() {
            window.handlers.handleNetworkError();
        });
    }

    //http://stackoverflow.com/questions/295566/sanitize-rewrite-html-on-the-client-side/430240#430240
    var tagBody = "(?:[^\"'>]|\"[^\"]*\"|'[^']*')*";

    var tagOrComment = new RegExp(
        "<(?:"
        // Comment body.
        + "!--(?:(?:-*[^->])*--+|-?)"
        // Special "raw text" elements whose content should be elided.
        + "|script\\b" + tagBody + ">[\\s\\S]*?</script\\s*"
        + "|style\\b" + tagBody + ">[\\s\\S]*?</style\\s*"
        // Regular name
        + "|/?[a-z]"
        + tagBody
        + ")>",
        "gi");
    function removeTags(html) {
        var oldHtml;
        do {
            oldHtml = html;
            html = html.replace(tagOrComment, "");
        } while (html !== oldHtml);
        return html.replace(/</g, "&lt;");
    }

    // base url for radioaf's wordpress plugin that crops imagesizes
    var timthumbBase = "http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=";
    // NOTE: the shrunk images don't conform to the same width unless the height param
    // is also present
    var sizeParams = "&w=142&h=100&q=100";


    String.prototype.capitalize = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    function parseRSS(data, xml, program, callb) {
        var podcasts = [], entry, imgUrl, i, l, datax, url;

        var parser = new DOMParser(),
            xmlDoc = parser.parseFromString(xml, "text/xml"),
            xmlItems = xmlDoc.getElementsByTagName("item");

        for (i = 0, l = data.entries.length; i < l; i++) {
            entry = data.entries[i];
            datax = xmlItems[i].getElementsByTagName("enclosure");

            if (datax == undefined || datax[0] == undefined) {
                continue;
            }

            var url = datax[0].getAttributeNode("url");
            if (url == undefined || url.value == undefined || url.value.indexOf(".mp3") === -1) {
                continue;
            }
            url = url.value;

            // get the url image
            try {
                imgUrl = entry.content.split("src=\"")[1].split("\" alt=")[0];
                // parse out the path
                imgUrl = imgUrl.split("radioaf.se")[1];
            } catch (e) {
                imgUrl = program.image;
            }

            //console.log(timthumbBase + imgUrl + sizeParams);
            podcasts.push({
                title: entry.title,
                // author is the rss author / program.key, e.g. lhs
                author: program.key,
                // program is the name of the program, e.g. Lexikaliska Hästsällskapet
                program: program.name,
                index: i,
                content: removeTags(entry.content),
                duration: 0,
                date: entry.publishedDate, // so that we can order correctly in ~the flow~
                image: timthumbBase + imgUrl + sizeParams,
                podcastUrl: url
            });
        }

        var current = 0;
        podcasts.forEach(function(podd, index) {
            /**
             * Make a HEAD request for the resource (podcast) to find the
             * actual size, in bytes. Assuming that all programs use 128kbps
             * we can calculate the duration.
             */
            $.ajax({
                type: "HEAD",
                async: true,
                url: podd.podcastUrl,
            }).done(function(message, text, jqXHR) {
                var poddSize = jqXHR.getResponseHeader("Content-Length") * 8; // byte --> bits
                podd.duration = Math.floor(poddSize / (128 * 1024)); // bits/128kbps = s
            }).always(function() {
                // When all podcasts have been failed/done, proceed.
                current++;
                if (current === podcasts.length && callb) {
                    callb(podcasts);
                }
            });

        });

        // Edge case: No podcasts
        if (l === 0 && callb) {
            callb([]);
        }

        return podcasts;
    }

    function findRSS(programKey) {
        if (/\s|ö|å|ä/g.test(programKey)) {
            console.warn("findRSS: " + programKey + " should not contain whitespace/non-ascii chars!");
        }

        return window.app.programs[programKey].podcasts;
    }

    GLOBAL.rss = {
        load: loadRSS,
        parse: parseRSS,
        find: findRSS
    };
})(window);
