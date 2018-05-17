E3replaceUrl = function(text){
    //youtube videos
    if(text.match(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^<|>|"|']*)(?![^<]*>)/g)){
        text = text.replace(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^<|>|"|']*)(?![^<]*>)/g, '<iframe width="420" height="345" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');}

    //images
    else if(text.match(/((https|http)?:\/\/[^<|>|"|']*\.(?:png|jpg))(?![^<]*>)/i)){
        text = text.replace(/((https|http)?:\/\/[^<|>|"|']*\.(?:png|jpg))(?![^<]*>)/ig,'<img src="$1" width="225" height="100" alt="alt description" title="image title" class="image_classes" />')
    }

    //videos
    else if(text.match(/((https|http)?:\/\/[^<|>|"|']*\.(?:mp4|avi|ogv|webm))(?![^<]*>)/g)){
        text = text.replace(/((https|http)?:\/\/[^<|>|"|']*\.(mp4|avi|ogv|ogg|webm))(?![^<]*>)/g,'<video width="420" height="345" class="video-js vjs-default-skin" preload="none" controls><source src="$1" type="video/$3" /></video>')
    }

    //flash
    else if(text.match(/((https|http)?:\/\/[^<|>|"|']*\.(?:swf))(?![^<]*>)/g)){
        text = text.replace(/((https|http)?:\/\/[^<|>|"|']*\.(?:swf))(?![^<]*>)/g,'<object width="420" height="345" data="$1"></object>')
    }

    //normal url
    else
        text = text.replace(/((http|https):\/\/[^\s|<|>|"|']+(?![^<]*>))/gi, '<a href="$1">$1</a>');

    return text;
}
