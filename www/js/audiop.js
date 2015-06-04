// AudioPlayer : play, pause, loadMedia, seek, currentPos, duration
var audiop = function() {
	var self = this;

	var _media = null,
		_paused = true,
		_id = 0, _callb;

	function trackProgress() {
		if (_callb)
			_media.getCurrentPosition(_callb)
	}

	this.play = function (onUpdate) {
		if (!_media) return console.err('No media.');
		if (!_paused) return console.err('Already playing.');

		_media.play({ /* super secret options here */ });
		_id = setInterval(trackProgress, 1000);
		_paused = false;
		_callb = onUpdate;
	}

	// liveplayer
	// http://live.radioaf.se:8000/;stream/1

	// Load  track, will try to release the old one.
	this.loadMedia = function (src, autoPlay) {
		// We cannot know if media is playing, so stop it b/c safety's first!
		// (No one knows what happens when releasing a playing media...)
		if (_media) {
			_media.stop();
			_media.release();
		}

		if (_id) {
			// _id == 0 is false :>
			clearInterval(_id);
			_callb = null;
			_id = 0;
		}
		
		// No track playing. Update _paused otherwise play() will malfunction...
		_paused = true;
		_media = new Media(src, self.onSuccess, self.onError)
	}

	this.pause = function () {
		_paused = true;

		// Only do the pause if we have something to pause.
		if (_media)
			_media.pause();

		// If we were tracking progress for some reason, cleanup!
		if (_id) {
			// _id == 0 is false :>
			clearInterval(_id);
			_callb = null;
			_id = 0;
		}
	}

	this.isPaused = function () {
		return _paused;
	}

	function onSuccess(){ console.log('Loaded media.'); }
	function onError(){ console.err('Did not load media.'); }
}
