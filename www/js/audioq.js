// AudioQueue : user queue, auto queue
var audioq = function() {
  var self = this;

  // Play queue, head is first element, tail is last
  var queues = {
    'user' : [],
    'auto' : []
  }

  function onSuccess(){}
  function onError(){}

  // Put at tail
  this.enqueue = function (src, whichQueue) {
    queues[whichQueue].push(new Media(src, onSuccess, onError));
  }

  // Put at head
  this.push = function (src, whichQueue) {
    queues[whichQueue].splice(0, 0, new Media(src, onSuccess, onError));
  }

  // Try to get from user queue, then from auto
  this.shift = function () {
    var media;

    if (this.length() === 0) return new Error('Empty queue')

    if (queues.user.length > 0)
      media = queues.user.shift();
    else if (queues.auto.length > 0)
      media = queues.auto.shift();

    return media;
  }

  // Returns total length or length of provided queue
  this.length = function (whichQueue) {
    if (whichQueue)
      return queues[whichQueue].length;
    return queues.user.length + queues.auto.length;
  }
}
