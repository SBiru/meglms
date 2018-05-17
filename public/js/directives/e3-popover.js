angular.module('app')

    .directive('e3Popover',
    [
        '$compile',
        '$templateCache',
        function ($compile,$templateCache) {
            return {
                restrict: 'A',
                scope: {
                    info:'=?'
                },
                link:function (scope, element, attrs) {
                    if(attrs.e3ContentTemplate){
                        var popOverContent= $templateCache.get(attrs.e3ContentTemplate)
                        popOverContent = $compile("<div>"+popOverContent+"</div>")(scope);
                    }
                    if(attrs.e3TitleTemplate){
                        var popOverTitle= $templateCache.get(attrs.e3TitleTemplate)
                        popOverTitle = $compile("<div>"+popOverTitle+"</div>")(scope);
                    }
                    var options = {
                        content:popOverContent,
                        title:popOverTitle
                    };
                    element.popover(options);
                }
            }
        }
    ]
);