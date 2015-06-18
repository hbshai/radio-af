// TODO: Move all the stuff from index.jade:onStart to this...
var app = {
    // Application Constructor
    initialize: function() {
        this.audiop = new AudioPlayer();
        this.time = Date.now();
        this.bindEvents();
    },

    log: function(msg) {
        console.log("(+" + (Date.now() - app.time) + "ms) " + msg);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener("deviceready", this.onDeviceReady, false);
        document.addEventListener("touchmove", function(e) {
            e.preventDefault();
        }, false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
        document.removeEventListener("deviceready", app.onDeviceReady, false);

        //TODO: Make something useful with the back button
        document.addEventListener("backbutton", function() {}, false);

        app.log("deviceReady");
        app.onStart();
    },
};

app.onStart = function() {

    app.log("onstart");

    var wrapper = htmlFarm.wrapper(),
        slider = wrapper.slider;

    // TODO: Do DOM shit while we are loading RSS

    // Remove the loading div
    document.body.removeChild(document.getElementById("loading"));

    // Wrapper+slider loaded earlier
    var titleBar = htmlFarm.staticTitleBar(),
        player = htmlFarm.player(),
        menuButton = htmlFarm.menuButton(),
        menuDiv = htmlFarm.menu();

    wrapper = wrapper.wrapper;

    wrapper.appendChild(slider);

    // Add the permanent elements, i.e. header + footer
    document.body.appendChild(menuDiv);
    document.body.appendChild(menuButton);
    document.body.appendChild(titleBar);
    document.body.appendChild(player);

    // Finally setup the slider wrapper
    document.body.appendChild(wrapper);

    FastClick.attach(document.body);

    window.titlebar.init(titleBar);
    window.menu.init(menuDiv, menuButton, titleBar, player);
    window.app.audiop.init();
    window.dlman.init(function() {
        window.dlman.initialized = true;
    });

    app.scroller = new Scroll("#wrapper", player.offsetHeight);

    app.scroller.onScrollListener = window.titlebar.onScroll;
    app.scroller.onPageChangeListener = window.titlebar.onPageChange;

    console.log("Begin cache control");
    window.localStorage.clear();

    var cachedPrograms = window.cache.getCachedPrograms(),
        serverProgramList,
        done = false,
        cachedDone = 0,
        serverDone = 0,
        mustPatch = false;

    app.programs = {};

    app.views = {
        nodes: {},
        index: {},
        currentIndex: 0
    };
    function addView(name, el) {
        app.views.nodes[name] = el;
        app.views.index[name] = app.views.currentIndex++;
    }

    function bootstrap() {
        if (done) {
            return;
        }

        if (!window.dlman.initialized) {
            setTimeout(bootstrap, 250);
            console.log("not done yet");
            return;
        }
        console.log("Bootstrapping");

        done = true;
        var alla = htmlFarm.allProgramPage(),
            flow = htmlFarm.flowPage(),
            download = htmlFarm.downloadedPage(),
            favz = htmlFarm.favouritesPage();

        // Add to bookeeper
        addView("all-programs", alla);
        addView("flow", flow);
        addView("downloaded", download);
        addView("favourites", favz);

        // Add to DOM
        slider.appendChild(alla);
        slider.appendChild(flow);
        slider.appendChild(download);
        slider.appendChild(favz);

        app.scroller.refreshPages();
        setTimeout(window.app.scroller.recalcHeight.bind(window.app.scroller), 250);
        window.titlebar.onPageChange(app.scroller.pages[app.scroller.currentPage]);

        window.app.audiop.load();
    }

    function patch() {
        if (!window.dlman.initialized) {
            setTimeout(patch, 250);
            return;
        }

        console.log("Patching");
        // Patch will try to monkey-patch the views
        // Generate new divz
        var alla = htmlFarm.allProgramPage(),
            flow = htmlFarm.flowPage(),
            download = htmlFarm.downloadedPage(),
            favz = htmlFarm.favouritesPage();

        // Remove old divs
        for (k in app.views.nodes) {
            slider.removeChild(app.views.nodes[k]);
        }

        app.views.nodes = {};
        app.views.index = {};
        app.views.currentIndex = 0;

        // Add the permanent views 
        addView("all-programs", alla);
        addView("flow", flow);
        addView("downloaded", download);
        addView("favourites", favz);

        // Add to DOM
        slider.appendChild(alla);
        slider.appendChild(flow);
        slider.appendChild(download);
        slider.appendChild(favz);

        app.scroller.refreshPages();
        setTimeout(window.app.scroller.recalcHeight.bind(window.app.scroller), 250);
        window.titlebar.onPageChange(app.scroller.pages[app.scroller.currentPage]);
    }

    function loadedProgramFromCache(programKey) {
        // When all cached programs have been loaded start generating stuff
        cachedDone++;

        if (cachedDone === cachedPrograms.length) {
            bootstrap();
        }
    }

    var donePrograms = [];
    function loadedProgramFromServer(programKey) {
        serverDone++;
        donePrograms.push(programKey);
        var remaining = serverProgramList.filter(function(a) {
            return donePrograms.indexOf(a) === -1;
        });
        console.log(remaining);

        if (!done) {
            console.log("OK: " + serverDone);
            var progress = document.getElementById("progress-bar");
            if (!progress) {
                progress = document.createElement("h1");
                progress.setAttribute("id", "progress-bar");
                document.body.appendChild(progress);
            }
            progress.textContent = serverDone + "/" + serverProgramList.length;
            if (progress && serverDone === serverProgramList.length) {
                document.body.removeChild(progress);
            }
        }

        if (serverDone === serverProgramList.length) {
            if (!done) {
                bootstrap();
            } else if (mustPatch) {
                patch();
            }
        }
    }

    // Load cached programs
    cachedPrograms.forEach(function(programKey) {
        // Somehow the internet was faster :O
        if (app.programs[programKey]) {
            return;
        }

        console.log("Loading " + programKey + " from cache!");

        // Load program object (except podcasts)
        app.programs[programKey] = window.cache.getObject(programKey);

        // Load podcasts array
        app.programs[programKey].podcasts = window.cache.getObject(app.programs[programKey].podcasts);

        // Notify the world
        loadedProgramFromCache(programKey);
    });

    function rssDoneLoading(data, xml) {
        if (data.entries.length === 0) {
            console.log("Loaded " + this.program + ", but no podcasts: skipping... !!!!!!!!!!!!!!");
            window.app.programs[this.program] = undefined;
            delete window.app.programs[this.program];
            loadedProgramFromServer(programKey);
            return;
        }

        console.log("Loaded " + this.program + ", parsing...");
        // parse returns pre-emptively without durations
        var programKey = this.program,
            podcasts = rss.parse(data, xml, app.programs[programKey], withDuration);

        // Setup links
        app.programs[programKey].podcasts = podcasts;

        var tid = setTimeout(function() {
            console.log("Waited a long time for: " + programKey);
        }, 2000);

        // Copy duration when done, store in cache
        function withDuration(podcastsWithDur) {
            for (var i = 0, l = podcastsWithDur.length; i < l; i++) {
                podcasts[i].duration = podcastsWithDur[i].duration;
            }
            clearTimeout(tid);
            console.log("Durations loaded for " + programKey);

            // Cache this json!
            window.cache.putProgram(app.programs[programKey]);
            loadedProgramFromServer(programKey);
        }

        console.log("Parsed, waiting for duration (" + this.program + ")");
    }

    function mergeRSS(data, xml) {
        var programKey = this.program,
            serverLen = data.entries.length,
            cachedPodcasts = app.programs[programKey].podcasts,
            cacheLen = cachedPodcasts.length;

        if (serverLen === 0) {
            console.log("Loaded " + programKey + ", but no podcasts: skipping...");
            window.app.programs[programKey] = undefined;
            delete window.app.programs[this.program];
            loadedProgramFromServer(programKey);
            return;
        }

        if (cacheLen === serverLen) {
            // Assume nothing has happened :: incorrect but hey
            loadedProgramFromServer(programKey);
            return;
        }

        // Program exists in cache so try merge podcasts
        var serverPodcasts = rss.parse(data, xml, app.programs[programKey], withDuration),
            serverPods = serverPodcasts.map(function(e) {
                return e.title;
            }),
            cachePods = cachedPodcasts.map(function(e) {
                return e.title;
            }),
            i = 0;

        // Remove all programs currently present that isn't on server
        for (i = 0; i < cacheLen; i++) {
            if (serverPods.indexOf(cachePods[i]) === -1) {
                cachePods.splice(i, 1); // remove from comparision array
                cachedPodcasts.splice(i, 1); // remove from actual podcast array
                cacheLen--;
                i--;
                mustPatch = true;
            }
        }

        // Add all programs that exist on server but not in cache
        for (i = 0; i < serverLen; i++) {
            if (cachePods.indexOf(serverPods[i]) === -1) {
                cachePods.splice(i, 0, serverPods[i]); // add to comparision array
                cachedPodcasts.splice(i, 0, serverPodcasts[i]); // add to actual pod array
                mustPatch = true;
            }
        }

        // We are already updating the stuff in-place, but maybe this is needed.
        // window.app.programs[programKey].podcasts = cachedPodcasts

        // ::: ::: ::: ::: ::: ::: ::: ::: ::: ::: ::: ::: ::: :::
        var withDuration = function(podcastsWithDur) {
            if (podcastsWithDur.length) {
                console.log("something strange is going on?");
                return;
            }
            for (i = 0; i < serverLen; i++) {
                cachedPodcasts[i].duration = podcastsWithDur[i].duration;

            // Cache this json!
            }
            window.cache.putProgram(window.app.programs[programKey]);
            loadedProgramFromServer(programKey);
        };
    }

    // Fetch the server-side list of program names, images and rss
    // TODO: Use server side instead of local side
    $.getJSON("programs.json", function(data) {
        // data = { 'bestforeigar' : { name : 'walla', image : 'www', rss : 'www' }, ... }
        if (data) {
            serverProgramList = Object.keys(data);
            serverProgramList.forEach(function(programKey) {
                data[programKey].key = programKey;
                if (!app.programs[programKey]) {
                    app.programs[programKey] = data[programKey];
                    rss.load(data[programKey].rss, 100, rssDoneLoading.bind({
                        program: programKey
                    }));
                } else {
                    rss.load(data[programKey].rss, 100, mergeRSS.bind({
                        program: programKey
                    }));
                }
            });
        } else {
            console.error("no data received");
        }
    });
};
