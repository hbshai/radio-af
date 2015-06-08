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
        var time = new Date(pos * 1000)
        footerTime.text(formatDate(time) + ' / ' + currentDurationString);

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
            $("[data-podcast-program='" + window.app.audiop.currentlyPlaying.program + "']"
              + "[data-podcast-index='" + window.app.audiop.currentlyPlaying.index + "']" 
              + ' > .podd-control').toggleClass('play').toggleClass('pause')

        // TODO: Store currently playing podcast info in local storage

        window.app.audiop.trackHash = trackHash
        window.app.audiop.loadMedia(podcast.podcastUrl)
        window.app.audiop.play(onPlayProgress)
        window.app.audiop.currentlyPlaying = podcast

        $(dataSelector + ' > .podd-control').toggleClass('play').toggleClass('pause')

        currentDurationString = formatDate(new Date(podcast.duration * 1000))

        $("#footer-btn").attr('class', 'footer-play');
        $("#footer-img").attr('src', podcast.image);
        $("#footer-title").text(podcast.author);
        $("#footer-ep").text(podcast.title)

        if (!footerTime)
            footerTime = $("#footer-time")

        onPlayProgress(0)
    }

    function playPauseCurrent(event){
        if (window.app.audiop.isPaused())
            window.app.audiop.play(onPlayProgress)
        else
            window.app.audiop.pause()

        $("#footer-btn").attr('class', window.app.audiop.isPaused() ? 'footer-pause' : 'footer-play')

        $("[data-podcast-program='" + window.app.audiop.currentlyPlaying.program + "']"
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

        toggleProgramPane : switchAllProgramPane
    }
})(window)