(function(GLOBAL) {

    // Program and pocast heights are the same
    var standardHeight = (window.matchMedia("(max-width: 414px)").matches ? 70 : 100);

    // Find and toggle play and pause buttons on buttons for a podcast
    function togglePlayPauseButton(podcast) {
        var mainSelector = "[data-podcast-program='" + podcast.author + "']"
            + "[data-podcast-index='" + podcast.index + "']";

        // Toggles the minipod button
        $(mainSelector + " > .podd-control").toggleClass("play").toggleClass("pause");

        // TODO: Make this work (selector is wrong)
        // Toggles the spotlight button
        $(mainSelector + " > div > #spotlight-play").toggleClass("spotlight-pause");
    }

    function toggleDownloadButton(podcast) {
        var mainSelector = "[data-podcast-program='" + podcast.author + "']"
            + "[data-podcast-index='" + podcast.index + "']";

        // Toggles the minipod button
        $(mainSelector + " > .podd-control").toggleClass("play").toggleClass("pause");

        // TODO: Make this work (selector is wrong)
        // Toggles the spotlight button
        $(mainSelector + " > div > .podd-control").toggleClass("play").toggleClass("pause");
    }

    function togglePlayerSlider(event) {
        if (event.target.classList.contains("footer-pause") || event.target.classList.contains("footer-play")) {
            return;
        }
        var player = findDiv(event.target, "lefty");
        $("#footer").toggleClass("expanded-player");
        window.app.audiop.disableAutoSeek = !window.app.audiop.disableAutoSeek;
    }

    // Play or pause a podcast and 
    function playPausePodcast(podcast) {
        // First check if we are toggling the currently playing podcast
        if (window.app.audiop.samePodcast(podcast)) {
            window.app.audiop.playOrPause();
            togglePlayPauseButton(podcast);
            return;
        }

        // Then proceed to toggle the buttons of the currently playing podcast
        if (window.app.audiop.currentPodcast && !window.app.audiop.isPaused()) {
            togglePlayPauseButton(window.app.audiop.currentPodcast);
        }

        // Load media of podcast to play and play it. AudioPlayer takes care
        // of the footer (image/button/text).
        window.app.audiop.loadPodcast(podcast);
        window.app.audiop.play();

        // Update the visualzz
        togglePlayPauseButton(podcast);
    }

    function playSpotlightPodcast(event) {
        // Two parents up
        var dataset = event.target.parentNode.parentNode.dataset,
            // Dataset converts podcast-program --> podcastProgram
            program = dataset["podcastProgram"],
            index = dataset["podcastIndex"],
            // Use above data to find podcast
            podcast = window.app.programs[program].podcasts[index];

        playPausePodcast(podcast);
    }

    function playPodcast(event) {
        var dataset = event.target.parentNode.dataset,
            // Dataset converts podcast-program --> podcastProgram
            program = dataset["podcastProgram"],
            index = dataset["podcastIndex"],
            // Use above data to find podcast
            podcast = window.app.programs[program].podcasts[index];

        playPausePodcast(podcast);
    }

    function playPauseCurrent(event) {
        window.app.audiop.playOrPause();

        if (window.app.audiop.currentPodcast)
            togglePlayPauseButton(window.app.audiop.currentPodcast);
    }

    function onProgramLoad(programKey) {
        var program = app.programs[programKey];

        // Notify flow that we might have new podcasts
        //window.flow.checkForNews(program)

    // Notify all program page that a program is ready
    //window.proglist.addProgram(program)
    }

    function downloadError(download, file, ft, error) {
        // Should probably send notification and notify DOM
        console.log("FT Error: " + download.hash + " == " + error.name + ": " + error.message);
    }
    // Create a program view for the tapped on program, insert it into the DOM and focus it
    function createProgramView(evt) {
        console.log("Please open new view!");
        var target = findDiv(evt.target, "program", "fav");
        var programKey = target.dataset["podcastProgram"];
        // console.log("Found: " + programKey);

        // Find the info for the program and open a new view
        var podcasts = window.rss.find(programKey);
        var programPage = window.htmlFarm.programView(podcasts);

        // insert the page into the dom
        var newPage = window.app.scroller.insertPage(programPage, window.app.scroller.currentPage, true);
        window.app.scroller.gotoPage(newPage);
    }

    function findDiv(node, className, optClassName) {
        if (!optClassName) {
            optClassName = "undefined";
        }

        var target = node;
        var counter = 0;
        // counter's probably overkill
        while (!(target.classList.contains(className) || target.classList.contains(optClassName)) && counter < 100) {
            counter++;
            target = target.parentNode;
            if (target == undefined) {
                break;
            }
        }
        return target;
    }

    function expandProgramText(evt) {
        // TODO: don't react to the program chevron in a much nicer fashion
        // than this pls
        if (evt.target.classList.contains("program-chevron")) {
            return;
        }
        var target = findDiv(evt.target, "program");

        // 25 is from margin (10 top, 15 bot)
        var totalHeight = standardHeight + target.querySelector(".program-text").offsetHeight + 25;
        var currentHeight = target.offsetHeight;

        // Determine if we are expanding or contracting the div
        if (target.classList.contains("program-expanded")) {
            target.classList.remove("program-expanded");
            window.app.scroller.height += (totalHeight - standardHeight);
        } else {
            // add a marker, so that we know to contract it upon next tap
            target.classList.add("program-expanded");
            window.app.scroller.height -= (totalHeight - currentHeight);
        }

        window.app.scroller.enforceBounds();
    }

    function expandPodcastText(evt) {
        // // TODO: don't react to the program chevron in a much nicer fashion
        // // than this pls
        if (evt.target.classList.contains("podd-control") || evt.target.classList.contains("podd-dl")) {
            return;
        }
        // Locate the podcast div
        var target = findDiv(evt.target, "podd");

        // 30 is from margin (15 top, 15 bot)
        var totalHeight = standardHeight + target.querySelector(".podd-ep-text").offsetHeight + 30;
        var currentHeight = target.offsetHeight;

        // Determine if we are expanding or contracting the div
        if (target.classList.contains("podd-expanded")) {
            target.classList.remove("podd-expanded");
            window.app.scroller.height += (totalHeight - standardHeight);
        } else {
            // add a marker, so that we know to contract it upon next tap
            target.classList.add("podd-expanded");
            window.app.scroller.height -= (totalHeight - currentHeight);
        }

        window.app.scroller.enforceBounds();
    }

    // Handles taps on the fav heart, located in the upper right ocrner of a
    // particular program. Adds / removes the program from the favourites
    function handleFavourite(evt) {
        var target = evt.target;
        var programKey = target.dataset["podcastProgram"];
        if (!window.favs.containsProgram(programKey)) {
            target.classList.add("fav-heart-red");
            window.favs.addFav(programKey);
        } else {
            target.classList.remove("fav-heart-red");
            target.classList.add("fav-heart");
            window.favs.removeFav(programKey);
        }

        var newFavz = htmlFarm.favouritesPage(),
            newFlow = htmlFarm.flowPage(),
            oldFavz = window.app.views.nodes["favourites"],
            oldFlow = window.app.views.nodes["flow"];


        window.app.scroller.slider.replaceChild(newFavz, oldFavz);
        window.app.scroller.slider.replaceChild(newFlow, oldFlow);

        window.app.views.nodes["favourites"] = newFavz;
        window.app.views.nodes["flow"] = newFlow;
        window.app.scroller.refreshPages();
    }


    // Switches between the alphabetic and category views in Alla Program
    function switchAllProgramPane(evt) {
        var target = evt.target.getAttribute("id"),
            parent = document.querySelector(".program-container"),
            removeNode = function(node) {
                parent.removeChild(node);
            },
            addNode = function(node) {
                parent.appendChild(node);
            };

        // window.lists.byName contains program and symbol elements
            // window.lists.byCategory contains program and category elements

        // Bail if user clicked on active tab
        if (evt.target.className.indexOf("program-active") >= 0) {
            return;
        }

        var els = document.querySelectorAll(".program-tabs > div");

        //$('.program-tabs > div').toggleClass('program-active').toggleClass('program-inactive')

        if (target === "toggleCategory") {
            els[0].className = "program-inactive";
            els[1].className = "program-active";

            //parent.innerHTML = window.lists.byCategoryHTML
            window.lists.byName.forEach(removeNode);
            window.lists.byCategory.forEach(addNode);
        } else {
            els[0].className = "program-active";
            els[1].className = "program-inactive";

            //parent.innerHTML = window.lists.byNameHTML
            window.lists.byCategory.forEach(removeNode);
            window.lists.byName.forEach(addNode);
        }

        window.app.scroller.recalcHeight();
    }

    var views = {
        "menuAlla": "all-programs",
        "menuDl": "downloaded",
        "menuFav": "favourites",
        "menuFlow": "flow"
    };
    function gotoPage(evt) {
        var targetId = evt.target.id;

        evt.preventDefault();
        evt.stopPropagation();

        window.menu.hide();
        window.menu.unregister();

        if (views[targetId]) {
            window.app.scroller.gotoPage(
                window.app.views.index[views[targetId]]
            );
        } else {
            switch (targetId) {
                case "menuLive" :
                    if (!evt.target.classList.contains("grey-out")) {
                        window.app.audiop.goLive();
                    }
                    break;
                case "menuDev" :
                    window.app.scroller.insertPage(htmlFarm.infoPage(), app.scroller.currentPage + 1);
                    window.app.scroller.nextPage();
                    break;
                default :
                    break;
            }
        }
    }

    function downloadSuccess(podcast, uri) {

    }

    function toggleDownload(evt) {
        console.log("Please download me!");
        var dataNode = evt.target.parentNode;

        if (!dataNode.dataset["podcastProgram"] && !dataNode.dataset["podcastIndex"]) {
            dataNode = dataNode.parentNode;
        }


        if (!dataNode.dataset["podcastProgram"] && !dataNode.dataset["podcastIndex"]) {
            console.log("WARN: Did not find any parent with info!!");
        }

        var dataset = dataNode.dataset,
            program = dataset["podcastProgram"],
            index = dataset["podcastIndex"],
            podcast = window.app.programs[program].podcasts[index],
            hash = podcast.author + podcast.title,
            alreadyDownloaded = window.dlman.has(hash);

        console.log(podcast.author + " --> " + hash + " (" + podcast.podcastUrl + ")");

        if (alreadyDownloaded) {
            window.dlman.remove(hash);
        } else {
            window.dlman.download(podcast, hash);
        }
        console.log("Should start download now");
    }

    function handleTheSeek(evt){
        console.log('Seek'+ evt)
    }

    GLOBAL.handlers = {
        playPodcastHandler: playPodcast,
        spotlightHandler: playSpotlightPodcast,
        playerControlHandler: playPauseCurrent,

        fileTransferSuccess: downloadSuccess,
        fileTransferError: downloadError,

        fileRemoveSuccess: console.log,
        fileRemoveFail: console.log,

        loadedProgramRSS: onProgramLoad,
        openProgramView: createProgramView,
        expandText: expandProgramText,
        expandPodcast: expandPodcastText,

        handleMenuButton: gotoPage,
        handleDownloadButton: toggleDownload,

        handleFav: handleFavourite,
        handleSeekChange : handleTheSeek,
        goToAllProgramsView: function(event) {
            window.app.scroller.gotoPage(
                window.app.views.index["all-programs"]
            );
        },
        togglePlayerSlider : togglePlayerSlider,
        // suddenly: a closure!
        handleInfoClick: (function(event) {
             var counter = 0;
             return function(event) {
                 var topLevel = findDiv(event.target, "page");
                 for (var i = 0; topLevel.children.length; i++) {
                     if (topLevel.children[i].classList.contains("shai-img")) {
                         var div = topLevel.children[i];
                         break;
                     }
                 }
                 // only increment when the div isn't visible
                 if (!div.style.display) {
                     counter = counter + 1;
                 }
                 if (counter >= 3) {
                     // reset the counter
                     counter = 0;
                     div.style.display = "block";
                     window.app.scroller.recalcHeight();
                 }
             }
         })(),
        toggleProgramPane: switchAllProgramPane,
        handleNetworkError: function() {
            if (window.hasNoInternet) {
                return;
            }
            window.hasNoInternet = true;
            window.alert("NO INTERNET MOFO");
        }

    };
})(window);
