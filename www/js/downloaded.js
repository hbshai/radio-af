(function (GLOBAL){

    var folder,         // the directory where files are
        downloaded,     // track hash --> file name
        system          // the file system

    function gotDir(dirEntry){
        folder = dirEntry;

        downloaded = window.localStorage.getItem('_downloaded')

        if (downloaded)
            downloaded = JSON.parse(downloaded)
        else
            downloaded = {}

        console.log('got file system:' + system.name)
    }

    function gotFS(fileSystem) {
        system = fileSystem
        fileSystem.root.getDirectory('downloaded', { create: true }, gotDir)
    }

    function fail(error) {
        console.log('Error creating file [' + error.name + ']: ' + error.message)
    }

    var downloadQueue = [], // Does not persist between restarts
        currentDownload

    function gotFile(fileEntry){
        var localPath = fileEntry.fullPath;
        var localUrl = fileEntry.toURL();

        currentDownload.path = fileEntry.toNativeURL()

        console.log('Loaded local path: ' + localPath);
        console.log('Loaded local url: ' + localUrl);
        console.log('Download.path: ' + currentDownload.path)

        var fileTransfer = new FileTransfer();
        var uri = encodeURI(currentDownload.url);
        console.log('Downloading ' + uri + ' to ' + localPath);

        fileTransfer.download(
            uri,
            localUrl,
            function(entry) {
                console.log('download complete (path): ' + entry.fullPath)
                console.log('download complete (url): ' + entry.toURL())
                console.log('download complete (native): ' + entry.toNativeURL())
                
                downloaded[currentDownload.hash] = entry.toNativeURL()
                window.handlers.fileTransferComplete(currentDownload.hash, entry.toNativeURL())
                window.localStorage.setItem('_downloaded', JSON.stringify(downloaded))

                if (downloadQueue.length > 0)
                    downloadNext()
            },
            function(error) {
                window.handlers.fileTransferError(currentDownload, fileEntry, fileTransfer, error)
                if (downloadQueue.length > 0)
                    downloadNext()
            }
        )
    }

    function downloadNext(){
        currentDownload = downloadQueue.shift()

        // currentDownload.url is something like //blabla/blabla/bla/fileidentifier.mp3
        // We want only the fileidentifier.mp3 part

        folder.getFile(currentDownload.url.split(/\//g).slice(-1), { create: true, exclusive: false }, gotFile)
    }

    function queueDownload(hash, url) {
        downloadQueue.push({ hash : hash, url : url })

        if (downloadQueue.length === 1)
            downloadNext()
    }

    function removeFile(fileEntry){
        fileEntry.remove(window.handlers.fileRemoveSuccess, window.handlers.fileRemoveFail)
    }

    function removeHash(trackHash){
        if (!downloaded[trackHash])
            return;

        folder.getFile(downloaded[trackHash], { create: false, exclusive: false }, removeFile)

        delete downloaded[trackHash]
        window.localStorage.setItem('_downloaded', JSON.stringify(downloaded))
    }

    // the download manager
    window.dlman = {
        init : function (){
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
        },
        // track hash can be anything, but should probably be program+stuff
        has : function(trackHash) {
            return downloaded.hasOwnProperty(trackHash)
        },
        // Get the URI of a track
        get : function(trackHash) {
            return downloaded[trackHash]
        },
        download : function (podcastUrl, trackHash) {
            queueDownload(hash, url)
        },
        remove : function (trackHash) {
            removeHash(trackHash)
        }
    }
    
})(window)