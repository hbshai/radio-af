(function() {
    var db = {},
        fileSystem,
        cacheFile,
        //
        _appCallback,
        _dontLoad,
        _wantTruncate;

    // Timeout id and stuff for save()
    var _tid,
        _fileWriter,
        _wantTruncate = false,
        _dontLoad = false,
        _writing = false,
        _write = function() {
            if (_writing) {
                setTimeout(_write, 10000);
                return;
            }

            _writing = true;
            cacheFile.createWriter(function(writer) {
                // HOLY SHIT WOOP WOOP
                if (_wantTruncate) {
                    writer.truncate(0);
                    _wantTruncate = false;
                }
                writer.onwrite = _done;
                try {
                    writer.write(JSON.stringify(db));
                } catch (e) {
                    console.log(e);
                }
            });
        },
        _done = function() {
            console.log("ok, cache saved.");
            _writing = false;
        };

    // Wrapper around the localStorage API, with some added methods
    var storage = {
        getItem: function(key) {
            return db[key];
        },
        setItem: function(key, value) {
            db[key] = value;
            this.save();
        },
        removeItem: function(key) {
            db[key] = undefined;
            delete db[key];
            this.save();
        },

        save: function() {
            if (_tid) {
                clearTimeout(_tid);
            }
            _tid = setTimeout(_write, 5000);
        },
        load: function() {
            // get the file entry
            fileSystem.root.getFile("radioaf-cache", {
                create: true,
                exclusive: false
            }, function gotFileEntry(fileEntry) {
                cacheFile = fileEntry;
                // get the file handle
                fileEntry.file(function(file) {
                    console.log(file);
                    if (file.size === 0 || _dontLoad) {
                        db = {};
                        _appCallback();
                        return;
                    }

                    var reader = new FileReader();
                    reader.onloadend = function(evt) {
                        try {
                            db = JSON.parse(evt.target.result);
                        } catch (e) {
                            console.log(evt.target.result);
                            console.log(e);
                        }
                        _appCallback();
                    };
                    reader.readAsText(file);
                }, window.alert);
            });
        }
    };

    function programs() {
        var availble = storage.getItem("programs"); // array of cached programs

        if (!availble) {
            availble = [];
        }

        return availble;
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
    function cacheProgram(program) {
        var available = window.cache.getCachedPrograms();

        // Update program list if necessary
        if (available.indexOf(program.key) < 0) {
            available.push(program.key);
        }
        storage.setItem("programs", available);
        storage.setItem(program.key, program);
    }

    // the cache manager
    window.cache = {
        init: function(fs, callb) {
            fileSystem = fs;
            _appCallback = callb;
            storage.load();
        },
        // Returns array of available programs. Feed into getBasicInfo
        getCachedPrograms: programs,

        getObject: function(key) {
            return storage.getItem(key);
        },

        putProgram: cacheProgram,

        clear: function() {
            _dontLoad = true;
            _wantTruncate = true;
        }
    };
})();