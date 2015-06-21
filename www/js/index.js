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

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
        window.dlman.initialized = true;
        window.dlman.init(fs);
        window.cache.init(fs, function (){
            startGenerating();
        })
    });

    app.scroller = new Scroll("#wrapper", player.offsetHeight);

    app.scroller.onScrollListener = window.titlebar.onScroll;
    app.scroller.onPageChangeListener = window.titlebar.onPageChange;

    //window.cache.clear()
    //window.localStorage.clear();

    var cachedPrograms,
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

    function loadedProgramFromServer(programKey) {
        serverDone++;
        console.log("OK: " + serverDone + " (" + programKey + ")");

        if (serverDone === serverProgramList.length) {
            if (!done) {
                bootstrap();
            } else if (mustPatch) {
                patch();
            }
        }
    }

    function rssDoneLoading(data, xml) {
        var programKey = this.program,
            podds = rss.parse(data, xml, app.programs[programKey], withDuration);

        if (data.entries.length === 0 || podds.length === 0) {
            console.log("Loaded " + this.program + ", but no podcasts: skipping... !!!!!!!!!!!!!!");
            window.app.programs[programKey] = undefined;
            delete window.app.programs[programKey];
            loadedProgramFromServer(programKey);
            return;
        }

        console.log("Loaded " + programKey + ", parsing...");
        var tid = setTimeout(function() {
                console.log("Waited a long time for: " + programKey);
            }, 2000);

        // Copy duration when done, store in cache
        function withDuration(podcastsWithDur) {
            if (podcastsWithDur.length === 0) {
                console.log("Loaded " + programKey + ", but no podcasts: skipping... !!!!!!!!!!!!!!");
                window.app.programs[programKey] = undefined;
                delete window.app.programs[programKey];
                loadedProgramFromServer(programKey);
                return;
            }

            app.programs[programKey].podcasts = podcastsWithDur;
            clearTimeout(tid);
            console.log("Durations loaded for " + programKey);

            // Cache this json!
            window.cache.putProgram(app.programs[programKey]);
            loadedProgramFromServer(programKey);
        }

        console.log("Parsed, waiting for duration (" + this.program + ")");
    }

    // Either short-circuited non-equal or equal check, cannot have both :((
    function arePodcastsEqual(poddA, poddB){
        return (poddA.title === poddB.title)
            && (poddA.image === poddB.image)
            && (poddA.content === poddB.content)
            && (poddA.podcastUrl === poddB.podcastUrl);
    }

    function mergeRSS(data, xml) {
        var programKey = this.program,
            estPodds = rss.parse(data, xml, window.app.programs[programKey], onPoddComplete);

        if (estPodds.length === 0) {
            console.log("Loaded " + programKey + ", but no podcasts: skipping...");
            window.app.programs[programKey] = undefined;
            delete window.app.programs[programKey];
            loadedProgramFromServer(programKey);
            return;
        }

        function onPoddComplete(legitServerPodcasts) {
            var cachedPodcasts = window.app.programs[programKey].podcasts,
                len;

            console.log('Merge ' + programKey)

            // Remove all unknown podcasts (that aren't on server-side)
            len = legitServerPodcasts.length;
            cachedPodcasts = cachedPodcasts.filter(function(podd){
                for (var i = 0; i < len; i++) {
                    if (arePodcastsEqual(legitServerPodcasts[i], podd))
                        return true;
                }
                console.log('Removed ' + podd.title + ' from ' + programKey)
                mustPatch = true;
                return false;
            })
            
            len = cachedPodcasts.length;
            legitServerPodcasts.forEach(function(podd){
                var i;
                for (i = 0; i < len; i++) {
                    if (arePodcastsEqual(cachedPodcasts[i], podd))
                        return;
                }

                cachedPodcasts.splice(i, 0, podd);
                console.log('Added ' + podd.title + ' to ' + programKey)
                mustPatch = true;
            })

            // We are already updating the stuff in-place, but maybe this is needed
            // b/c of the filter stuff returning new array :s
            window.app.programs[programKey].podcasts = cachedPodcasts
            window.cache.putProgram(window.app.programs[programKey]);
            loadedProgramFromServer(programKey);
        }
    }

    function startGenerating(){
        console.log('Begin cache control')
        cachedPrograms = window.cache.getCachedPrograms()
    
        // Fetch the server-side list of program names, images and rss
        // TODO: Use server side instead of local side
        $.getJSON("programs.json", function(data) {
            // data = { 'bestforeigar' : { name : 'walla', image : 'www', rss : 'www' }, ... }
            if (data) {
                serverProgramList = Object.keys(data);
                serverProgramList.forEach(function(programKey) {
                    data[programKey].key = programKey;
                    if (!window.app.programs[programKey]) {
                        window.app.programs[programKey] = data[programKey];
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

        // Load cached programs
        cachedPrograms.forEach(function(programKey) {
            console.log('Loading...?')
            // Somehow the internet was faster :O
            if (window.app.programs[programKey]) {
                return;
            }

            console.log("Loading " + programKey + " from cache!");

            // Load program object (except podcasts)
            app.programs[programKey] = window.cache.getObject(programKey);

            // Load podcasts array
            //app.programs[programKey].podcasts = window.cache.getObject(app.programs[programKey].podcasts);

            // Notify the world
            loadedProgramFromCache(programKey);
        });
    }
};
