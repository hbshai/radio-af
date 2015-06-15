(function() {
    var storage = window.localStorage;
    // a list of the program keys for each program that is fav'd; sorted in
    // the order they were added
    var favs = loadFromStorage();

    // Retrieve the favourite's list from localStorage
    function loadFromStorage() {
        var favs = storage.getItem("favs");
        if (favs) {
            favs = JSON.parse(favs);
        } else {
            favs = [];
        }
        return favs;
    }

    function saveFavourite(fav) {
        favs.push(fav);
        storage.setItem("favs", JSON.stringify(favs));
    }

    function getFavourites() {
        return favs;
    }

    function removeFavourite(fav) {
        var index = favs.indexOf(fav);
        favs.splice(index, 1);
        storage.setItem("favs", JSON.stringify(favs));
    }

    // Checks if program is fav'd
    function containsFav(program) {
        return favs.indexOf(program) !== -1;
    }

    // Currently not used, but heyyy
    function clearFavs() {
        storage.removeItem("favs");
    }

    // the favs manager
    window.favs = {
        addFav: saveFavourite,
        getFavs: getFavourites,
        containsProgram: containsFav,
        removeFav: removeFavourite,
        clearAllFavs: clearFavs
    };
})();
