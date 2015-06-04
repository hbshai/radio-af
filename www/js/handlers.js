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

        if (target === 'toggleCategory') {
            window.lists.byName.forEach(function (node){
                if (node.length) {
                    // Order doesn't matter when removing nodes
                    for (var i = node.length - 1; i >= 0; i--) {
                        parent.removeChild(node[i])
                    }
                } else {
                    parent.removeChild(node)   
                }
            })
            window.lists.byCategory.forEach(function (node){
                // See below for info about the indices 
                parent.appendChild(node[0])
                node[1].forEach(function(el){
                    parent.appendChild(el)
                })
            })
        } else {
            window.lists.byName.forEach(function (node){
                if (node.length) {
                    // But matters when appending :D
                    for (var i = 0; i < node.length; i++) {
                        parent.appendChild(node[i])
                    }
                } else {
                    parent.appendChild(node)   
                }
            })
            window.lists.byCategory.forEach(function (node){
                // In category the first index is the category, the second is the
                // array of programs of that category.
                parent.removeChild(node[0])
                node[1].forEach(function(el){
                    parent.removeChild(el)
                })
            })
        }
        
        window.app.scroller.recalcHeight()
        $('.program-tabs > div').toggleClass('program-active').toggleClass('program-inactive')
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