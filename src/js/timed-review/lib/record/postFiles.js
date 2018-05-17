
module.exports = postFiles

// this function submits both audio/video or single recorded blob to nodejs server
function postFiles(audio, video) {
    // getting unique identifier for the file name
    var fileName;
    fileName = generateRandomString();

    // this object is used to allow submitting multiple recorded blobs
    var files = {};

    // recorded audio blob
    files.audio = {
        name: fileName + '.' + audio.blob.type.split('/')[1],
        type: audio.blob.type,
        contents: audio.dataURL
    };

    if (video) {
        files.video = {
            name: fileName + '.' + video.blob.type.split('/')[1],
            type: video.blob.type,
            contents: video.dataURL
        };
    }

    files.uploadOnlyAudio = !video;

    videoElement.src = '';
    videoElement.poster = '/ajax-loader.gif';

    xhr('/upload', JSON.stringify(files), function(_fileName) {
        var href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
        videoElement.src = href + 'uploads/' + _fileName;
        videoElement.play();
        videoElement.muted = false;
        videoElement.controls = true;

        var h2 = document.createElement('h2');
        h2.innerHTML = '<a href="' + videoElement.src + '">' + videoElement.src + '</a>';
        document.body.appendChild(h2);
    });

    if (mediaStream) mediaStream.stop();
}


// XHR2/FormData
function xhr(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseText);
        }
    };

    request.upload.onprogress = function(event) {
        progressBar.max = event.total;
        progressBar.value = event.loaded;
        progressBar.innerHTML = 'Upload Progress ' + Math.round(event.loaded / event.total * 100) + "%";
    };

    request.upload.onload = function() {
        percentage.style.display = 'none';
        progressBar.style.display = 'none';
    };
    request.open('POST', url);
    request.send(data);
}


// generating random string
function generateRandomString() {
    if (window.crypto) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}
