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
                el(window.favs.containsProgram(firstPod.author) ? "div.fav-heart-red" : "div.fav-heart", { 
                    'data-podcast-program' : firstPod.author,
                    'onclick' : 'window.handlers.handleFav(event)'
                }),
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
            'data-podcast-program' : podcast.author,
            'data-podcast-index' : podcast.index,
            'onclick': 'window.handlers.expandPodcast(event)'
        }, [
            // TODO: Optimize image dimensions and give dimensions to browser.
            el("img#podd-img", { src : podcast.image, }),
            el("div.podd-text", [
                // Add podcast author if requested, otherwise leave it out.
                doTitle ? el("div#podd-title", [ podcast.program ]) : undefined,
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

    // TODO: select first available podd and fill player with?
    function makeFooter(){
        return el("div#footer.lefty", [
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
                    el("div.program-container.flexme", [
                        el("img.program-img", { src : program.image }),
                        el("div.program-text-container.flexme", [
                            el("div.program-title", [program.name]),
                            // only include category div when sorting programs alphabetically
                            isAlphabeticView ?  el("div.program-category" + (alternate ? ".alternating" : ""), [program.category || "Unknown"]) : [""],
                            el("div.program-disclaimer", ["läs om programmet"])
                        ]),
                        el("div.program-chevron", { onclick: 'window.handlers.openProgramView(event)'}),
                    ]),
                    el("div.program-text", [program.description || "beskrivning saknas för det här programmet"])
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
        var currentSymbol = "", alternate = true;
        // This makes the A-to-O setup, should probably be stored somehow

        var listByName = Object.keys(app.programs).sort(sortByName)
            .map(function (program){
                // Symbol is the header: 'A' for 'Alla ska med', 'B' for 'Bara ren sprit', etc..
                var programSymbol = program.charAt(0).toUpperCase();
                // If symbol is numeric; force symbol to be '123'
                if (!isNaN(programSymbol))
                    programSymbol = "123";

                // If we need new symbol, return array
                if (currentSymbol !== programSymbol){
                    currentSymbol = programSymbol;
                    var symbolEl = el("div.program-letter" + (alternate ? ".alternating" : ""), [currentSymbol])
                    var programDiv = makeProgramListingDiv(app.programs[program], !alternate, true)
                    return [symbolEl, programDiv]
                } else {
                    var programDiv = makeProgramListingDiv(app.programs[program], alternate, true)
                    alternate = !alternate
                    // Otherwise just return the program
                    return [programDiv]
                }
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

        // this view's spotlight is unique in that it only shows the RAF logo
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
       function createFavourites(favs) {
           // the list which will contain the generated fav divs
           var favList = [];
           favs.forEach(function(key) {
               var fav = window.app.programs[key];
               favList.push(el("div.fav", { 
                   'data-podcast-program' : fav.key,
                   'onclick' : 'window.handlers.openProgramView(event)'
               }, [
                       el("img.fav-img", {src: fav.image}),
                       el("div.fav-title", [fav.name])
                   ])
                )
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
       var favs = window.favs.getFavs();
       // TODO: remove placeholder favs 
       favs = ["iluven", "ordgasm", "vinnaren"]
       if (favs.length > 0) {
           // randomly pick a pod from the favourited programs to spotlight
           var spotlightProgram = favs[Math.floor(favs.length * Math.random())];
           var spotlightPod = window.app.programs[spotlightProgram].podcasts[0];

           return el("div.page", [
                createSpotlight("mina favoriter", pod),
                createFavourites(favs)
            ])
       } else {
           // TODO: Display "oops no favs" view
           return el("div.page", [
                createSpotlight("inga favoriter rip", pod)
            ])
       }
    }

    function populatePageWithPodcasts(podcasts, isProgramPage) {
        var alternate = false;
        return el("div.podd-container", podcasts.map(function (pod){
            alternate = !alternate;
            return createPodcastDiv(pod, !isProgramPage, alternate);
        }));
    }

    function createSpotlight(title, podcast, isProgramView) {
       return el("div.spotlight", {
                "data-podcast-program" : podcast.author,
                "data-podcast-index" : podcast.index
               }, [
                    el("img#spotlight-img", {src: isProgramView ? podcast.programImage : podcast.image}),
                    el("div.spotlight-container.flexme", [
                        el("div#spotlight-play", {'onclick' : 'window.handlers.spotlightHandler(event)'}),
                        el("div.spotlight-text-container.flexme", [
                            el("div#spotlight-title", [podcast.program]),
                            el("div#spotlight-ep", [podcast.title]),
                            el("div#spotlight-time", ["0 min"])
                        ]),
                        el("div#spotlight-dl"),
                    ]),
                    el("div.title-bar", [title])
                ])
    }

    function makeMenu(){
        return el("div.menu.lefty", [
            el("p.menu-item.menu-item-flode", ["flödet"]),
            el("p.menu-item.menu-item-allap", ["alla program"]),
            el("p.menu-item.menu-item-dl", ["nedladdade"]),
            el("p.menu-item.menu-item-fav", ["favoriter"]),
            el("p.menu-item.menu-item-live", ["direkt"]),

            el("p.menu-logo"),
            el("p.menu-footer", ["developed by cobleigh & smeets"]),
        ]);
    }
    
    GLOBAL.htmlFarm = {
        miniPod : function (podcast, alternate) { 
            return createPodcastDiv(podcast, true, alternate);
        },
        feedPod : function (podcast, alternate) {
            return createPodcastDiv(podcast, false, alternate);
        },

        staticTitleBar : function (){ return el("div#title-bar-fixed.lefty"); },
        menuButton : function (){ return el("div#menu-btn.lefty", { onclick : "window.menu.show(event)" }); },
        menu : makeMenu,

        flowPage : makeFlowPage,
        favouritesPage: makeFavPage,
        downloadedPage: makeDownloadPage,

        wrapper : makeWrapper,
        player : makeFooter,
        
        programView : createProgramView,
        allProgramPage : makeAllProgramPage
    };
})(window)
