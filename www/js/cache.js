(function(){
    var storage = window.localStorage

    function programs(){
        var availble = storage.getItem('programs') // array of cached programs

        if (availble)
            availble = JSON.parse(availble)
        else
            availble = []

        return availble
    }

    // Store a program and podcasts:
    /* 
        program = {
            name : String, // A Boat Is Good
            image : String,
            rss : String,
            podcasts : Array,
            key : String  // aboatisgood
        }
    */
    function cacheProgram (program) {
        var available = window.cache.getCachedPrograms()

        // Update program list if necessary
        if (available.indexOf(program.key) < 0)
            available.push(program.key)
        storage.setItem('programs', JSON.stringify(available))

        // Simple key naming scheme
        var podcastKey = program.key + '-podcasts'

        // Store program info and podcasts separately for much faster JSON parsing
        // during app initialization, allowing more control over initialization.
        storage.setItem(program.key, JSON.stringify({
            name : program.name,
            category : program.category,
            image : program.image,
            rss : program.rss,
            podcasts : podcastKey,
            key : program.key
        }))

        storage.setItem(podcastKey, JSON.stringify(program.podcasts))
    }

    // the cache manager
    window.cache = {
        // Returns array of available programs. Feed into getBasicInfo
        getCachedPrograms : programs,

        getObject : function (key) {
            return JSON.parse(storage.getItem(key))
        },

        putProgram : cacheProgram,

        clear : function (){
            storage.clear()
        }
    }
})()