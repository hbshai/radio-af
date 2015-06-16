// MISC utility function
function formatTime(date) {
    var m = date.getUTCMinutes() + date.getUTCHours() * 60,
        s = date.getUTCSeconds();
    return (m >= 10 ? m : "0" + m) + ":" + (s >= 10 ? s : "0" + s);
}

// AudioPlayer : play, pause, loadMedia, seek, currentPos, duration
var AudioPlayer = function() {
    var self = this;

    var _media = null,
        _paused = true,
        _id = 0,
        _boundUpdate = this.updateTime.bind(this);

    // Must be accessable in prototype functions (using this)
    this.footerTimeEl = undefined;
    this.currentDurationString = "";
    this.currentPodcast = undefined;

    function trackProgress() {
        _media.getCurrentPosition(_boundUpdate);
        window.localStorage.setItem("audiop-seek", _media.position);
    }

    this.play = function() {
        if (!_media) {
            console.err("No media.");
            return;
        }

        if (!_paused) {
            console.err("Already playing.");
            return;
        }

        _media.play({ /* super secret options here */ });
        _paused = false;

        _id = setInterval(trackProgress, 500);
        trackProgress();

        $("#footer-btn").attr("class", "footer-play");
    };

    // liveplayer
    // http://live.radioaf.se:8000/;stream/1

    // Load track via podcast, will try to release the old one.
    this.loadPodcast = function(podcast) {
        // We cannot know if media is playing, so stop it b/c safety's first!
        // (No one knows what happens when releasing a playing media...)
        if (_media) {
            _media.stop();
            _media.release();
        }

        if (_id) {
            clearInterval(_id);
            _id = 0;
        }

        this.currentPodcast = podcast;

        // Store so that we can load when restarting app
        window.localStorage.setItem("audiop-program", podcast.author);
        window.localStorage.setItem("audiop-index", podcast.index);
        window.localStorage.setItem("audiop-seek", 0); // init to 0

        // No track playing. Update _paused otherwise play() will malfunction...
        _paused = true;
        _media = new Media(podcast.podcastUrl, self.onSuccess, self.onError);

        // Do some UI shizzle
        this.currentDurationString = formatTime(new Date(podcast.duration * 1000));
        this.updatePosition(0);

        $("#footer-img").attr("src", podcast.image);
        $("#footer-title").text(podcast.program);
        $("#footer-ep").text(podcast.title);
    };

    this.pause = function() {
        _paused = true;

        // Only do the pause if we have something to pause.
        if (_media) {
            _media.pause();
        }

        $("#footer-btn").attr("class", "footer-pause");

        // If we were tracking progress for some reason, cleanup!
        if (_id) {
            // _id == 0 is false :>
            clearInterval(_id);
            _id = 0;
        }
    };

    // Yes I am seek
    this.seekTo = function(pos) {
        _media.seekTo(pos * 1000); // seek expects ms
        self.updatePosition(pos);
        window.localStorage.setItem("audiop-seek", _media.position);
    };

    this.playOrPause = function() {
        if (_paused) {
            this.play();
        } else {
            this.pause();
        }
    };

    this.isPaused = function() {
        return _paused;
    };

    function onSuccess() {
        console.log("Loaded media.");
    }

    function onError() {
        console.err("Did not load media.");
    }
};

AudioPlayer.prototype.init = function(footerTime) {
    this.footerTimeEl = footerTime;
};

AudioPlayer.prototype.load = function() {
    var program = window.localStorage.getItem("audiop-program"),
        index = window.localStorage.getItem("audiop-index"),
        seek = window.localStorage.getItem("audiop-seek")

    if (program && index) {
        podcast = window.app.programs[program].podcasts[index];
    	this.loadPodcast(podcast);
	    if (seek)
	    	this.seekTo(parseInt(seek));
    }

};

// Does not actually seek; only updates the visuals
AudioPlayer.prototype.updatePosition = function(pos) {
    if (pos < 0) {
        pos = 0;
    }

    var time = formatTime(new Date(pos * 1000));
    this.footerTimeEl.innerHTML = time + " / " + this.currentDurationString;
};

AudioPlayer.prototype.samePodcast = function(otherPodcast) {
    var hashCurrent = this.currentPodcast.program + this.currentPodcast.index,
        hashOther = otherPodcast.program + otherPodcast.index;
    return hashCurrent === hashOther;
};
