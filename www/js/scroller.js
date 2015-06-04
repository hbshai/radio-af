(function(){
    var vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
                 (/firefox/i).test(navigator.userAgent) ? 'Moz' :
                 'opera' in window ? 'O' : '',
        VENDOR_TRANSFORM = vendor + 'Transform'

    // How much momentum should we get when releasing?
    momentum  = function (originY, endY, prevY, dt) {
        // originY = screen coord where touch started
        // endY = screen coord where touch ended
        // dt = time of interaction in seconds
        return 1.2 * ((endY - originY) / dt);
    },
    updateMomentum = function (velY, t) {
        // velY = velocity
        // t = time elapsed in seconds
        return velY * 0.96; // static friction
    },
    // should go from 0 --> 1
    // EASE OUT: ( 1 - Math.sqrt(1 - t * t) )
    easing = function (t) {
        return t; // linear
    },

    // Browser capabilities
    has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
    hasTouch = 'ontouchstart' in window,
    hasTransform = vendor + 'Transform' in document.documentElement.style,
    isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
    isPlaybook = (/playbook/gi).test(navigator.appVersion),
    hasTransitionEnd = isIDevice || isPlaybook,
    nextFrame = (function() {
        return window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function(callback) { return setTimeout(callback, 17); }
    })(),
    cancelFrame = (function () {
        return window.cancelRequestAnimationFrame
            || window.webkitCancelRequestAnimationFrame
            || window.mozCancelRequestAnimationFrame
            || window.oCancelRequestAnimationFrame
            || window.msCancelRequestAnimationFrame
            || clearTimeout
    })(),
    
    // Events
    START_EV = 'touchstart',
    MOVE_EV = 'touchmove',
    END_EV = 'touchend',
    CANCEL_EV = 'touchcancel',

    // Helpers
    trnOpen = 'translate' + (has3d ? '3d(' : '('),
    trnClose = has3d ? ',0)' : ')',

    // Constructor
    Scroll = function (wrapper, miniPlayerHeight, headerOffset) {
        var that = this;

        // The mini player eats some space
        that.offsetHeight = miniPlayerHeight || 0;
        that.headerOffset = headerOffset || 0;

        console.log('SCROLLER INIT')

        that.wrapper = document.querySelector(wrapper);
        that.wrapper.style.overflow = 'hidden';

        // Default options
        that.options = {
            slider: wrapper + ' > div',
            pages: wrapper + ' > div > div',
        };

        that.slider = document.querySelector(that.options.slider);
        that.refreshPages();

        that.wrapper.addEventListener(START_EV, this.touchStart.bind(this), false)
        that.wrapper.addEventListener(MOVE_EV, this.touchMove.bind(this), false)
        that.wrapper.addEventListener(END_EV, this.touchEnd.bind(this), false)
        that.wrapper.addEventListener(CANCEL_EV, this.touchCancel.bind(this), false)

        that.MOMENTUM_RENDER = that.renderMomentum.bind(that)
        that.ANIMATION_RENDER = that.render.bind(that)
    };

    Scroll.prototype = {
        x : 0, y : 0, // current position
        
        // touch start sets these to the origin point, also records time
        screenX : 0, screenY : 0, startTime : 0,

        // touch move updates these to previous touch point
        prevX : 0, prevY : 0, 

        // touch move locks in either X or Y axis after some distance
        locked : undefined,
        
        // use this to calculate nice momentum distance
        // TODO: Replace with actual velocity instead...
        momentumY : 0, lastTouchTime : 0,

        // NOT momentum
        animation : { dx : 0, dy : 0, ox : 0, oy : 0, startTime : 0 },

        // REAL momentum
        momentum : { vy : 0, startTime : 0 },

        // The handle for timer updated movement (animation/momentum)
        frame : undefined,

        // bound versions of the functions for extra nice ice cream
        MOMENTUM_RENDER : undefined, ANIMATION_RENDER : undefined,

        // event listeners, use sparingly, especially onScroll
        onScrollListener : undefined,       // called on move()
        onPageChangeListener : undefined,   // called on changeTarget()

        // This is probably perferrable to using insertPage/removePage
        refreshPages : function (){
            var that = this;

            var pages = document.querySelectorAll(that.options.pages);

            // copy NodeList to Array
            that.pages = new Array(pages.length)
            for(var i = -1, l = pages.length; ++i !== l; that.pages[i] = pages[i]);
            var windowWidth = window.innerWidth,
                pageWidth = windowWidth + 'px';

            that.slider.style.width = that.pages.length * windowWidth + 'px';
            for (var i = 0; i < that.pages.length; i++)
                that.pages[i].style.width = pageWidth;

            that.currentPage = that.currentPage || 0;
            if (pages.length > 0)
                that.changeTarget(that.pages[that.currentPage]);
        },

        // insert a new page into the dom, returns the page index of it
        // insert el before or after targetEl
        insertPage : function (el, targetEl, after) {
            var targetIndex;

            for (targetIndex = 0; targetIndex < this.pages.length; targetIndex++)
                if (this.pages[targetIndex] === targetEl)
                    break;

            if (after)
                targetIndex++

            this.pages.splice(targetIndex, 0, el);
            if (after)
                this.slider.insertBefore(el, targetEl.nextSibling)
            else
                this.slider.insertBefore(el, targetEl)

            var width = window.innerWidth;
            el.style.width = width + 'px'
            this.slider.style.width = this.pages.length * width + 'px'   
            
            if (this.currentPage < targetIndex) {
                // we insert page to the right, it's fine
            } else if (this.currentPage > targetIndex) {
                // we insert page to the left, must probably scroll some
                this.gotoPage(this.currentPage++);
            } else {
                // we insert page at where we're at, not possible
                // only explanation is that we immediately requested a
                // gotoPage(newIndex) after inserting our new page
            }

            return targetIndex
        },
        
        // remove a page from the DOM -- be certain it exists 
        // or last page is removed :D
        removePage : function (el) {
            var targetIndex;

            for (targetIndex = 0; targetIndex < this.pages.length; targetIndex++)
                if (this.pages[targetIndex] === el)
                    break;

            // We need to remove page from both list and dom
            this.pages.splice(targetIndex, 1)
            this.slider.removeChild(el)

            // update wrapper width; it handles the overflow and shit
            this.slider.style.width = this.pages.length * window.innerWidth + 'px'
            
            // Give browser some time before doing the animation
            if (this.currentPage < targetIndex) {
                // we removed page to the right, it's fine
            } else if (this.currentPage > targetIndex) {
                // we removed page to the left, must probably scroll some
                this.gotoPage(this.currentPage--);
            } else {
                if (this.currentPage >= this.pages.length ) {
                    // we removed last page, scroll back
                    var that = this
                    setTimeout(function (){ 
                        that.gotoPage(that.pages.length - 1)
                    }, 0)
                }
            }
        },

        move : function (x, y, force) {
            // TODO: Optimize and only use webkitTransform instead of VENDOR_TRANSFORM
            this.slider.style[VENDOR_TRANSFORM] = 'translate3d(' + x + 'px,0,0)';
            this.scroller.style[VENDOR_TRANSFORM] = 'translate3d(0,' + y + 'px,0)';

            // TODO: Remove if by initializing scroller after titlebar.js and call it directly
            if (this.onScrollListener)
                this.onScrollListener(x, y);
            
            this.x = x;
            this.y = y;
        },

        touchStart : function (e) {
            if (this.frame) {
                cancelFrame(this.frame)
                this.frame = undefined
            }

            // Ignore touchstart if more than 1 touch points are active
            if (e.touches.length > 1) {
                e.preventDefault();
                return;
            }
            
            var touch = e.changedTouches[0]
           
            // screen coordinates
            this.screenX = this.prevX = touch.pageX;
            this.screenY = this.prevY = touch.pageY;

            // Make sure direction lock is off
            this.locked = undefined;

            // record time when finger first makes contact with surface
            this.startTime = this.lastTouchTime = Date.now() 
            this.momentumY = this.screenY;

            // TODO: Remove
            console.log(e.target.id);
        },

        touchMove : function(e){
            // Always stop browser from doing its thing 
            e.preventDefault() 

            if (e.touches.length > 1)
                return;

            var touch = e.changedTouches[0],
                distX = touch.pageX - this.prevX,
                distY = touch.pageY - this.prevY

            this.prevX = touch.pageX
            this.prevY = touch.pageY

            if (!this.locked) {
                var dx = this.screenX - touch.pageX,
                    dy = this.screenY - touch.pageY;
                
                // only lock after touch has moved *enough* in either direction
                if (dx * dx > 9 || dy * dy > 9)
                    this.locked = Math.abs(dx) > Math.abs(dy) ? 1 : 2
            }

            // locked = 1 means X-lock (only moves in X axis)
            // locked = 2 means Y-lock (only moves in Y axis)
            if (this.locked === 1)
                distY = 0;
            else if (this.locked === 2)
                distX = 0;
            else
                distX = distY = 0; // no lock, no move

            if (Date.now() >= this.lastTouchTime + 300) {
                this.lastTouchTime = Date.now()
                this.momentumY = this.prevY
            }

            this.move(this.x + distX, this.y + distY)
        },

        touchCancel : function (e) {
            // Always stop retard browser 
            e.preventDefault()

            if (e.touches.length > 1)
                return;

            if (this.frame)
                return;
            
            this.touchEnd(e);
        },

        touchEnd : function (e) {
            // Always stop retard browser 
            e.preventDefault()

            if (e.touches.length > 1)
                return;
            
            // Correction dist
            var outsideX = 0,
                outsideY = 0,
                // distance from start point (screen coords)
                totalX = e.changedTouches[0].pageX - this.screenX;

            // Ignore x movement if locked to y-axis
            if (this.locked === 2)
                totalX = 0;

            // Do this to fix scrolling for slow interactions
            if (Date.now() >= this.lastTouchTime + 300) {
                this.lastTouchTime = Date.now()
                this.momentumY = this.prevY
            }

            // outside left or right boundary
            if (this.x > 0)
                outsideX = 0 - this.x;
            else if (this.x < - (this.pages.length - 1) * window.innerWidth)
                outsideX = -(this.pages.length - 1) * window.innerWidth - this.x;

            // outside top or bot boundary
            if (this.y > 0)
                outsideY = 0 - this.y;
            else if (this.y < this.height)
                outsideY = this.height - this.y;

            // Fix pos if scrolled outside
            if (outsideX !== 0 || outsideY !== 0)
                this.resetXY(outsideX || (-(this.currentPage) * window.innerWidth - this.x), outsideY)
            else if (totalX <= -0.2 * window.innerWidth)
                this.nextPage(); // this will animate to correct pos
            else if (totalX >= 0.2 * window.innerWidth)
                this.prevPage(); // this will animate to correct pos
            else {
                // User scrolled some, but not outside and not enough to
                // change page. Do the x-reset. Otherwise scroll on!
                var fix = -(this.currentPage) * window.innerWidth - this.x

                if (fix !== 0)
                    this.resetXY(fix, 0);
                else
                    this.scrollMomentum(e);
            }
        },

        gotoPage : function (page) {            
            this.currentPage = page;
            this.changeTarget(this.pages[this.currentPage]);
            // Reset pos to X of the new page
            this.resetXY(-(this.currentPage) * window.innerWidth - this.x, 0);
        },
        nextPage : function (){ 
            this.gotoPage(this.currentPage + 1)
        },
        prevPage : function (){ 
            this.gotoPage(this.currentPage - 1)
        },

        scrollMomentum : function (e) {
            var touch = e.changedTouches[0],
                dt = (Date.now() - this.startTime) / 1000.0,
                dy = Math.abs(this.momentumY - touch.pageY)

            if (this.frame)
                cancelFrame(this.frame)

            // Don't scroll if user moved very slow towards the end,
            // like a sweep-then-stop.
            if (dy < 8)
                return;
            
            this.momentum.elapsed = 0
            this.momentum.frameTime = Date.now();
            this.momentum.vy = momentum(this.screenY, touch.pageY, this.prevY, dt)
            this.frame = nextFrame(this.MOMENTUM_RENDER)
        },

        renderMomentum : function () {
            var t = Date.now(),
                dt = (t - this.momentum.frameTime) / 1000;

            this.momentum.frameTime = t;
            this.momentum.elapsed += dt;

            this.momentum.vy = updateMomentum(this.momentum.vy, this.momentum.elapsed);

            var newY = this.y + this.momentum.vy * dt;
            // Slow momentum when we hit upper or lower bound (where page ends)
            if (newY > 0 || newY < this.height)
                this.momentum.vy *= 0.85;
            //console.log(newY + '==' + this.momentum.vy)
            this.move(this.x, newY);

            if (this.momentum.vy * this.momentum.vy > 64)
                this.frame = nextFrame(this.MOMENTUM_RENDER)
            else {
                this.frame = undefined
                // Scroll to top (if upper bound was hit) or bottom
                if (newY > 0)
                    this.resetXY(0, -newY)
                else if (newY < this.height)
                    this.resetXY(0, this.height - this.y)
            }
        },

        resetXY : function (dx, dy) {
            if (this.frame)
                cancelFrame(this.frame)

            this.animation.startTime = Date.now();

            // total delta xy
            this.animation.dx = dx;
            this.animation.dy = dy;

            // start pt
            this.animation.ox = this.x;
            this.animation.oy = this.y;
            
            this.frame = nextFrame(this.ANIMATION_RENDER);
        },
        
        //
        render : function () {
            var t = (Date.now() - this.animation.startTime) / 200.0;
        
            // Clamp t to 1 for good behaviour
            if (t > 1)
                t = 1;

            var ease = easing(t),
                dx = this.animation.dx * ease,
                dy = this.animation.dy * ease;

            this.move(this.animation.ox + dx, this.animation.oy + dy);
            if (t < 1)
                this.frame = nextFrame(this.ANIMATION_RENDER)
            else
                this.frame = undefined
        },
        
        // change target of Y-scrolling, necessary when changing to a new page
        changeTarget : function (target) {
            this.scroller = target;

            // Get y-pos of new target; because each page is scrolled independantly in y-axis
            var matrix = getComputedStyle(this.scroller, null)[vendor + 'Transform'].replace(/[^0-9-.,]/g, '').split(',');
            this.y = matrix[5] * 1 || 0;

            // Figure out new height because each page can be of different height
            this.height = this.wrapper.clientHeight - this.scroller.offsetHeight;
            this.height -= this.offsetHeight;

            if (this.height > 0)
                this.height = 0;

            // Defer the function call so the DOM read stuff doesn't crash animation
            var that = this
            if (this.onPageChangeListener)
                setTimeout(function(){ that.onPageChangeListener(target) }, 0)
        },

        recalcHeight : function(){
            this.changeTarget(this.scroller)
        }
    }

    window.Scroll = Scroll;
})()
