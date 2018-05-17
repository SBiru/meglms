angular.module('app').directive('adjustplaysize',[function(){
    return {
        restrict:'A',
        link: function( scope, element, attrs ) {
            if(element.prop('tagName')!=='VIDEO') return;

            var video = element[0];
            var playheight = attrs.playheight || attrs.height;
            var playwidth = attrs.playwidth || attrs.width;
            var isResized = false;


            bindEvents();
            function bindEvents(){
                video.addEventListener('ended',onEnded);
                video.addEventListener('play',onPlay);
            }
            function onEnded(){
                resize(attrs.width,attrs.height);
                isResized = false;
                video.load();
            }
            function onPlay(){
                if(isResized) return;
                resize(playwidth,playheight);
                isResized = true;
            }
            function resize(width,height){
                var player = $(video).data('player');
                if(width)
                    player && player.width(width);
                if(height)
                    player && player.height(height);
            }
        }
    }
}]);