'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricToolsActions',['canvasInstances',function(instances){
        var ToolsActions = function(id){
            function checkAndSetProperty(property,value,isFunc){
                var object = instances[id].canvas._activeObject;
                if(!object) return;
                if(isFunc)
                    object[property](value);
                else
                    object[property] = value;
                instances[id].canvas.renderAll();
            }

            var DEFAULT_ACTIONS = ['setStrokeWidth','setStroke','setFontFamily','setFontSize','setFill','setColor',{prop:'strokeDashArray',isFunc:false}];
            function createDefaultHandlers(){
                var handlers = {};
                DEFAULT_ACTIONS.forEach(function(action){
                    if(typeof action == 'object')
                        handlers[action.prop]= function(value){checkAndSetProperty(action.prop,value,action.isFunc);}
                    else
                        handlers[action]= function(value){checkAndSetProperty(action,value,true);}
                })
                return handlers
            }
            return _.extend({},createDefaultHandlers());

        }
        return {
            getActionsFor: function(id){ return new ToolsActions(id)}
        }
        
    }])
}(angular,jQuery))
