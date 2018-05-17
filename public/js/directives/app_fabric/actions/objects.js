'use strict';
(function(angular,$){
        angular.module('ngFabric').factory('fabricObjectActions',['canvasInstances',function(instances){
        var TOOLS = {
            textarea:['background','stroke','font'],
            circle:['background','stroke','stroke-shape'],
            rect:['background','stroke','stroke-shape'],
            'i-text':['font'],
            'lineArrow':['stroke'],
            'triangle':['stroke','background','stroke-shape'],
            'line':['stroke','stroke-shape']
        }
        
        function ObjectActions(id){
            return{
                addTools:function(obj){
                    obj.tools = TOOLS[obj.type];
                },
                addCircle: function(){
                    var obj = new fabric.Circle({radius: 20,left:10,right:10,fill:'transparent',strokeWidth:1,stroke:'#000'});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                },
                addRect: function(){
                    var obj = new fabric.Rect({width:50,height:50,left:10,right:10,fill:'transparent',strokeWidth:1,stroke:'#000'});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                },
                addTextbox: function(){
                    var obj = new fabric.Textarea({width:50,height:50,fill:'transparent',left:10,right:10});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                },
                addText: function(){
                    var obj = new fabric.IText('Text',{left:10,right:10});
                    this.addTools(obj);
                    obj.getColor = obj.getFill;
                    instances[id].canvas.add(obj);
                },
                addArrow: function(){
                    var obj = new fabric.LineArrow([10,10,10,110]);
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                },
                addLine: function(){
                    var obj = new fabric.Line([10,10,10,110],{
                        stroke:'rgb(0,0,0)',
                        strokeWidth:1
                    });
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    window.debugLine = obj;
                },
                addTriangle: function(){
                    var obj = new fabric.Triangle({
                        fill:'transparent',
                        stroke:'rgb(0,0,0)',
                        top: 50,
                        left: 50,
                        height: 50,
                        width: 50,
                        originX: 'center',
                        originY: 'center',
                    });
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                },
                addImage: function(data,w,h){
                    w = w || 100;
                    h = h || 100;
                    var canvas = instances[id].canvas;
                    fabric.Image.fromURL(data, function (img) {
                        var oImg = img.set({left: 0, top: 0, angle: 0,width:w, height:h});
                        canvas.add(oImg).renderAll();
                        var a = canvas.setActiveObject(oImg);
                        canvas.toDataURL({format: 'png', quality: 0.8});
                    });
                }
            }            
        }
        return {
            getActionsFor: function(id){return new ObjectActions(id)}
        }


    }])
}(angular,jQuery))
