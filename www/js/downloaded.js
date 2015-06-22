(function(GLOBAL) {

    // download.js stores its trackHash --> fileUrl map in localStorage

    var folder, // the directory where files are
        downloaded, // track hash --> file name
        system; // the file system

    function gotDir(dirEntry) {
        folder = dirEntry;
    }

    function gotFS(fileSystem) {
        system = fileSystem;

        fileSystem.root.getDirectory("downloaded", {
            create: true
        }, gotDir);

        downloaded = window.localStorage.getItem("_downloaded");

        if (downloaded) {
            downloaded = JSON.parse(downloaded);
        } else {
            downloaded = {};
        }
    }

    function fail(error) {
        console.log("Error creating file [" + error.name + "]: " + error.message);
    }

    var downloadQueue = [], // Does not persist between restarts
        currentDownload;

    function gotFile(fileEntry) {
        var localUrl = fileEntry.toURL();
        console.log(fileEntry)

        var fileTransfer = new FileTransfer();
        var uri = encodeURI(currentDownload.podcast.podcastUrl);
        console.log("Downloading " + uri + " to " + localUrl);

        fileTransfer.download(
            uri,
            localUrl,
            function(entry) {
                console.log('Transfer success::begin')
                downloaded[currentDownload.hash] = localUrl;
                
                window.localStorage.setItem("_downloaded", JSON.stringify(downloaded));
                window.handlers.fileTransferSuccess(currentDownload.podcast, currentDownload.hash);

                currentDownload = undefined
                if (downloadQueue.length > 0) {
                    setTimeout(downloadNext, 250);
                }
                console.log('Transfer success::end')

            },
            function(error) {
                console.log('Transfer abort::begin')

                window.handlers.fileTransferError(currentDownload, error);
                console.log('Transfer abort::callback done')

                currentDownload = undefined
                if (downloadQueue.length > 0) {
                    console.log('Transfer abort::setting timeout')
                    setTimeout(downloadNext, 250);
                }
                console.log('Transfer abort::done')
            }
        );

        currentDownload.transfer = fileTransfer;

        var lastUpdate = Date.now() - 2000,
            queryMini = "[data-podcast-program='" + currentDownload.podcast.author + "']"
                + "[data-podcast-index='" + currentDownload.podcast.index + "']"
                + " > div > .podd-dl",
            querySpot = "[data-podcast-program='" + currentDownload.podcast.author + "']"
                + "[data-podcast-index='" + currentDownload.podcast.index + "']"
                + " > div > .spotlight-dl";

        fileTransfer.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable && (Date.now() - lastUpdate >= 1000)) {
                var progress = Math.floor(100 * (progressEvent.loaded / progressEvent.total)) + "%"
                console.log('UI update: ' + progress)
                $(queryMini).text(progress);
                $(querySpot).text(progress);
                lastUpdate = Date.now()
            }
        };
    }

    function downloadNext() {
        console.log('downloadnext::begin')
        if (downloadQueue.length === 0 || currentDownload) {
            console.log('downloadnext::bail')
            return;
        }

        console.log('Alright, begin downloading: ' + downloadQueue[0].hash)
        currentDownload = downloadQueue.shift();

        // currentDownload.url is something like //blabla/blabla/bla/fileidentifier.mp3
        // We want only the fileidentifier.mp3 part
        var fileIdentifier = currentDownload.podcast.podcastUrl.split(/\//g).slice(-1)[0];

        folder.getFile(fileIdentifier, {
            create: true,
            exclusive: false
        }, gotFile);
        console.log('downloadnext::end')
    }

    function queueDownload(hash, podcast) {
        console.log('QUEUE DOWNLOAD: ' + hash)
        downloadQueue.push({
            hash: hash,
            podcast: podcast
        });
        
        if (downloadQueue.length === 1 && !currentDownload) {
            console.log('Download next!: ' + hash)
            downloadNext();
        }
    }

    function removeFile(fileEntry) {
        var podd = this.podcast,
            hash = this.hash

        fileEntry.remove(function(){
            window.handlers.fileRemoveSuccess(podd, hash)
        }, window.handlers.fileRemoveFail);
    }

    function removeHash(trackHash, podcast) {
        if (!downloaded[trackHash]) {
            console.log("I dunno about this one really: " + trackHash)
            return;
        }

        window.resolveLocalFileSystemURL(downloaded[trackHash], removeFile.bind({
            hash : trackHash,
            podcast : podcast
        }), function(error){
            console.log(error)
        });

        delete downloaded[trackHash];
        window.localStorage.setItem("_downloaded", JSON.stringify(downloaded));
    }

    // the download manager
    window.dlman = {
        init: function(fs) {
            gotFS(fs)
        },
        // track hash can be anything, but should probably be program+stuff
        has: function(trackHash) {
            return downloaded.hasOwnProperty(trackHash);
        },
        // Get the URI of a track
        get: function(trackHash) {
            return downloaded[trackHash];
        },
        download: function(podcast, trackHash) {
            queueDownload(trackHash, podcast);
        },
        downloading : function(trackHash){
            return currentDownload && currentDownload.hash === trackHash
        },
        queued : function (trackHash){
            for (var i = 0; i < downloadQueue.length; i++){
                if (downloadQueue[i].hash === trackHash){
                    return true;
                }
            }
            return false;
        },
        remove: function(trackHash, podcast) {
            removeHash(trackHash, podcast);
        },
        abort : function(trackHash){
            if (currentDownload && trackHash === currentDownload.hash) {
                if (currentDownload.transfer) {
                    currentDownload.transfer.abort()
                } else {
                    console.log('OH SHIT!')
                    currentDownload = undefined
                    setTimeout(downloadNext, 250)
                }

                return true;
            }

            for (var i = 0; i < downloadQueue.length; i++){
                if (downloadQueue[i].hash === trackHash){
                    downloadQueue.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    };

})(window);