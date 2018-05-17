app.directive('resize', ['$window','resizeService',function ($window,resizeService) {
    return {
        restrict: 'E',
        scope:{
            resizeY:'=?',
            resizeW:'=?',
            trigger:'=?'
        },
        link:function (scope, element, attr){
        scope.trigger = resizeService.create();
        var w = angular.element($window);
        function doResize(){
            return scope.trigger.doResize()
        }
        scope.$watch(doResize,function(doResize){
            if(doResize){
                if(scope.resizeY) scope.resizeY(scope.windowHeight,element);
                if(scope.resizeW) scope.resizeW(scope.windowWidth,element);
            }else{
                element.css('width', 'auto');
                element.css('height', 'auto');
                if(scope.resizeY) scope.resizeY(scope.windowHeight,element,false);
                if(scope.resizeW) scope.resizeW(scope.windowWidth,element,false);

            }
        })
        scope.$watch(function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        }, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            if(!scope.trigger.doResize()){
                element.css('width', 'auto');
                element.css('height', 'auto');
                if(scope.resizeY) scope.resizeY(scope.windowHeight,element,false);
                if(scope.resizeW) scope.resizeW(scope.windowWidth,element,false);
                return;
            }

            if(scope.resizeY) scope.resizeY(scope.windowHeight,element);
            if(scope.resizeW) scope.resizeW(scope.windowWidth,element);
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
    }
}]).factory('resizeService',function(){
    function Resize(){
        this._doResize = false;
    }
    Resize.prototype = {
        setResize: function(doResize){
            this._doResize=doResize
        },
        doResize: function(doResize){
            return this._doResize;
        }
    }
    return {
        create:function(){
            return new Resize();
        }
    }
});