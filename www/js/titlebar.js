// window.titlebar.onPageChange(newPageEl)
// window.titlebar.onScroll(x, y)
// window.titlebar.init(staticTitleBar)
(function(GLOBAL) {

    var thresholdY = 210,
        hackTitleVisible = false,
        staticTitleBar = undefined;

    /* Mount a page title bar: compute threshold and update text */
    function mount(titleEl) {
        thresholdY = 0;

        // Setting textContent will obliterate any data in the element; so
        // make sure that staticTitleBar only contains text. The menu icon
        // is overlapped using a higher z-index.
        staticTitleBar.textContent = titleEl.textContent;

        // Walk the chain upwards. Each iteration gets distance to top
        // of the parent node. Typically 2-3 iterations. Will probably lag anyway.
        if (titleEl.offsetParent) {
            do {
                thresholdY += titleEl.offsetTop;
                titleEl = titleEl.offsetParent;
            } while (titleEl);
        }
    }

        function pageChangeHandler(pageEl) {
            // Search for a child element that has the child
            var titleBar = pageEl.querySelector(".title-bar");

            if (titleBar) {
                mount(titleBar);
            } else {
                // Somehow the page we moved to hasn't a title bar - so hackily disable ourselves
                thresholdY = 999999;
            }

            // If we go from a page where we previously didn't show the bar
            // to a page where we already are scrolled past the threshold,
            // make sure to show title bar. Also check for the opposite.
            // This is actually what the scroll listener does, so reuse it.
            pageMovementHandler(0, window.app.scroller.y);
        }

        function pageMovementHandler(x, y) {
            // Because scrolling is a little bit insane, y-axis is negative so fix it:
            y = -y;

            // Only do the css shit if we acutally need to: it's costly...
            if ((!hackTitleVisible && y >= thresholdY)
                || (hackTitleVisible && y < thresholdY)) {
                hackTitleVisible = !hackTitleVisible;

                // Moving off screen is faster than toggling visibility (no reflow needed)
                staticTitleBar.style.top = hackTitleVisible ? "0px" : "-1000px";
            //staticTitleBar.style.display = hackTitleVisible ? 'block' : 'none'
            }

        }

        GLOBAL.titlebar = {
            onPageChange: pageChangeHandler,

            onScroll: pageMovementHandler,

            // Assume that we don't need to do any title bar toggling here.
            init: function(el) {
                staticTitleBar = el; //document.body.querySelector('#title-bar-fixed')

                if (!staticTitleBar) {
                    console.err("Static title bar not provided! (titlebar.js)");
                }
            }
        };
    })(window);