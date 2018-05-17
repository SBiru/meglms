'use strict';
(function(angular,$){

    angular.module('ngFabric').factory('FabricActions',[
        'fabricCanvasActions',
        'fabricObjectActions',
        'fabricFileActions',
        'fabricToolsActions',
        function(Canvas,Objects,File,Tools){
            var Actions = function(id){
                this.objects = Objects.getActionsFor(id);
                this.file = File.getActionsFor(id);
                this.canvasAction = Canvas.getActionsFor(id);
                this.tools = Tools.getActionsFor(id);
                return this;
            }
            return {
                getActionsFor: function(id){ return new Actions(id)}
            }

    }])


}(angular,jQuery))
