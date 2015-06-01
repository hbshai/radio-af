(function (GLOBAL){

    // API
    // ------------------------------------------------------------------
    // htmlFarm.miniPod(podcast, alternateThis) -> root el
    // htmlFarm.feedPod(podcast, alternateThis) -> root el
    // htmlFarm.programPage(program) -> root el NYI
    // htmlFarm.favDiv(program) -> root el NYI
    // ------------------------------------------------------------------

    // the dom wrapper for nice smeets
    // credits to: https://gist.github.com/neilj/1532562
    var el = ( function () {
        var doc = document;

        var directProperties = {
            'class': 'className',
            className: 'className',
            defaultValue: 'defaultValue',
            'for': 'htmlFor',
            html: 'innerHTML',
            text: 'textContent',
            value: 'value'
        };

        var booleanProperties = {
            checked: 1,
            defaultChecked: 1,
            disabled: 1,
            multiple: 1,
            selected: 1
        };

        var setProperty = function ( el, key, value ) {
            var prop = directProperties[ key ];
            if ( prop ) {
                el[ prop ] = ( value == null ? '' : '' + value );
            } else if ( booleanProperties[ key ] ) {
                el[ key ] = !!value;
            } else if ( value == null ) {
                el.removeAttribute( key );
            } else {
                el.setAttribute( key, '' + value );
            }
        };

        var appendChildren = function ( el, children ) {
            var i, l, node;
            for ( i = 0, l = children.length; i < l; i += 1 ) {
                node = children[i];
                if ( node ) {
                    if ( node instanceof Array ) {
                        appendChildren( el, node );
                    } else {
                        if ( typeof node === 'string' ) {
                            node = doc.createTextNode( node );
                        }
                        el.appendChild( node );
                    }
                }
            }
        };

        var splitter = /(#|\.)/;

        var create = function ( tag, props, children ) {
            if ( props instanceof Array ) {
                children = props;
                props = null;
            }

            var parts, name, el,
            i, j, l, node, prop;

            if ( splitter.test( tag ) ) {
                parts = tag.split( splitter );
                tag = parts[0];
                if ( !props ) { props = {}; }
                for ( i = 1, j = 2, l = parts.length; j < l; i += 2, j += 2 ) {
                    name = parts[j];
                    if ( parts[i] === '#' ) {
                        props.id = name;
                    } else {
                        props.className = props.className ?
                        props.className + ' ' + name : name;
                    }
                }
            }

            el = doc.createElement( tag );
            if ( props ) {
                for ( prop in props ) {
                    setProperty( el, prop, props[ prop ] );
                }
            }
            if ( children ) {
                appendChildren( el, children );
            }
            return el;
        };

        return create;

    }() );

    // This creates the view for a particular program; i.e the one that pops up
    // when you click on a favourite pod, or on a program listed in the "Alla program"
    // view
    function createProgramView(podcasts) {
        var firstPod = podcasts[0];
        var counter = 0;
        var $page = $(document.createElement("div"));
        $page.addClass("page");
        $page.attr("id", "program");

        // create the following structure:
        // div.spotlight-container
              // div#spotlight-play 
              // div.spotlight-text-container
              //     div#spotlight-title Studentaftonpodden
              //     div#spotlight-ep Anna Kinberg Batra
              //     div#spotlight-time 77 min
              // div#spotlight-dl

              // create the spotlight div
        var $spotlight = $(document.createElement("div")).addClass("spotlight");
        $spotlight.append($(document.createElement("img")).attr("id", "spotlight-img").attr("src", firstPod.programImage));


        // create the text component of the spotlight
        var $spotlightText = $(document.createElement("div")).addClass("spotlight-text-container");
        $spotlightText.append($(document.createElement("div")).attr("id", "spotlight-title").text(firstPod.program));
        $spotlightText.append($(document.createElement("div")).attr("id", "spotlight-ep").text(firstPod.title));
        $spotlightText.append($(document.createElement("div")).attr("id", "spotlight-time").text(firstPod.duration + " min"));

        var $spotlightContainer = $(document.createElement("div")).addClass("spotlight-container");
        $spotlightContainer.append($(document.createElement("div")).attr("id", "spotlight-play"));
        $spotlightContainer.append($spotlightText);
        $spotlightContainer.append($(document.createElement("div")).attr("id", "spotlight-dl"));
        $spotlight.append($spotlightContainer);

        // create the title-bar div
        var $titleBar = $(document.createElement("div"));
        $titleBar.addClass("title-bar");
        $titleBar.text(firstPod.author);

        var $poddContainer = $(document.createElement("div")).addClass("podd-container");

        podcasts.forEach(function(podcast){
            // we already used the first pod for the spotlight!
            if (podcast === firstPod) {
                return;
            }
            counter = (counter + 1) % 2;
            $poddContainer.append(createPodcastDiv(podcast, false, counter === 0));
        });
        // append all the children to the parent div page
        $page.append($spotlight);
        $page.append($titleBar);
        $page.append($poddContainer);
        // return the complete DOM tree
        return $page[0];
    }

    // podcast : podcast to generate
    // doTitle : generate a podd-title div?
    // alternate : append .alternating class?
    function createPodcastDiv(podcast, doTitle, alternate) {
        return el('div.podd' + (alternate ? '.alternating' : ''), { 
            // Allow each div to carry its own pointer(s) to the podcast.
            // See comment further down how they (could) work.
            "data-podcast-program" : podcast.program,
            "data-podcast-index" : podcast.index
        }, [
            // TODO: Optimize image dimensions and give dimensions to browser.
            el('img#podd-img', { src : podcast.image, }),
            el('div.podd-text', [
                // Add podcast author if requested, otherwise leave it out.
                doTitle ? el('div#podd-title', [ podcast.author ]) : undefined,
                el('div#podd-ep', [ podcast.title ]),
                el('div#podd-time', [ podcast.duration + ' min' ])
            ]),
            el('div.podd-control.play', { 'onclick' : 'window.handlers.playPodcastHandler(event)' }),
            el('div#podd-dl')
        ])
        /**
         * When podd-play has been clicked, fetch parent to retrieve dataset.
         *
         *   function onPoddPlay(event) {
         *      var dataset = event.parent.dataset,
         *          program = dataset['podcast-program'],
         *          index = dataset['podcast-index']
         *      
         *      // app.programs is a map of fetched programs
         *      // program.podcasts is a list of available podcasts
         *
         *      // Something along the following lines:
         *          app.programs = {
         *              'kul med james' : {
         *                  ....,
         *                  podcasts : []
         *              }
         *          }
         *      
         *      // An example how to play the podcast:
         *      app.programs[program].podcasts[index].play()
         *  }
         */
    }

    /*
        FOOTER
        =======

      div#footer
          img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/12/Antje-Jack%C3%A9len.jpg&w=950&h=670&q=100&zc=1")#footer-img
          div.footer-text-container
              div#footer-title Studentaftonpodden
              div#footer-ep Antje Jackélen
              div#footer-time 32:26 / 76:00
          div#footer-btn.footer-play
    */

    function makeFooter(){
        return el('div#footer', [
            el('img', { src : 'www' }),
            el('div.footer-text-container', [
                el('div#footer-title', ['Studentaftonpodden']),
                el('div#footer-ep', ['Antje Jackélen']),
                el('div#footer-time', ['32:26 / 76:00'])
            ]),
            el('div#footer-btn.footer-play')
        ])
    }

    /*
        ??????
        ======


    div#wrapper
        div#slider
            div.page
                div.spotlight
                    img(src="/img/raf-bg2.png")#spotlight-img
                    div.title-bar alla program
                div.program-container
                    div.program-tabs
                        div.program-active A-Ö
                        div.program-inactive Kategorier
                    div.program-letter B
                    div.program.alternating
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/Programbild.jpg&w=950&h=670&q=100&zc=1").program-img
                        div.program-text-container
                          div.program-title Bäst Före Igår
                          div.program-category nöje & kultur
                          div.program-text 
                    div.program-letter C
                    div.program.alternating
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/correctobarcelona.png&w=950&h=670&q=100&zc=1").program-img
                        div.program-text-container
                          div.program-title Correcto
                          div.program-category samhälle
                          div.program-text 
            div.page
                div.spotlight
                    img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1")#spotlight-img
                    div.spotlight-container
                        div#spotlight-play 
                        div.spotlight-text-container
                            div#spotlight-title Studentaftonpodden
                            div#spotlight-ep Anna Kinberg Batra
                            div#spotlight-time 77 min
                        div#spotlight-dl
                    div.title-bar mina favoriter

                    div.fav-container
                        div.fav(data-program="klagomuren")#fav-0
                            img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/01/klagomuren.jpg&w=950&h=670&q=100&zc=1").fav-img
                            div.fav-title Klagomuren
                        div.fav(data-program="gronkult")#fav-1
                            img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/02/gk2.png&w=950&h=670&q=100&zc=1").fav-img
                            div.fav-title Grönkult
                        div.fav(data-program="ordgasm")#fav-2
                            img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/09/ordgasmbild2.png&w=950&h=670&q=100&zc=1").fav-img
                            div.fav-title Ordgasm
                        div.fav(data-program="etikpubspodden")#fav-3
                            img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/10981862_589948141139562_1758483936875843389_n.jpg&w=950&h=670&q=100&zc=1").fav-img
                            div.fav-title Etikpubspodden
                        div.fav(data-program="iluven")#fav-4
                            img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/09/I-Luv%C3%A9n-programbild.png&w=950&h=670&q=100&zc=1").fav-img
                            div.fav-title I Luvén
            div.page#flow
                div.spotlight
                    img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1")#spotlight-img
                    div.spotlight-container
                        div#spotlight-play 
                        div.spotlight-text-container
                            div#spotlight-title Studentaftonpodden
                            div#spotlight-ep Anna Kinberg Batra
                            div#spotlight-time 77 min
                        div#spotlight-dl
                    div.title-bar mitt flöde

                div.podd-container
                    // HERE BE PODDS
                    div.podd
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/10981862_589948141139562_1758483936875843389_n.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Etikpodden
                            div#podd-ep
                                |Den framtida människan

                            div#podd-time 77 min
                        div.podd-control.play
                        div.podd-dl

                    div.podd.alternating
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2014/12/Antje-Jack%C3%A9len.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Studentaftonpodden
                            div#podd-ep Studentafton med Antje Jackélen
                            div#podd-time 74 min
                        div.podd-control.play
                        div.podd-dl

                    div.podd
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/k%C3%A4rnkraft.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Etikpodden
                            div#podd-ep Kärnkraft
                            div#podd-time 77 min
                        div.podd-control.play
                        div.podd-dl

                    div.podd.alternating
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/02/Flugan_2.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Flugan
                            div#podd-ep FASHION
                            div#podd-time 12 min
                        div.podd-control.play
                        div.podd-dl
                    div.podd
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/10981862_589948141139562_1758483936875843389_n.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Etikpodden
                            div#podd-ep Den framtida människan
                            div#podd-time 77 min
                        div.podd-control.play
                        div.podd-dl

                    div.podd.alternating
                        img(src="http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/02/Flugan_2.jpg&w=950&h=670&q=100&zc=1")#podd-img
                        div.podd-text
                            div#podd-title Flugan
                            div#podd-ep FASHION
                            div#podd-time 12 min
                        div.podd-control.play
                        div.podd-dl
        */

    // Return an object b/c we need to append to slider, but append wrapper to
    // document.body
    function makeWrapper(){
        return { 
            wrapper : el('div#wrapper'),
            slider : el('div#slider')
        }
    }

    function makeFlowPage(){
        return el('div#flow.page', [
            el('div.spotlight'),
            el('div.podd-container')
        ])
    }
    
    GLOBAL.htmlFarm = {
        miniPod : function (podcast, alternate) { 
            return createPodcastDiv(podcast, true, alternate)
        },
        feedPod : function (podcast, alternate) {
            return createPodcastDiv(podcast, false, alternate)
        },

        staticTitleBar : function (){ return el('div#title-bar-fixed') },
        menuButton : function (){ return el('div#menu-btn') },

        flowPage : makeFlowPage,
        wrapper : makeWrapper,

        player : makeFooter,
        
        programView : createProgramView
    };
})(window)
