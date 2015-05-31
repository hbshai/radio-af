(function (GLOBAL){

    // It should update the miniplayer progress bar.
    function onPlayProgress(){

    }

    function playPodcast(event) {
        console.log(event.target.parentNode.dataset)

        var dataset = event.target.parentNode.dataset,
            // These might be podcastProgram and podcastIndex, browser doing its thing again...
            program = dataset['podcast-program'],
            index = dataset['podcast-index'],
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