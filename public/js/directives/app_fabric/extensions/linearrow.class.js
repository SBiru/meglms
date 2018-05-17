'use strict';

(function(global) {

    var fabric = global.fabric || (global.fabric = {}),
        clone  = fabric.util.object.clone;
    fabric.LineArrow = fabric.util.createClass(fabric.Group, {

        type: 'lineArrow',

        initialize: function(pts, options) {
            options || (options = {});
            this.line = this._createLine(pts,options)
            this.head = this._createHead(pts,options)
            this.callSuper('initialize',[this.line,this.head], options);

        },
        remove: function(){
            if(arguments.length == 0){
                return this.remove(this.line,this.head);

            }

            var objects = this.getObjects(),
                index;

            for (var i = 0, length = arguments.length; i < length; i++) {
                index = objects.indexOf(arguments[i]);

                // only call onObjectRemoved if an object was actually removed
                if (index !== -1) {
                    objects.splice(index, 1);
                    this._onObjectRemoved(arguments[i]);
                }
            }
            this.canvas._objects.splice(this.canvas._objects.indexOf(this),1);
            this.canvas.renderAll()
            return this;
        },
        _createLine: function(pts,options){
            if(options.objects){
                var newLine = new fabric.Line.fromObject(options.objects[0]),
                    _this=this;
                setTimeout(function(){
                    _this.setStroke(options.objects[0].stroke)
                    newLine.canvas.renderAll()
                })
                return newLine
            }
            this.strokeWidth = 3;
            return new fabric.Line(pts,
                {
                    strokeWidth: 3,
                    stroke: this.fill || options.fill,
                    originX: 'center',
                    originY: 'center'

                });

        },
        _createHead: function(pts,options){
            if(options.objects) {
                return new fabric.Triangle(options.objects[1])
            }
            var headLength = 15,

                x1 = pts[0],
                y1 = pts[1],
                x2 = pts[2],
                y2 = pts[3],

                dx = x2 - x1,
                dy = y2 - y1,

                angle = Math.atan2(dy, dx);

            angle *= 180 / Math.PI;
            angle += 90;

            return new fabric.Triangle({
                    angle: angle,
                    fill: this.fill,
                    top: y2,
                    left: x2,
                    height: headLength,
                    width: headLength,
                    originX: 'center',
                    originY: 'center',
            // lockScalingX:false,
            // lockScalingY:true,
        });
        },
        setStrokeWidth :function(width){
            this.line.setStrokeWidth(width);
            this.head.setStrokeWidth(width);
            this.strokeWidth = width;
        },
        setStroke :function(color){
            this.line.setStroke(color);
            this.head.setStroke(color);
            this.head.setFill(color);
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'),{x1:this.x1,x2:this.x2,y1:this.y1,y2:this.y2});
        }
    });

    fabric.LineArrow.fromObject = function (object, callback) {
        callback && callback(new fabric.LineArrow(null,object));
    };

    fabric.LineArrow.async = true;
})(typeof exports !== 'undefined' ? exports : this);