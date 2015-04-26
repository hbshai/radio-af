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
                el('div#pod-ep', [ podcast.title ]),
                el('div#podd-time', [ podcast.duration + ' min' ])
            ]),
            el('div#podd-play'),
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
    
    GLOBAL.htmlFarm = {
        miniPod : function (podcast, alternate) { 
            return createPodcastDiv(podcast, true, alternate)
        },
        // huehuehuehue
        feedPod : function (podcast, alternate) {
            return createPodcastDiv(podcast, false, alternate)
        }
    };
})(window)