(function(GLOBAL) {

    // Height and width set to @podcast-height etc.
    var imageRatio = 950 / 670;

    window.deviceStyle = {};
    window.deviceStyle.standardHeight = (window.matchMedia("(max-width: 414px)").matches ? 70 : 100);
    window.deviceStyle.standardWidth = Math.floor(window.deviceStyle.standardHeight * imageRatio);
    window.deviceStyle.maximumHeight = Math.floor((window.innerWidth) * (670 / 950) + 0.5);
    window.deviceStyle.favWidth = (window.matchMedia("(max-width: 414px)").matches ? 140 : 325);
    window.deviceStyle.favHeight = Math.floor((window.deviceStyle.favWidth * (670 / 950) + 0.5));

    var standardHeight = "h=" + window.deviceStyle.standardHeight,
        standardWidth = "w=" + window.deviceStyle.standardWidth,
        standardQuality = "q=" + 98,
        maximumHeight = "h=" + (window.deviceStyle.maximumHeight),
        maximumWidth = "w=" + window.innerWidth,
        maximumQuality = "q=" + 95,
        favWidth = "w=" + window.deviceStyle.favWidth,
        favHeight = "h=" + window.deviceStyle.favHeight,
        favQuality = "q=93";

    function resizeImage(src, hq) {
        src = src.replace(/w\=(\d)+/, hq ? maximumWidth : standardWidth)
            .replace(/h\=(\d)+/, hq ? maximumHeight : standardHeight)
            .replace(/q\=(\d)+/, hq ? maximumQuality : standardQuality);
        return src;
    }

    function favImageSize(src) {
        return src.replace(/w\=(\d)+/, favWidth)
            .replace(/h\=(\d)+/, favHeight)
            .replace(/q\=(\d)+/, favQuality);
    }
    window.fixImageUrl = resizeImage;

    // the dom wrapper for nice smeets
    // credits to: https://gist.github.com/neilj/1532562
    var el = (function() {
        var doc = document;

        var directProperties = {
            "class": "className",
            className: "className",
            defaultValue: "defaultValue",
            "for": "htmlFor",
            html: "innerHTML",
            text: "textContent",
            value: "value"
        };

        var booleanProperties = {
            checked: 1,
            defaultChecked: 1,
            disabled: 1,
            multiple: 1,
            selected: 1
        };

        var setProperty = function(el, key, value) {
            var prop = directProperties[key];
            if (prop) {
                el[prop] = (value == null ? "" : "" + value);
            } else if (booleanProperties[key]) {
                el[key] = !!value;
            } else if (value == null) {
                el.removeAttribute(key);
            } else {
                el.setAttribute(key, "" + value);
            }
        };

        var appendChildren = function(el, children) {
            var i, l, node;
            for (i = 0, l = children.length; i < l; i += 1) {
                node = children[i];
                if (node) {
                    if (node instanceof Array) {
                        appendChildren(el, node);
                    } else {
                        if (typeof node === "string") {
                            node = doc.createTextNode(node);
                        }
                        el.appendChild(node);
                    }
                }
            }
        };

        var splitter = /(#|\.)/;

        var create = function(tag, props, children) {
            if (props instanceof Array) {
                children = props;
                props = null;
            }

            var parts, name, el,
                i, j, l, node, prop;

            if (splitter.test(tag)) {
                parts = tag.split(splitter);
                tag = parts[0];
                if (!props) {
                    props = {};
                }
                for (i = 1, j = 2, l = parts.length; j < l; i += 2, j += 2) {
                    name = parts[j];
                    if (parts[i] === "#") {
                        props.id = name;
                    } else {
                        props.className = props.className ?
                            props.className + " " + name : name;
                    }
                }
            }

            el = doc.createElement(tag);
            if (props) {
                for (prop in props) {
                    setProperty(el, prop, props[prop]);
                }
            }
            if (children) {
                appendChildren(el, children);
            }
            return el;
        };

        return create;

    }());

    // This creates the view for a particular program; i.e the one that pops up
    // when you click on a favourite pod, or on a program listed in the "Alla program"
    // view
    function createProgramView(podcasts) {
        var firstPod = podcasts[0];
        var counter = 0;
        var messages = ["#slutpåpoddar", "inga fler poddar!", "ensam lyssnare söker podd"];
        var msg = messages[Math.floor(Math.random() * messages.length)];

        var podNotice = el("div.end-of-list", [msg]);

        return el("div.page", [
            el(window.favs.containsProgram(firstPod.author) ? "div.fav-heart-red" : "div.fav-heart", {
                "data-podcast-program": firstPod.author,
                "onclick": "window.handlers.handleFav(event)"
            }),
            createSpotlight(firstPod.program, firstPod, true),
            populatePageWithPodcasts(podcasts, true),
            podcasts.length <= 1 ? podNotice : el("div")
        ]);
    }

    // podcast : podcast to generate
    // doTitle : generate a podd-title div?
    // alternate : append .alternating class?
    function createPodcastDiv(podcast, doTitle, alternate) {
        // offline mode stuff
        var hash = podcast.author + podcast.title,
            poddAvailable = !window.hasNoInternet() || window.dlman.has(hash),
            dlElement = undefined;
        // create podd-dl if we have internet, or podd-remove if we've previously
        // downloaded the podd
        if (poddAvailable) {
            dlElement = el("div.podd-dl"
                + (window.dlman.has(hash) ? ".podd-remove" : "")
                + (window.dlman.downloading(hash) ? ".podd-queue" : "")
                + (window.dlman.queued(hash) ? ".podd-queue" : ""), {
                    "onclick": "window.handlers.handleDownloadButton(event)"
                });
        } else {
            dlElement = el("div");
        }

        return el("div.podd" + (alternate ? ".alternating" : ""), {
            // Allow each div to carry its own pointer(s) to the podcast.
            // See comment further down how they (could) work.
            "data-podcast-program": podcast.author,
            "data-podcast-index": podcast.index,
            "onclick": "window.handlers.expandPodcast(event)"
        }, [
            el("div.podd-container.flexme", [
                el("img#podd-img", {
                    src: (window.hasNoInternet() ? resizeImage("img/player-placeholder-img-black.png") : resizeImage(podcast.image || window.app.programs[podcast.author].image)),
                    "style": "width: " + window.deviceStyle.standardWidth + "px;"
                }),
                el("div.podd-text.flexme", [
                    // Add podcast author if requested, otherwise leave it out.
                    doTitle ? el("div#podd-title", [podcast.program]) : undefined,
                    el("div#podd-ep" + (doTitle ? ".two-line" : ""), [podcast.title]),
                    el("div#podd-time", [Math.floor(podcast.duration / 60) + " min"])
                ]),
                dlElement,
                // if podd isn't available (offline & not downloaded) -> grey out the play button
                el("div.podd-control.play" + (poddAvailable ? "" : ".grey-out-bg"), {
                    "onclick": "window.handlers.playPodcastHandler(event)"
                })
            ]),
            el("div.podd-ep-text", [podcast.content])
        ]);
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

    function makeFooter() {
        return el("div#footer.lefty", {
            "onclick": "window.handlers.togglePlayerSlider(event)"
        }, [
            el("div.footer-container.flexme", [
                el("img#footer-img", {
                    src: "img/player-placeholder-img.png"
                }),
                el("div.footer-text-container.flexme", [
                    el("div#footer-title", ["inget program valt"]),
                    el("div#footer-ep", ["ingen podd vald"]),
                    el("div#footer-time", ["-- / --"])
                ]),
                el("div#footer-btn.footer-pause", {
                    "onclick": "window.handlers.playerControlHandler(event)"
                })
            ]),
            el("div.slider", [
                el("div#seekbar.noUi-extended")
            ])
        ]);
    }

    function makeProgramListingDiv(program, alternate, isAlphabeticView) {
        return el("div.program" + (alternate ? ".alternating" : ""), {
            "data-podcast-program": program.key,
            "onclick": "window.handlers.expandText(event)"
        }, [
            el("div.program-container.flexme", [
                el("img.program-img", {
                    src: (window.hasNoInternet() ? resizeImage("img/player-placeholder-img-black.png") : resizeImage(program.image)),
                    style: "width: " + window.deviceStyle.standardWidth + "px"
                }),
                el("div.program-text-container.flexme", [
                    el("div.program-title", [program.name]),
                    // only include category div when sorting programs alphabetically
                    isAlphabeticView ? el("div.program-category" + (alternate ? ".alternating" : ""), [program.category || "Unknown"]) : [""],
                    el("div.program-disclaimer", ["läs om programmet"])
                ]),
                el("div.program-chevron", {
                    onclick: "window.handlers.openProgramView(event)"
                }),
            ]),
            el("div.program-text", [program.description || "beskrivning saknas för det här programmet"])
        ]);
    }

    function sortByName(a, b) {
        // Use localeCompare which supports Swedish chars
        return a.toLowerCase().localeCompare(b.toLowerCase());
    }
    function flatten(a, b) {
        return a.concat(b);
    }

    function makeAllProgramPage() {
        var currentSymbol = "",
            alternate = true;

        // This makes the A-to-O setup, should probably be stored somehow
        var listByName = Object.keys(app.programs).sort(sortByName)
            .map(function(program) {
                // Symbol is the header: 'A' for 'Alla ska med', 'B' for 'Bara ren sprit', etc..
                var programSymbol = program.charAt(0).toUpperCase();
                // If symbol is numeric; force symbol to be '123'
                if (!isNaN(programSymbol)) {
                    programSymbol = "123";
                }

                // If we need new symbol, return array
                if (currentSymbol !== programSymbol) {
                    currentSymbol = programSymbol;
                    var symbolEl = el("div.program-letter" + (alternate ? ".alternating" : ""), [currentSymbol]);
                    var programDiv = makeProgramListingDiv(app.programs[program], !alternate, true);
                    return [symbolEl, programDiv];
                } else {
                    var programDiv = makeProgramListingDiv(app.programs[program], alternate, true);
                    alternate = !alternate;
                    // Otherwise just return the program
                    return [programDiv];
                }
            })
            .reduce(flatten);

        var categories = {};

        // First populate the categories object with lists of programs per category
        Object.keys(app.programs).forEach(function(progkey) {
            var cat = app.programs[progkey].category;

            if (!categories[cat]) {
                categories[cat] = [];
            }

            categories[cat].push(progkey);
        });

        // Then sort the categories and generate lists of programs (sorted) for each category
        alternate = false;
        var listByCategories = Object.keys(categories).sort(sortByName)
            .map(function(category) {
                alternate = !alternate;
                var categoryEl = el("div.program-category-title" + (alternate ? ".alternating" : ""), [category]),
                    programList = categories[category].sort(sortByName)
                        .map(function(program) {
                            alternate = !alternate;
                            return makeProgramListingDiv(app.programs[program], alternate, false);
                        });
                // Insert category element at index 0
                programList.splice(0, 0, categoryEl);
                return programList;
            })
            .reduce(flatten);

        // Super shitty, but works for now... (probably not THAT bad)
        window.lists = {
            byName: listByName,

            /* byNameHTML : listByName
                .map(function (el){ return el.outerHTML })
                .reduce(function (a, b){ return a + b }),
            */

            byCategory: listByCategories
        /* ,byCategoryHTML : listByCategories
            .map(function (el){ return el.outerHTML })
            .reduce(function (a, b){ return a + b })
        */
        };

        // this view's spotlight is unique in that it only shows the RAF logo
        return el("div.page", [
            createSpotlight("alla program"),
            el("div.program-container", [
                el("div.program-tabs", [
                    el("div#toggleName.program-active", {
                        "onclick": "window.handlers.toggleProgramPane(event)"
                    }, ["A-Ö"]),
                    el("div#toggleCategory.program-inactive", {
                        "onclick": "window.handlers.toggleProgramPane(event)"
                    }, ["Kategorier"])
                ]),
                listByName
            ])
        ]);
    }

    // Return an object b/c we need to append to slider, but append wrapper to
    // document.body
    function makeWrapper() {
        return {
            wrapper: el("div#wrapper"),
            slider: el("div#slider")
        };
    }

    function makeFlowPage() {
        var counter = 0,
            alternate = true,
            favs = window.favs.getFavs();

        if (favs.length === 0) {
            return el("div#flow.page", {
                "onclick": "window.handlers.goToAllProgramsView(event)"
            }, [
                createSpotlight("mitt flöde"),
                el("div.empty-flow-top", ["Här visas de senaste poddarna från dina favoritprogram"]),
                el("div.empty-flow-text", ["Tryck var som helst för att börja leta favoritprogram"]),
            ]);
        } else {
            favs = favs.map(function(key) {
                return window.app.programs[key].podcasts;
            }).reduce(flatten).sort(function(a, b) {
                var dateA = new Date(a.date),
                    dateB = new Date(b.date);
                return dateB - dateA;
            }).filter(function(pod) {
                return counter++ < 25; // max 25 podcasts
            });

            return el("div#flow.page", [
                (favs.length > 0 ? createSpotlight("flödet", favs.shift()) : createSpotlight("flödet")),
                el("div.podd-container", favs.map(function(podcast) {
                    return createPodcastDiv(podcast, true, (alternate = !alternate));
                }))
            ]);
        }
    }

    function makeInfoPage() {
        return el("div.page",
            {
                "onclick": "window.handlers.handleInfoClick(event)"
            }, [
                createSpotlight("utvecklat av"),
                el("img.shai-img", {
                    src: "img/shai-devs-named.png"
                }),
                el("div.info-container", [
                    el("div.devs-container", [
                        el("div.shai", ["shai"]),
                        el("div.small-info-text", ["det vill säga"]),
                        el("div.devs", [
                            el("div.info-element", ["Alexander Cobleigh &"]),
                            el("div.info-element", ["Axel Smeets"]),
                            el("div.small-info-text", ["för mer info se designbyshai.se"])
                        ]),
                    ]),
                    el("div.info-credits", ["credits"]),
                    el("div.info-credits-container", [
                        el("div.info-element", ["Apache Cordova + PhoneGap"]),
                        el("div.info-element", ["Neil Jenkins för Sugared DOM"]),
                        el("div.info-element", ["LHS"])
                    ])
                ])
            ]);
    }


    function makeDownloadPage() {
        var downloadedPods = Object.keys(window.app.programs).map(function(key) {
            return window.app.programs[key].podcasts;
        }).reduce(flatten).filter(function(pod) {
            return pod != undefined && window.dlman.has(pod.author + pod.title);
        });

        if (downloadedPods.length > 0) {
            return el("div.page", [
                createSpotlight("nedladdade poddar", downloadedPods.shift()),
                populatePageWithPodcasts(downloadedPods, false),
                (downloadedPods.length <= 0 ? el("div.end-of-list", ["...tomt"]) : el("div"))
            ]);
        } else {
            return el("div.page", [
                createSpotlight("nedladdade poddar"),
                el("div.empty-flow-top", ["Här samlas dina nedladdade poddar"]),
                el("div.empty-flow-text", ["Tryck på ", el("div.dl-message-icon"), " för att ladda ned en podd"]),
            ]);
        }
    }

    function makeFavPage() {
        function createFavourites(favs) {
            // the list which will contain the generated fav divs
            var favList = [];
            favs.forEach(function(key) {
                var fav = window.app.programs[key];
                if (fav === undefined) {
                    return;
                }

                favList.push(el("div.fav", {
                    "data-podcast-program": fav.key,
                    "onclick": "window.handlers.openProgramView(event)"
                }, [
                    el("img.fav-img", {
                        src: (window.hasNoInternet() ? "img/player-placeholder-img-black-2x.png" : favImageSize(fav.image)),
                        style: "height: " + window.deviceStyle.favHeight + "px"
                    }),
                    el("div.fav-title", [fav.name])
                ]));
            });
            return el("div.fav-container", favList);
        }

        var favs = window.favs.getFavs();
        if (favs.length > 0) {
            // randomly pick a pod from the favourited programs to spotlight
            var spotlightProgram = favs[Math.floor(favs.length * Math.random())];
            var spotlightPod = window.app.programs[spotlightProgram].podcasts[0];

            return el("div.page", [
                createSpotlight("mina favoriter", spotlightPod),
                createFavourites(favs)
            ]);
        } else {
            return el("div.page", {
                "onclick": "window.handlers.goToAllProgramsView(event)"
            }, [
                createSpotlight("mina favoriter"),
                el("div.no-favs-title", ["ojsan, här var det tomt"]),
                el("div.no-favs-text", ["Tryck var som helst för att börja leta favoritprogram"])
            ]);
        }
    }

    function populatePageWithPodcasts(podcasts, isProgramPage) {
        var alternate = false;
        return el("div.podd-container", podcasts.map(function(pod, i) {
            alternate = !alternate;
            // Skip first podcast because it is spotlight town
            return (i === 0 && isProgramPage) ? undefined : createPodcastDiv(pod, !isProgramPage, alternate);
        }));
    }

    function createSpotlight(title, podcast, isProgramView) {
        // no pod => radio af logo background
        if (arguments.length === 1) {
            return el("div.spotlight", [
                el("img#spotlight-img", {
                    src: "img/raf-bg2.png",
                    style: "height: " + window.deviceStyle.maximumHeight + "px;"
                }),
                el("div.title-bar", [
                    el("p", [title])
                ])
            ]);
        }

        var programImage = window.app.programs[podcast.author].image,
            image = isProgramView ? programImage : (podcast.image || programImage);

        var hash = podcast.author + podcast.title,
            poddAvailable = !window.hasNoInternet() || window.dlman.has(hash);
        // create podd-dl if we have internet, or podd-remove if we've previously
        // downloaded the podd
        if (poddAvailable) {
            var dlElement = el("div.spotlight-dl"
                + (window.dlman.has(hash) ? ".spotlight-remove" : "")
                + (window.dlman.downloading(hash) ? ".spotlight-queue" : "")
                + (window.dlman.queued(hash) ? ".spotlight-queue" : ""), {
                    "onclick": "window.handlers.handleDownloadButton(event)"
                });
        } else {
            var dlElement = el("div");
        }

        return el("div.spotlight", {
            "data-podcast-program": podcast.author,
            "data-podcast-index": podcast.index
        }, [
            el("img#spotlight-img", {
                src: (window.hasNoInternet() ? "img/raf-bg2.png" : resizeImage(image, true)),
                "style": "height: " + window.deviceStyle.maximumHeight + "px;"
            }),
            el("div.spotlight-container.flexme", [
                el("div#spotlight-play" + (poddAvailable ? "" : ".grey-out-bg"), {
                    "onclick": "window.handlers.spotlightHandler(event)"
                }),
                el("div.spotlight-text-container.flexme", [
                    el("div#spotlight-title", [podcast.program]),
                    el("div#spotlight-ep", [podcast.title]),
                    el("div#spotlight-time", [Math.floor(podcast.duration / 60) + " min"])
                ]),
                dlElement,
            ]),
            el("div.title-bar", [
                el("p", [title])
            ])
        ]);
    }

    function makeMenu() {

        return el("div.menu.lefty", [
            el("div#menuFlow.menu-item.menu-item-flode", {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["flödet"]),
            el("div#menuAlla.menu-item.menu-item-allap", {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["alla program"]),
            el("div#menuDl.menu-item.menu-item-dl", {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["nedladdade"]),
            el("div#menuFav.menu-item.menu-item-fav", {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["favoriter"]),
            el("div#menuLive.menu-item.menu-item-live" + (window.hasNoInternet() ? ".grey-out" : ""), {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["direkt"]),
            el("d.menu-logo"),
            el("div#menuDev.menu-footer", {
                "onclick": "window.handlers.handleMenuButton(event)"
            }, ["om appen"])
        ]);
    }

    GLOBAL.htmlFarm = {
        miniPod: function(podcast, alternate) {
            return createPodcastDiv(podcast, true, alternate);
        },
        feedPod: function(podcast, alternate) {
            return createPodcastDiv(podcast, false, alternate);
        },

        staticTitleBar: function() {
            return el("div#title-bar-fixed.lefty", [el("p.fixed-content")]);
        },
        menuButton: function() {
            return el("div#menu-btn.lefty", {
                onclick: "window.menu.show(event)"
            });
        },
        menu: makeMenu,

        flowPage: makeFlowPage,
        infoPage: makeInfoPage,
        favouritesPage: makeFavPage,
        downloadedPage: makeDownloadPage,

        wrapper: makeWrapper,
        player: makeFooter,

        programView: createProgramView,
        allProgramPage: makeAllProgramPage
    };
})(window);
