// AudioPlayer : play, pause, next, seek, currentPos, duration
// This just operates on the audio queue class
var audiop = function(queue) {
  var self = this;

  var _media = null,
      _paused = true,
      _id = 0, _callb;

  function trackProgress() {
    if (_callb)
      _callb();
  }

  this.play = function (onUpdate) {
    if (!_media) return new Error('No media');
    if (!_paused) return new Error('Already playing');

    _media.play({ /* super secret options here */ });
    _id = setInterval(trackProgress, 100);
    _paused = false;
    _callb = onUpdate;
  }

  // Load next track, will try to release the old one unless prohibited.
  this.next = function (noRelease) {
    // We cannot know if media is playing, so stop it b/c safety's first!
    // (No one knows what happens when releasing a playing media...)
    if (_media && !noRelease) {
      _media.stop();
      _media.release();
    }

    // Bail before or after release clause?
    if (queue.length === 0) return new Error('Empty play queue')

    // The queue returns Media objects, da real mvp.
    _media = queue.shift();
  }

  this.pause = function () {
    if (!_media) return new Error('No media');
    if (_paused) return new Error('Already paused');

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

  this.paused = function () {
    return _paused;
  }

  // fuck the queue
  this.playImmediate = function (src) {

  }
}
