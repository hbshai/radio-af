(function (GLOBAL){

    var footerTime = undefined,
        currentDurationString = ""

    function formatDate(date){
        var m = date.getUTCMinutes() + date.getUTCHours() * 60,
            s = date.getUTCSeconds()
        return (m >= 10 ? m : '0' + m) + ':' + (s >= 10 ? s : '0' + s)
    }

    // It should update the miniplayer progress bar.
    function onPlayProgress(pos){
        if (pos < 0) 
            pos = 0;

        var time = new Date(pos * 1000)
        footerTime.innerHTML = formatDate(time) + ' / ' + currentDurationString;

        // TODO: Store progress in localStorage 
    }

    function playPodcast(event) {
        var dataset = event.target.parentNode.dataset,
            // These might be podcast-program --> podcastProgram
            program = dataset['podcastProgram'],
            index = dataset['podcastIndex'],
            podcast = window.app.programs[program].podcasts[index]

            // Very low chance of collision: 'Correcto' + '10' vs 'Correcto1' + '0'
            trackHash = program + index, 
            // Selector for all elements that have this specifc podcast data
            dataSelector = "[data-podcast-program='" + program + "']"
                         + "[data-podcast-index='" + index + "']"

        // We are trying to toggle the current track.
        if (window.app.audiop.trackHash === trackHash) {
            if (window.app.audiop.isPaused())
                window.app.audiop.play(onPlayProgress)
            else
                window.app.audiop.pause()
            
            $(dataSelector + ' > .podd-control').toggleClass('play').toggleClass('pause')

            $("#footer-btn").attr('class', window.app.audiop.isPaused() ? 'footer-pause' : 'footer-play');

            return;
        }
        
        // Toggle the currently playing button
        if (window.app.audiop.currentlyPlaying && !window.app.audiop.isPaused())
            $("[data-podcast-program='" + window.app.audiop.currentlyPlaying.author + "']"
              + "[data-podcast-index='" + window.app.audiop.currentlyPlaying.index + "']" 
              + ' > .podd-control').toggleClass('play').toggleClass('pause')

        // TODO: Store currently playing podcast info in local storage
        // TODO: Refactor audiop so we only do audiop.play(podcast) and it does everything
        window.app.audiop.trackHash = trackHash
        window.app.audiop.loadMedia(podcast.podcastUrl)
        window.app.audiop.play(onPlayProgress)
        window.app.audiop.currentlyPlaying = podcast

        $(dataSelector + ' > .podd-control').toggleClass('play').toggleClass('pause')

        currentDurationString = formatDate(new Date(podcast.duration * 1000))

        // TODO: Move these into audiop
        $("#footer-btn").attr('class', 'footer-play');
        $("#footer-img").attr('src', podcast.image);
        $("#footer-title").text(podcast.program);
        $("#footer-ep").text(podcast.title)

        if (!footerTime)
            footerTime = document.querySelector("#footer-time")

        onPlayProgress(0)
    }

    function playPauseCurrent(event){
        if (window.app.audiop.isPaused())
            window.app.audiop.play(onPlayProgress)
        else
            window.app.audiop.pause()

        $("#footer-btn").attr('class', window.app.audiop.isPaused() ? 'footer-pause' : 'footer-play')

        $("[data-podcast-program='" + window.app.audiop.currentlyPlaying.author + "']"
          + "[data-podcast-index='" + window.app.audiop.currentlyPlaying.index + "']" 
          + ' > .podd-control').toggleClass('play').toggleClass('pause')
    }

    function onProgramLoad(programKey) {
        var program = app.programs[programKey]

        // Notify flow that we might have new podcasts
        //window.flow.checkForNews(program)

        // Notify all program page that a program is ready
        //window.proglist.addProgram(program)
    }

    function downloadError(download, file, ft, error){
        // Should probably send notification and notify DOM
        console.log('FT Error: ' + download.hash + ' == ' + error.name + ': ' + error.message)
    }
    // Create a program view for the tapped on program, insert it into the DOM and focus it
    function createProgramView(evt) {
        var target = evt.target.parentNode;
        var programKey = target.dataset["podcastProgram"];

        // Find the info for the program and open a new view
        var podcasts = window.rss.find(programKey)
        var programPage = window.htmlFarm.programView(podcasts);

        // insert the page into the dom
        var newPage = window.app.scroller.insertPage(programPage, window.app.scroller.currentPage, true);
        window.app.scroller.gotoPage(newPage);
    }

    var trickHeight;
    function expandProgramText(evt) {
        // TODO: don't react to the program chevron in a much nicer fashion
        // than this pls
        if (evt.target.classList.contains("program-chevron")) {
            return;
        }
        // Locate the program div
        var target = evt.target;
        var counter = 0;
        // counter's probably overkill
        while (!target.classList.contains("program") && counter < 100) {
            counter++;
            target = target.parentNode;
        }
        
        // Trick height is storage for normal (collapsed) height. Assume that
        // the first program we click on is collapsed, not expanded.
        if (!trickHeight)
            trickHeight = target.offsetHeight;

        // 25 is from margin (10 top, 15 bot), 4 is magic number
        var totalHeight = trickHeight + target.querySelector('.program-text').offsetHeight + 25 + 4;
        var currentHeight = target.offsetHeight;

        // Determine if we are expanding or contracting the div
        if (target.classList.contains("program-expanded")) {
            target.classList.remove("program-expanded");
            window.app.scroller.height += (totalHeight - trickHeight);
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

        // Locate the program div
        var target = evt.target;
        var counter = 0;
        // counter's probably overkill
        while (!target.classList.contains("podd") && counter < 100) {
            counter++;
            target = target.parentNode;
        }

        // Determine if we are expanding or contracting the div
        if (target.classList.contains("podd-expanded")) {
            target.classList.remove("podd-expanded");
        } else {
            // add a marker, so that we know to contract it upon next tap
            target.classList.add("podd-expanded");
        }
        //TODO: remove this; check bounds instead
        setTimeout(function() {
            window.app.scroller.recalcHeight();
        }, 150);
    }

    // Handles taps on the fav heart, located in the upper right ocrner of a
    // particular program. Adds / removes the program from the favourites
    function handleFavourite(evt) {
        var target = event.target;
        var programKey = target.dataset["podcastProgram"];
        if (!window.favs.containsProgram(programKey)) {
            target.classList.add("fav-heart-red");
            window.favs.addFav(programKey);
        } else {
            target.classList.remove("fav-heart-red");
            target.classList.add("fav-heart");
            window.favs.removeFav(programKey);
        }
        var favs = window.favs.getFavs();
    }

    // Switches between the alphabetic and category views in Alla Program
    function switchAllProgramPane(evt) {
        var target = evt.target.getAttribute('id'),
            parent = document.querySelector('.program-container')
            removeNode = function(node){ parent.removeChild(node) },
            addNode = function(node){ parent.appendChild(node) }

        // window.lists.byName contains program and symbol elements
        // window.lists.byCategory contains program and category elements

        // Bail if user clicked on active tab
        if (evt.target.className.indexOf('program-active') >= 0)
            return

        var els = document.querySelectorAll('.program-tabs > div')

        //$('.program-tabs > div').toggleClass('program-active').toggleClass('program-inactive')

        if (target === 'toggleCategory') {
            els[0].className = 'program-inactive'
            els[1].className = 'program-active'
            
            //parent.innerHTML = window.lists.byCategoryHTML
            window.lists.byName.forEach(removeNode)
            window.lists.byCategory.forEach(addNode)
        } else {
            els[0].className = 'program-active'
            els[1].className = 'program-inactive'
            
            //parent.innerHTML = window.lists.byNameHTML
            window.lists.byCategory.forEach(removeNode)
            window.lists.byName.forEach(addNode)
        }
        
        window.app.scroller.recalcHeight()
    }

    GLOBAL.handlers = {
        playPodcastHandler : playPodcast,
        playerControlHandler : playPauseCurrent,
        fileTransferError : downloadError,

        fileRemoveSuccess : console.log,
        fileRemoveFail : console.log,

        loadedProgramRSS : onProgramLoad,
        openProgramView : createProgramView,
        expandText : expandProgramText,
        expandPodcast : expandPodcastText,
        // TODO: reflow handler - called when cache & other loading has been
        // completed; causes rebuild of flow/fav pages
        handleFav : handleFavourite,
        toggleProgramPane : switchAllProgramPane
    }
})(window)
