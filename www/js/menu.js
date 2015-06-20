(function(GLOBAL) {

    var menu, toMove,
        isVisible = false,
        stylesheet = (function() {
            var style = document.createElement("style");

            // WebKit hack :(
            style.appendChild(document.createTextNode(""));

            // Add the <style> element to the page
            document.head.appendChild(style);

            return style.sheet;
        })();

    function touchStart(evt) {
        var cl = evt.target.classList
        if (evt.target !== menu && !cl.contains("menu-item") && !cl.contains("menu-footer")) {
            document.addEventListener("touchend", touchEnd, false);

            evt.preventDefault();
            evt.stopPropagation();
        }
    }
    function touchEnd(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        setHidden();

        document.removeEventListener("touchend", touchEnd, false);
        document.removeEventListener("touchstart", touchStart, false);
    }

    function initialize() {
        // The menu element is the first argument
        menu = arguments[0];

        // The remaining ones are to be moved (.menu-slide'ed)
        toMove = new Array(arguments.length - 1);
        for (var i = 0; i < arguments.length - 1; i++) {
            toMove[i] = arguments[i + 1];
        }

        stylesheet.insertRule(".menu-slide { left: " + menu.offsetWidth + "px !important; }", 0);
    }

    function setVisible(event) {
        if (isVisible) {
            return;
        }
        isVisible = true;

        window.app.scroller.scrollBy(menu.offsetWidth, 0);
        window.app.scroller.unregisterEvents();

        for (var i = toMove.length - 1; i >= 0; i--) {
            toMove[i].classList.add("menu-slide");
        }

        menu.classList.add("menu-active");

        document.addEventListener("touchstart", touchStart, false);
    }

    function setHidden(event) {
        if (!isVisible) {
            return;
        }
        isVisible = false;

        window.app.scroller.scrollBy(-menu.offsetWidth, 0);
        window.app.scroller.registerEvents();

        for (var i = toMove.length - 1; i >= 0; i--) {
            toMove[i].classList.remove("menu-slide");
        }

        menu.classList.remove("menu-active");
    }

    GLOBAL.menu = {
        init: initialize,
        show: setVisible,
        hide: setHidden,
        unregister: function() {
            document.removeEventListener("touchend", touchEnd, false);
            document.removeEventListener("touchstart", touchStart, false);
        }
    };
})(window);