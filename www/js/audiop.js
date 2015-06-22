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
        
        _htmlAudio, // only for iOS
        _boundUpdate = function(pos) {
            self.updatePosition(pos);
            window.localStorage.setItem("audiop-seek", pos);
        };

    // Must be accessable in prototype functions (using this)
    this.footerTimeEl = undefined;
    this.currentDurationString = "";
    this.currentPodcast = undefined;

    function trackProgress() {
    	if (_media)
        	_media.getCurrentPosition(_boundUpdate);

        if (_htmlAudio) {
        	_boundUpdate(_htmlAudio.currentTime)
        }
    }

    this.play = function() {
        if (!_media && !_htmlAudio) {
            console.err("No media.");
            return;
        }

        if (!_paused) {
            console.err("Already playing.");
            return;
        }
	
		if (_media) {
        	_media.play({ playAudioWhenScreenIsLocked : true });
        }
        if (_htmlAudio) {
        	_htmlAudio.play()
        }
        _paused = false;

        _id = setInterval(trackProgress, 500);
        trackProgress();

        $("#footer-btn").attr("class", "footer-play");
    };

    // Load track via podcast, will try to release the old one.
    this.loadPodcast = function(podcast) {
        // We cannot know if media is playing, so stop it b/c safety's first!
        // (No one knows what happens when releasing a playing media...)
        if (_media) {
            _media.stop();
            _media.release();
            _media = undefined
        }

        if (_htmlAudio) {
        	_htmlAudio.pause()
        	_htmlAudio = undefined
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
        var uri = window.dlman.has(podcast.author + podcast.title) ? window.dlman.get(podcast.author + podcast.title) : podcast.podcastUrl;
        if (window.iOSPlatform) {
            _htmlAudio = new Audio(uri)
            _htmlAudio.id = podcast.title
        } else {
            _media = new Media(uri, self.onSuccess, self.onError);
        }
        
        var counter = 0;
        if (this.timerDur)
            clearInterval(this.timerDur);

        if (_media) {
            this.timerDur = setInterval(function() {
                counter = counter + 100;
                if (counter > 20000) {
                    clearInterval(self.timerDur);
                    self.timerDur = 0;
                }
                var dur = _media.getDuration();
                if (dur > 0) {
                    clearInterval(self.timerDur);
                	self.timerDur = 0;
                	
                	// Update the durations, sadly not for html :((
                	self.currentDurationString = formatTime(new Date(dur * 1000));
                	self.currentPodcast.duration = dur;

            	    self.seekBar.noUiSlider({
            	    	start : 0,
            			range: {
            				'min': 0,
            				'max': dur
            			}
            	    }, true);
                }
            }, 100);
        }

        // Do some UI shizzle
        this.currentDurationString = formatTime(new Date(podcast.duration * 1000));
        this.updatePosition(0);

        this.seekBar.noUiSlider({
        	start : 0,
    		range: {
    			'min': 0,
    			'max': podcast.duration
    		}
        }, true);

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

        if (_htmlAudio) {
        	_htmlAudio.pause()
        }

        $("#footer-btn").attr("class", "footer-pause");

        // If we were tracking progress for some reason, cleanup!
        if (_id) {
            // _id == 0 is false :>
            clearInterval(_id);
            _id = 0;
        }
    };

    this.playLive = function(msg) {
        if (_media) {
            _media.stop();
            _media.release();
            _media = undefined
        }

        if (_id) {
            clearInterval(_id);
            _id = 0;
        }

        this.currentPodcast = undefined;
        
        // No track playing. Update _paused otherwise play() will malfunction...
        _paused = true;
        if (window.iOSPlatform) {
        	_htmlAudio = new Audio("http://live.radioaf.se:8000/;stream/1")
        } else {
        	_media = new Media("http://live.radioaf.se:8000/;stream/1", self.onSuccess, self.onError);
		}

        // Do some UI shizzle
        this.currentDurationString = "∞";
        this.updatePosition(0);
		
	    this.seekBar.attr('disabled', 'disabled')

        $("#footer-img").attr("src", window.fixImageUrl(msg.author.show_image));
        $("#footer-title").text(msg.author.show_name);
        $("#footer-ep").text("Du lyssnar live");
    };

    // Yes I am seek
    this.seekTo = function(pos) {
        if (_media)
            _media.seekTo(pos * 1000); // seek expects ms
        
        if (_htmlAudio)
            _htmlAudio.currentTime = pos;

        self.updatePosition(pos);
        window.localStorage.setItem("audiop-seek", pos);
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

AudioPlayer.prototype.init = function() {
	if (window.device.platform === 'iOS') {
		window.iOSPlatform = true;
	}
    this.footerTimeEl = document.getElementById("footer-time");
    this.seekBar = $("#seekbar") // noUiSlideBar requires jquery
    this.seekBar.noUiSlider({
    	start : 0,
		range: {
			'min': 0,
			'max': 0
		}
    });
    //this.seekBar.attr('disabled', 'disabled')
	
	this.disableAutoSeek = false;
	this.seeking = false;
    this.seekBar.on('slide', function(){
    	window.app.audiop.seeking = true;
		window.app.audiop.updatePosition(window.app.audiop.seekBar.val(), true)
    })
    this.seekBar.on('change', function(){
    	window.app.audiop.seeking = false;
		window.app.audiop.seekTo(window.app.audiop.seekBar.val())    	
    })
};

AudioPlayer.prototype.load = function() {
    var program = window.localStorage.getItem("audiop-program"),
        index = window.localStorage.getItem("audiop-index"),
        seek = window.localStorage.getItem("audiop-seek");

    if (program && index) {
        podcast = window.app.programs[program].podcasts[index];
        this.loadPodcast(podcast);
        if (seek && seek !== "undefined") {
            this.seekTo(parseInt(seek));
        }
    }
};

// Does not actually seek; only updates the visuals
AudioPlayer.prototype.updatePosition = function(pos, force) {
    if (pos < 0) {
        pos = 0;
    }
    var time = formatTime(new Date(pos * 1000));

    if (!window.app.audiop.seeking || force)
    	this.footerTimeEl.innerHTML = time + " / " + this.currentDurationString;

    if (!this.disableAutoSeek)
    	this.seekBar.val(pos)
};

AudioPlayer.prototype.samePodcast = function(otherPodcast) {
    var hashCurrent = this.currentPodcast ? this.currentPodcast.program + this.currentPodcast.index : "",
        hashOther = otherPodcast.program + otherPodcast.index;
    return hashCurrent === hashOther;
};

AudioPlayer.prototype.goLive = function() {
    $.getJSON("http://www.radioaf.se/nowplaying/")
        .done(function(msg, txt, xhr) {
        	if (msg.data.author.show_name === "Sändningsuppehåll") {
        		$("#footer-img").attr("src", msg.data.author.show_image);
        		$("#footer-title").text(msg.data.author.show_name);
        		$("#footer-time").text('-- / --');
        		$("#footer-ep").text("");
				return;
        	}

            window.app.audiop.playLive(msg.data);
            window.app.audiop.play();
        })
        .error(function(err) {});
};
