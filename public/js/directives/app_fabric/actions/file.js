'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricFileActions',['fabricCanvasActions','fabricObjectActions','FabricTemplatesApi','canvasInstances',function(fabricCanvasActions,fabricObjectActions,api,canvasInstances){
        function handleError (error,callBackError){
            if(error.data.showToUser){
                toastr.error(error.data.error)
            }else{
                toastr.error('Something went wrong');
            }
            if(callBackError)
                callBackError(error);
        }
        var FileActions = function(id){


            return{
                open: function(templateId,callback){
                    var canvasActions = fabricCanvasActions.getActionsFor(id),
                        objectActions = fabricObjectActions.getActionsFor(id)
                    api.get({id:templateId}).$promise.then(function(fileData){
                        if(fileData.size)
                            canvasActions.resize(fileData.size.width,fileData.size.height);
                        canvasInstances[id].info = fileData.info;
                        canvasInstances[id].properties = fileData.properties;
                        delete fileData.size;
                        delete fileData.properties;
                        delete fileData.info;
                        canvasInstances[id].canvas.loadFromDatalessJSON(JSON.parse(JSON.stringify(fileData)));
                        canvasInstances[id].canvas.getObjects().forEach(function(o){
                            objectActions.addTools(o);
                        })
                        setTimeout(function(){canvasInstances[id].canvas.renderAll();})
                        if(callback)
                            callback();

                    },handleError)
                },
                save: function(then){
                    var datalessJson = canvasInstances[id].canvas.toDatalessJSON();
                    datalessJson.size = {width:canvasInstances[id].canvas.getWidth(),height:canvasInstances[id].canvas.getHeight()};
                    datalessJson.properties = canvasInstances[id].properties
                    var options = _.extend({},
                        canvasInstances[id].info,
                        {canvasJson:datalessJson}
                    );
                    options.is_private = canvasInstances[id].config.useStudentFilter;
                    if(!options.classid){
                        toastr.error('Please, select a valid classid')
                        throw 'Class id is required';
                    }

                    api.save(options).$promise.then(function(res){
                        if(res.id){
                            canvasInstances[id].info.id=res.id
                        }
                        toastr.success('Saved','',{timeOut:1000})
                        if(then) then();
                    },handleError)
                }

            }
        }
        return {
            getActionsFor: function(id){return new FileActions(id)},
            loadAll: function(filter,then){
                api.query(filter).$promise.then(then,handleError);
            }

        }

    }])
}(angular,jQuery))
