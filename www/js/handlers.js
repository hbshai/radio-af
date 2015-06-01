(function (GLOBAL){

    // It should update the miniplayer progress bar.
    function onPlayProgress(){

    }

    function playPodcast(event) {
        var dataset = event.target.parentNode.dataset,
            // These might be podcast-program --> podcastProgram
            program = dataset['podcastProgram'],
            index = dataset['podcastIndex'],
            trackHash = program + index // program names and podcast indexes are both unique

        console.log('playPodcast: ' + program + ' - ' + index)

        // We are trying to toggle the current track.
        if (window.app.audiop.trackHash === trackHash) {
            if (window.app.audiop.isPaused())
                window.app.audiop.play()
            else
                window.app.audiop.pause()

            return;
        }
        
        window.app.audiop.trackHash = trackHash
        window.app.audiop.loadMedia(window.app.programs[program].podcasts[index].podcastUrl)
        window.app.audiop.play(onPlayProgress)
    }

    GLOBAL.handlers = {
        playPodcastHandler : playPodcast
    }
})(window)