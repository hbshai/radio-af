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

        return el("div.page", [
                el("div.fav-heart"),
                createSpotlight(firstPod.program, firstPod, true),
                populatePageWithPodcasts(podcasts, true)
              ]);
    }

    // podcast : podcast to generate
    // doTitle : generate a podd-title div?
    // alternate : append .alternating class?
    function createPodcastDiv(podcast, doTitle, alternate) {
        return el("div.podd" + (alternate ? ".alternating" : ""), { 
            // Allow each div to carry its own pointer(s) to the podcast.
            // See comment further down how they (could) work.
            'data-podcast-program' : podcast.program,
            'data-podcast-index' : podcast.index,
            'onclick': 'window.handlers.expandPodcast(event)'
        }, [
            // TODO: Optimize image dimensions and give dimensions to browser.
            el("img#podd-img", { src : podcast.image, }),
            el("div.podd-text", [
                // Add podcast author if requested, otherwise leave it out.
                doTitle ? el("div#podd-title", [ podcast.author ]) : undefined,
                el("div#podd-ep", [ podcast.title ]),
                el("div#podd-time", [ Math.floor(podcast.duration/60) + " min" ])
            ]),
            el("div.podd-control.play", { 'onclick' : 'window.handlers.playPodcastHandler(event)' }),
            window.dlman.has(podcast.program + podcast.index) ? el("div.podd-dl") : el("div.podd-dl"),
            el("div.podd-ep-text", ["bblalalalal lots of pod description right here yaaaablalalalal lots of pod description right here yaaaablalalalal lots of pod description right here yaaaalalalalal lots of pod description right here yaaaa"])
        ])
        /**
         * When podd-play has been clicked, fetch parent to retrieve dataset.
         *
         *   function onPoddPlay(event) {
         *      var dataset = event.parent.dataset,
         *          program = dataset["podcast-program"],
         *          index = dataset["podcast-index"]
         *      
         *      // app.programs is a map of fetched programs
         *      // program.podcasts is a list of available podcasts
         *
         *      // Something along the following lines:
         *          app.programs = {
         *              "kul med james" : {
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

    // TODO: select first available podd and fill player with?
    function makeFooter(){
        return el("div#footer", [
            el("img#footer-img", { src : '../img/player-placeholder-img.png' }),
            el("div.footer-text-container", [
                el("div#footer-title", ["inget program valt"]),
                el("div#footer-ep", ["inget avsnitt valt"]),
                el("div#footer-time", ["--/--"])
            ]),
            el("div#footer-btn.footer-pause", { 'onclick' : 'window.handlers.playerControlHandler(event)'})
        ])
    }

    function makeProgramListingDiv(program, alternate, isAlphabeticView){
        return el("div.program" + (alternate ? ".alternating" : ""), {
                'data-podcast-program' : program.key, 
                'onclick': 'window.handlers.expandText(event)'
                }, [
                    el("img.program-img", { src : program.image }),
                    el("div.program-text-container", [
                        el("div.program-title", [program.name]),
                        // only include category div when sorting programs alphabetically
                        isAlphabeticView ?  el("div.program-category", [program.category || "Unknown"]) : [""],
                        el("div.program-disclaimer", ["läs om programmet"])
                        ]),
                    el("div.program-chevron", { onclick: 'window.handlers.openProgramView(event)'}),
                    el("div.program-text", ["xx files music all day every day. ba ba ba ba b ab ba ba baaaaa - ba ba ba ba bá báaa - babababaababa - ba ba ba bá bà báaaax files music all day every day. ba ba ba ba b ab ba ba baaaaa - ba ba ba ba bá báaa - babababaababa - ba ba ba bá bà báaaa files music all day every day. ba ba ba ba b ab ba ba baaaaa - ba ba ba ba bá báaa - babababaababa - ba ba ba bá bà báaaa"])
                ])
    }

    function sortByName(a, b){
        // Use localeCompare which supports Swedish chars
        return a.toLowerCase().localeCompare(b.toLowerCase())
    }
    function flatten(a, b){
        return a.concat(b)
    }
    function makeAllProgramPage(){
        var currentSymbol = "", alternate = false
        // This makes the A-to-O setup, should probably be stored somehow

        var listByName = Object.keys(app.programs).sort(sortByName)
            .map(function (program){
                var programDiv = makeProgramListingDiv(app.programs[program], alternate, true)
                alternate = !alternate

                // If we need new symbol, return array
                if (currentSymbol !== program.charAt(0).toUpperCase()){
                    currentSymbol = program.charAt(0).toUpperCase()
                    // TODO: dunno if we wanna do this
                    // set categories that start with numbers to "123"
                    // if (!isNaN(currentSymbol)) {
                    //     currentSymbol = "123";
                    // }
                    var symbolEl = el("div.program-letter" + (alternate ? ".alternating" : ""), [currentSymbol])
                    alternate = !alternate
                    return [symbolEl, programDiv]
                }

                // Otherwise just return the program
                return [programDiv]
            })
            .reduce(flatten)

        var categories = {}

        // First populate the categories object with lists of programs per category
        Object.keys(app.programs).forEach(function (progkey){
            var cat = app.programs[progkey].category
            
            if (!categories[cat])
                categories[cat] = []

            categories[cat].push(progkey)
        })
        
        // Then sort the categories and generate lists of programs (sorted) for each category
        alternate = false;
        var listByCategories = Object.keys(categories).sort(sortByName)
            .map(function (category){
                alternate = !alternate
                var categoryEl = el("div.program-category-title" + (alternate ? ".alternating" : ""), [category]),
                    programList = categories[category].sort(sortByName)
                        .map(function(program){
                            alternate = !alternate
                            return makeProgramListingDiv(app.programs[program], alternate, false)
                        })
                // Insert category element at index 0
                programList.splice(0, 0, categoryEl)
                return programList
            })
            .reduce(flatten)

        // Super shitty, but works for now...
        window.lists = {
            byName : listByName,
            
            /* byNameHTML : listByName
                .map(function (el){ return el.outerHTML })
                .reduce(function (a, b){ return a + b }),
            */
            
            byCategory : listByCategories
            /* ,byCategoryHTML : listByCategories
                .map(function (el){ return el.outerHTML })
                .reduce(function (a, b){ return a + b })
            */
        }

        return el("div.page", [
            el("div.spotlight", [
                el("img#spotlight-img", { src : 'img/raf-bg2.png' }),
                el("div.title-bar", ["alla program"])
            ]),
            el("div.program-container", [
                el("div.program-tabs", [
                    el("div#toggleName.program-active", { 'onclick' : 'window.handlers.toggleProgramPane(event)' }, ["A-Ö"]),
                    el("div#toggleCategory.program-inactive", { 'onclick' : 'window.handlers.toggleProgramPane(event)' }, ["Kategorier"])
                ]),
                listByName
            ])
        ])
    }

    /*
    
    div#wrapper
        div#slider
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
        */

    // Return an object b/c we need to append to slider, but append wrapper to
    // document.body
    function makeWrapper(){
        return { 
            wrapper : el("div#wrapper"),
            slider : el("div#slider")
        }
    }

    function makeFlowPage(){
        return el("div#flow.page", [
            el("div.spotlight", [
                el("div.title-bar", ["mitt flöde"])
            ]),
            el("div.podd-container")
            // use window.flow.podcasts to fill it or something...
        ])
    }

    function makeDownloadPage() {
       var pod = {
                title : 'spotlight title text',
                program: 'Studentaftonpodden',
                author: 'Studentaftonpodden',
                image: 'http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1',
                programImage: 'http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1',
                duration: '0 min'
       };
       var podcasts = [pod, pod, pod, pod, pod];

       return el("div.page", [
                createSpotlight("nedladdade poddar", pod),
                populatePageWithPodcasts(podcasts, false)
              ]);
    }

    function makeFavPage() {
        // TODO: 
        // * populate with favs from device, otherwise display "oops no favs" view instead
       function createFavourites(favs) {
           var favList = [];
           var counter = 0;
           favs.forEach(function(fav) {
               favList.push(el("div.fav", { 
                   'data-podcast-program' : fav.program,
                   'onclick' : 'window.handlers.openProgramView(event)'
               }, [
                       el("img.fav-img", {src: fav.programImage}),
                       el("div.fav-title", [fav.title])
                   ])
                )
           counter = counter + 1;
           });
           return el("div.fav-container", favList);
       }

       var pod = {
                title : 'spotlight title text',
                program: 'Studentaftonpodden',
                image: 'http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1',
                programImage: 'http://www.radioaf.se/wp-content/themes/base/library/includes/timthumb.php?src=/wp-content/uploads/2015/03/11025258_10155328251370078_610654045703850591_o.jpg&w=950&h=670&q=100&zc=1',
                duration: '0 min'
       };

       var podcasts = [pod, pod, pod, pod, pod];
       return el("div.page", [
                createSpotlight("mina favoriter", pod),
                createFavourites(podcasts)
              ])
    }

    function populatePageWithPodcasts(podcasts, isProgramPage) {
        var elementList = [];
        var alternate = false;
        podcasts.forEach(function(pod) {
            alternate = !alternate;
            elementList.push(createPodcastDiv(pod, !isProgramPage, alternate));
        });
        return el("div.podd-container", elementList);
    }

    function createSpotlight(title, podcast, isProgramView) {
       return   el("div.spotlight", {
                "data-podcast-program" : podcast.program,
                "data-podcast-index" : podcast.index
               }, [
                    el("img#spotlight-img", {src: isProgramView ? podcast.programImage : podcast.image}),
                    el("div.spotlight-container", [
                        el("div#spotlight-play", {'onclick' : 'window.handlers.playPodcastHandler(event)'}),
                        el("div.spotlight-text-container", [
                            el("div#spotlight-title", [podcast.program]),
                            el("div#spotlight-ep", [podcast.title]),
                            el("div#spotlight-time", ["0 min"])
                        ]),
                        el("div#spotlight-dl"),
                    ]),
                    el("div.title-bar", [title])
                ])
    }
    
    GLOBAL.htmlFarm = {
        miniPod : function (podcast, alternate) { 
            return createPodcastDiv(podcast, true, alternate)
        },
        feedPod : function (podcast, alternate) {
            return createPodcastDiv(podcast, false, alternate)
        },

        staticTitleBar : function (){ return el("div#title-bar-fixed") },
        menuButton : function (){ return el("div#menu-btn") },

        flowPage : makeFlowPage,
        favouritesPage: makeFavPage,
        downloadedPage: makeDownloadPage,

        wrapper : makeWrapper,
        player : makeFooter,
        
        programView : createProgramView,
        allProgramPage : makeAllProgramPage
    };
})(window)
