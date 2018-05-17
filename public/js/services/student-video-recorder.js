'use strict';

angular.module('app')
    .service('StudentVideoRecorder',
    [
        function () {
            var service = {
                videoData:null,
                showVideoWidget:false,
                refreshWidget:function(){
                    this.videoData=null;
                    this.showVideoWidget=false;
                }
            }
            return service;
        }
    ]
);