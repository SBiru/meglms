'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricCanvasActions',['fabricObjectActions','canvasInstances',function(fabricObjectActions,canvasInstances){

        var CanvasActions =  function(id){
            var ctrlDown = false,
                objectActions = fabricObjectActions.getActionsFor(id),
                _this = this;
            this.id = id;
            function selectedObject(){
                return canvasInstances[_this.id].canvas._activeObject || canvasInstances[_this.id].canvas._activeGroup
            }
            function deleteObject(object){
                if(['INPUT','TEXTAREA'].indexOf(document.activeElement.tagName)>=0) return;

                if(object){
                    return object.remove();
                }
                if(canvasInstances[_this.id].canvas._activeObject)
                    return deleteObject(canvasInstances[_this.id].canvas._activeObject);
                if(canvasInstances[_this.id].canvas._activeGroup){
                    var group = canvasInstances[_this.id].canvas._activeGroup._objects
                    _.each(group,deleteObject);
                }
            }
            function copyToFakeClipboard(){
                canvasInstances[_this.id].canvas.fakeClipboard = selectedObject().toObject();
            }
            function paste(){
                var obj = canvasInstances[_this.id].canvas.fakeClipboard;
                window.fabric.util.enlivenObjects([obj],function(objects){
                    objects.forEach(function(o) {

                        if(o.type=='group'){
                            var newGroup = new window.fabric.Group()
                            o.forEachObject(function(object){
                                var center = o.getCenterPoint();
                                pasteOne(object,center);
                            })
                        }else{
                            canvasInstances[_this.id].canvas.setActiveObject(pasteOne(o))
                        }
                    });
                })
                canvasInstances[_this.id].canvas.renderAll();
            }
            function pasteOne(obj,center){
                o = window.fabric.util.object.clone(obj);
                if(obj.type=='textarea'){
                    setTimeout(o._initRemovedHandler.bind(o))
                    setTimeout(o._createTextarea.bind(o))
                }


                o.left = center?center.x + o.left  + 5:o.left  + 5
                o.top = center?center.x + o.top  + 5:o.top  + 5
                objectActions.addTools(o);
                canvasInstances[_this.id].canvas.add(o);
                return o
            }
            function findActiveCanvas(){
                var canvases = $(document.activeElement).find('.lower-canvas'),
                    canvasId
                if(canvases.length){
                    canvasId = canvases[0].id.replace('canvas_','');
                }
                return canvasId;
            }
            return {
                disableControls: function(){
                    canvasInstances[id].canvas.selection = false;
                    canvasInstances[id].canvas.forEachObject(function(o) {
                        o.selectable = false;
                    });
                },
                resize: function (w, h) {
                    var canvas = canvasInstances[id].canvas;
                    var container = $(canvas.wrapperEl),
                        upper = $(canvas.upperCanvasEl),
                        lower = $(canvas.lowerCanvasEl)

                    container.css('width', w);
                    container.css('height', h);
                    upper.attr('width', w);
                    upper.attr('height', h);
                    lower.attr('width', w);
                    lower.attr('height', h);

                    canvasInstances[id].canvas.setWidth(w);
                    canvasInstances[id].canvas.setHeight(h);
                    canvasInstances[id].canvas.calcOffset();
                },
                scaleTo: function (w, h) {
                    var canvas = canvasInstances[id].canvas;
                    var container = $(canvas.wrapperEl),
                        lower = $(canvas.lowerCanvasEl)

                    container.css('width', w);
                    container.css('height', h);
                    lower.attr('width', w);
                    lower.attr('height', h);
                },
                keydown: function (event,_id) {
                    _this.id = findActiveCanvas();
                    switch (event.keyCode) {
                        case 17: //ctrl
                        case 91: //cmd
                            ctrlDown = true;
                            break;
                        case 46: //delete
                        case 8: //backspace / delete
                            deleteObject();
                            break;
                        case 67: // c
                            if(ctrlDown && selectedObject()) copyToFakeClipboard();
                            break;
                        case 86: // v
                            if(ctrlDown && canvasInstances[id].canvas.fakeClipboard) paste();
                            break;
                        default:
                            return;
                    }
                },
                keyup:function(event){
                    _this.id = findActiveCanvas();
                    switch (event.keyCode) {
                        case 17: //ctrl
                        case 91: //cmd
                            ctrlDown = false;
                            break
                        default:
                            return;
                    }
                },

            };
        }
        return {
            getActionsFor: function(id){
                return new CanvasActions(id);
            },
            dispose:function (id){
                var instance = canvasInstances[id];
                if(!instance) return;
                var canvas = canvasInstances[id].canvas;
                var canvasEl = $(canvas.lowerCanvasEl).detach();
                $(canvas.upperCanvasEl).remove();
                $(canvas.wrapperEl).parent().append(canvasEl)
                $(canvas.wrapperEl).find('textarea').remove();
                $(canvas.wrapperEl).remove();
                if (canvas)
                    canvas.clear();
                canvas = null;
                delete canvasInstances[id];
            }
        }

    }])
}(angular,jQuery))
