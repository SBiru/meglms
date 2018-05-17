'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarFont',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/font.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var actions = fabricToolsActions.getActionsFor(scope.instanceId)
                scope.AVAILABLE_FONTS = AvailableFonts();
                scope.changeFontFamily = actions.setFontFamily;
                scope.changeFontSize = actions.setFontSize;
                scope.changeColor = actions.setColor;

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.fontFamily = instances[scope.instanceId].canvas._activeObject.getFontFamily();
                    scope.fontSize = instances[scope.instanceId].canvas._activeObject.getFontSize();
                    scope.fontWeigth = instances[scope.instanceId].canvas._activeObject.getFontWeight();
                    scope.fontColor = instances[scope.instanceId].canvas._activeObject.getColor();
                }

            }
        }

        function AvailableFonts(){
            return [
                'Arial, Arial, Helvetica, sans-serif',
                'Arial Black, Arial Black, Gadget, sans-serif',
                'Comic Sans MS, Comic Sans MS5, cursive',
                'Courier New, Courier New, Courier6, monospace',
                'Georgia1, Georgia, serif',
                'Impact, Impact5, Charcoal6, sans-serif',
                'Lucida Console, Monaco5, monospace',
                'Lucida Sans Unicode, Lucida Grande, sans-serif',
                'Palatino Linotype, Book Antiqua3, Palatino6, serif',
                'Tahoma, Geneva, sans-serif',
                'Times New Roman, Times, serif',
                'Trebuchet MS1, Helvetica, sans-serif',
                'Verdana, Verdana, Geneva, sans-serif',
                'Symbol, Symbol (Symbol2, Symbol2)',
                'Webdings, Webdings (Webdings2, Webdings2)',
                'Wingdings, Zapf Dingbats (Wingdings2, Zapf Dingbats2)',
                'MS Sans Serif4, Geneva, sans-serif',
                'MS Serif4, New York6, serif',
            ]
        }
    }])
}(angular))
