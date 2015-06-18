(function() {
    // How much momentum should we get when releasing?
    var momentum = function(originY, endY, prevY, dt) {
            // originY = screen coord where touch started
            // endY = screen coord where touch ended
            // dt = time of interaction in seconds
            return 1.2 * ((endY - originY) / dt);
        },
        updateMomentum = function(velY, t) {
            // velY = velocity
            // t = time elapsed in seconds
            return velY * 0.96; // static friction
        },
        // should go from 0 --> 1
        // EASE OUT: ( 1 - Math.sqrt(1 - t * t) )
        easing = function(t) {
            return t; // linear
        },

        // Browser capabilities
        nextFrame = (function() {
            return window.requestAnimationFrame
                || window.webkitRequestAnimationFrame
                || function(callback) {
                    return setTimeout(callback, 17);
                };
        })(),
        cancelFrame = (function() {
            return window.cancelRequestAnimationFrame
                || window.webkitCancelRequestAnimationFrame
                || clearTimeout;
        })();

    // Constructor
    var Scroll = function(wrapper, miniPlayerHeight) {
        // The mini player eats some space, let's give it back!
        this.offsetHeight = miniPlayerHeight || 0;

        this.wrapper = document.querySelector(wrapper);
        this.wrapper.style.overflow = "hidden";

        // Default options
        this.options = {
            slider: wrapper + " > div",
            pages: wrapper + " > div > div",
        };

        this.slider = document.querySelector(this.options.slider);
        this.refreshPages();

        var self = this;
        function _bind(fn) {
            return function() {
                fn.apply(self, arguments);
            };
        }

        // Bind all references so register/unregister works (_bind returns new function)
        this.boundStart = _bind(this.touchStart);
        this.boundMove = _bind(this.touchMove);
        this.boundEnd = _bind(this.touchEnd);
        this.boundCancel = _bind(this.touchCancel);

        this.registerEvents();

        this.MOMENTUM_RENDER = this.renderMomentum.bind(this);
        this.ANIMATION_RENDER = this.render.bind(this);
    };

    Scroll.prototype = {
        x: 0,
        y: 0, // current position

        boundStart: undefined,
        boundMove: undefined,
        boundEnd: undefined,
        boundCancel: undefined,

        // touch start sets these to the origin point, also records time
        screenX: 0,
        screenY: 0,
        startTime: 0,

        // touch move updates these to previous touch point
        prevX: 0,
        prevY: 0,

        // touch move locks in either X or Y axis after some distance
        locked: undefined,

        // use this to calculate nice momentum distance
        // TODO: Replace with actual velocity instead...
        momentumY: 0,
        lastTouchTime: 0,

        // NOT momentum
        animation: {
            dx: 0,
            dy: 0,
            ox: 0,
            oy: 0,
            startTime: 0
        },

        // REAL momentum
        momentum: {
            vy: 0,
            startTime: 0
        },

        // The handle for timer updated movement (animation/momentum)
        frame: undefined,

        // bound versions of the functions for extra nice ice cream
        MOMENTUM_RENDER: undefined,
        ANIMATION_RENDER: undefined,

        // event listeners, use sparingly, especially onScroll
        onScrollListener: undefined, // called on move()
        onPageChangeListener: undefined, // called on changeTarget()

        lastPageIndex: -1,

        // This is probably perferrable to using insertPage/removePage
        refreshPages: function() {
            var pages = document.querySelectorAll(this.options.pages),
                len = pages.length, i;

            // setup slider/page sizes
            var windowWidth = window.innerWidth,
                pageWidth = windowWidth + "px";

            this.slider.style.width = (len * windowWidth) + "px";

            // copy NodeList to Array
            this.pages = new Array(len);
            for (i = 0; i < len; i++) {
                this.pages[i] = pages[i];
                this.pages[i].style.width = pageWidth;
            }

            this.currentPage = this.currentPage || 0;
            if (len > 0) {
                this.changeTarget(this.pages[this.currentPage]);
            }
        },

        // insert a new page into the dom, returns the page index of it
        // insert el before or after page pointed by targetIndex
        insertPage: function(el, targetIndex, after) {
            try {
                var tmp = this.pages[targetIndex];
            } catch (e) {
                console.log("Scroller::insertPage -- targetEl is now targetIndex. Specify page number instead of element.");
            }

            if (after) {
                targetIndex++;
            }

            if (this.lastPageIndex !== -1) {
                console.log(this.pages[this.lastPageIndex]);
                if (this.lastPageIndex < targetIndex) {
                    targetIndex--;
                }

                this.removePage(this.lastPageIndex);
            }

            for (k in app.views.index) {
                if (app.views.index[k] >= targetIndex) {
                    app.views.index[k]++;
                }
            }
            console.log(app.views.index);

            this.lastPageIndex = targetIndex;

            var targetEl = this.pages[targetIndex];

            this.pages.splice(targetIndex, 0, el);
            if (!targetEl) {
                this.slider.appendChild(el);
            } else {
                this.slider.insertBefore(el, targetEl);
            }

            var width = window.innerWidth;
            el.style.width = width + "px";
            this.slider.style.width = this.pages.length * width + "px";

            if (this.currentPage < targetIndex) {
                // we insert page to the right, it's fine
            } else if (this.currentPage >= targetIndex) {
                // we insert page to the left, must probably scroll some
                this.currentPage++;
                this.gotoPage(this.currentPage);
            }

            return targetIndex;
        },

        // remove a page from the DOM
        removePage: function(targetIndex) {
            var el = this.pages[targetIndex];

            for (k in app.views.index) {
                if (app.views.index[k] > targetIndex) {
                    app.views.index[k]--;
                }
            }

            // We need to remove page from both list and dom
            this.pages.splice(targetIndex, 1);
            this.slider.removeChild(el);

            // update wrapper width; it handles the overflow and shit
            this.slider.style.width = this.pages.length * window.innerWidth + "px";

            // Give browser some time before doing the animation
            if (this.currentPage < targetIndex) {
                // we removed page to the right, it's fine
            } else if (this.currentPage >= targetIndex) {
                // we removed page to the left, must probably scroll some
                this.currentPage--;
                this.gotoPage(this.currentPage);
            }
        },

        move: function(x, y) {
            this.slider.style["webkitTransform"] = "translate3d(" + x + "px,0,0)";
            this.scroller.style["webkitTransform"] = "translate3d(0," + y + "px,0)";

            this.onScrollListener(x, y);

            this.x = x;
            this.y = y;
        },

        touchStart: function(e) {
            if (this.frame) {
                cancelFrame(this.frame);
                this.frame = undefined;
            }

            // Ignore touchstart if more than 1 touch points are active
            if (e.touches.length > 1) {
                e.preventDefault();
                return;
            }

            var touch = e.changedTouches[0];

            // screen coordinates
            this.screenX = this.prevX = touch.pageX;
            this.screenY = this.prevY = touch.pageY;

            // Make sure direction lock is off
            this.locked = undefined;

            // record time when finger first makes contact with surface
            this.startTime = this.lastTouchTime = Date.now() ;
            this.momentumY = this.screenY;

            // TODO: Remove
            console.log(e.target.id);
        },

        touchMove: function(e) {
            // Always stop browser from doing its thing 
            e.preventDefault() ;

            if (e.touches.length > 1) {
                return;
            }

            var touch = e.changedTouches[0],
                distX = touch.pageX - this.prevX,
                distY = touch.pageY - this.prevY;

            this.prevX = touch.pageX;
            this.prevY = touch.pageY;

            if (!this.locked) {
                var dx = this.screenX - touch.pageX,
                    dy = this.screenY - touch.pageY;

                // only lock after touch has moved *enough* in either direction
                if (dx * dx > 9 || dy * dy > 9) {
                    this.locked = Math.abs(dx) > Math.abs(dy) ? 1 : 2;
                }
            }

            // locked = 1 means X-lock (only moves in X axis)
            // locked = 2 means Y-lock (only moves in Y axis)
            if (this.locked === 1) {
                distY = 0;
            } else if (this.locked === 2) {
                distX = 0;
            } else {
                distX = distY = 0;
            } // no lock, no move

            if (Date.now() >= this.lastTouchTime + 300) {
                this.lastTouchTime = Date.now();
                this.momentumY = this.prevY;
            }

            this.move(this.x + distX, this.y + distY);
        },

        touchCancel: function(e) {
            // Always stop browser from doing its thing 
            e.preventDefault();

            if (e.touches.length > 1) {
                return;
            }

            if (this.frame) {
                return;
            }

            this.touchEnd(e);
        },

        touchEnd: function(e) {
            // Always stop browser from doing its thing 
            //e.preventDefault();

            if (e.touches.length > 1) {
                return;
            }

            // distance from start point (screen coords), ignore x if locked to y-axis
            var totalX = (this.locked === 2) ? 0 : e.changedTouches[0].pageX - this.screenX,
                dt = (Date.now() - this.startTime) / 1000.0,
                vx = (dt !== 0) ? totalX / dt : 0;

            // Do this to fix scrolling for slow interactions
            if (Date.now() >= this.lastTouchTime + 300) {
                this.momentumY = this.prevY;
            }

            // Fix pos if scrolled outside
            if (this.enforceBounds()) {
                /* Do nothing */
            } else if (totalX <= -0.5 * window.innerWidth || (vx < -200)) {
                this.nextPage();
            } // this will animate to correct pos
            else if (totalX >= 0.5 * window.innerWidth || (vx > 200)) {
                this.prevPage();
            } // this will animate to correct pos
            else {
                // User scrolled some, but not outside and not enough to
                // change page. Do the x-reset. Otherwise scroll on!
                var fix = -(this.currentPage) * window.innerWidth - this.x;

                if (fix !== 0) {
                    this.scrollBy(fix, 0);
                } else {
                    this.scrollMomentum(e);
                }
            }
        },

        gotoPage: function(page) {
            this.currentPage = page;
            this.changeTarget(this.pages[this.currentPage]);
            // Reset pos to X of the new page
            this.scrollBy(-(this.currentPage) * window.innerWidth - this.x, 0);
        },
        nextPage: function() {
            this.gotoPage(this.currentPage + 1);
        },
        prevPage: function() {
            this.gotoPage(this.currentPage - 1);
        },

        scrollMomentum: function(e) {
            var touch = e.changedTouches[0],
                dt = (Date.now() - this.startTime) / 1000.0,
                dy = Math.abs(this.momentumY - touch.pageY);

            if (this.frame) {
                cancelFrame(this.frame);
            }

            // Don't scroll if user moved very slow towards the end,
            // like a sweep-then-stop (pan motion).
            if (dy < 8) {
                return;
            }

            this.momentum.elapsed = 0;
            this.momentum.frameTime = Date.now();
            this.momentum.vy = momentum(this.screenY, touch.pageY, this.prevY, dt);
            this.frame = nextFrame(this.MOMENTUM_RENDER);
        },

        renderMomentum: function() {
            var t = Date.now(),
                dt = (t - this.momentum.frameTime) / 1000;

            this.momentum.frameTime = t;
            this.momentum.elapsed += dt;

            this.momentum.vy = updateMomentum(this.momentum.vy, this.momentum.elapsed);

            var newY = this.y + this.momentum.vy * dt;
            // Slow momentum when we hit upper or lower bound (where page ends)
            if (newY > 0 || newY < this.height) {
                this.momentum.vy *= 0.85;
            }

            this.move(this.x, newY);

            if (this.momentum.vy * this.momentum.vy > 64) {
                this.frame = nextFrame(this.MOMENTUM_RENDER);
            } else {
                this.frame = undefined;
                // Scroll to top (if upper bound was hit) or bottom
                if (newY > 0) {
                    this.scrollBy(0, -newY);
                } else if (newY < this.height) {
                    this.scrollBy(0, this.height - this.y);
                }
            }
        },

        scrollBy: function(dx, dy) {
            if (this.frame) {
                cancelFrame(this.frame);
            }

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
        render: function() {
            var t = (Date.now() - this.animation.startTime) / 200.0;

            // Clamp t to 1 for 0 over-shoot, also request next frame if possible
            if (t > 1) {
                t = 1;
                this.frame = undefined;
            } else {
                this.frame = nextFrame(this.ANIMATION_RENDER);
            }

            var ease = easing(t),
                dx = this.animation.dx * ease,
                dy = this.animation.dy * ease;

            this.move(this.animation.ox + dx, this.animation.oy + dy);
        },

        // change target of Y-scrolling, necessary when changing to a new page
        changeTarget: function(target) {
            this.scroller = target;

            // Get y-pos of new target; because each page is scrolled independantly in y-axis
            var matrix = window.getComputedStyle(this.scroller, null)["webkitTransform"].replace(/[^0-9-.,]/g, "").split(",");
            this.y = matrix[5] * 1 || 0;

            // Figure out new height because each page can be of different height
            this.height = this.wrapper.clientHeight - this.scroller.offsetHeight;
            this.height -= this.offsetHeight;

            if (this.height > 0) {
                this.height = 0;
            }

            this.onPageChangeListener(target);
        },

        recalcHeight: function() {
            this.changeTarget(this.scroller);
            this.enforceBounds();
        },

        enforceBounds: function() {
            var outsideX = 0,
                outsideY = 0;

            // outside left or right boundary
            if (this.x > 0) {
                outsideX = 0 - this.x;
            } else if (this.x < -(this.pages.length - 1) * window.innerWidth) {
                outsideX = -(this.pages.length - 1) * window.innerWidth - this.x;
            }

            // outside top or bot boundary
            if (this.y > 0) {
                outsideY = 0 - this.y;
            } else if (this.y < this.height) {
                outsideY = this.height - this.y;
            }

            // Fix pos if scrolled outside
            if (outsideX !== 0 || outsideY !== 0) {
                this.scrollBy(outsideX || (-(this.currentPage) * window.innerWidth - this.x), outsideY);
            }

            return outsideX !== 0 || outsideY !== 0;
        },

        registerEvents: function() {
            this.wrapper.addEventListener("touchstart", this.boundStart, false);
            this.wrapper.addEventListener("touchmove", this.boundMove, false);
            this.wrapper.addEventListener("touchend", this.boundEnd, false);
            this.wrapper.addEventListener("touchcancel", this.boundCancel, false);
        },

        unregisterEvents: function() {
            this.wrapper.removeEventListener("touchstart", this.boundStart, false);
            this.wrapper.removeEventListener("touchmove", this.boundMove, false);
            this.wrapper.removeEventListener("touchend", this.boundEnd, false);
            this.wrapper.removeEventListener("touchcancel", this.boundCancel, false);
        }
    };

    window.Scroll = Scroll;
})();
