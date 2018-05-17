'use strict';

(function(global) {

    var fabric = global.fabric || (global.fabric = {}),
        clone  = fabric.util.object.clone;
    fabric.Textarea = fabric.util.createClass(fabric.Rect,fabric.Observable, {
        type: 'textarea',

        initialize: function( options) {
            options = options || {};
            this.ctx = fabric.util.createCanvasElement().getContext('2d');
            this.callSuper('initialize', options);
            this.options = options;
            this.id = options.id || fabric.util.Uuid();
            setTimeout(this._initRemovedHandler.bind(this));
            setTimeout(this._createTextarea.bind(this));

        },
        _initRemovedHandler: function() {
            this.on('removed',this._removeTextarea.bind(this));
            this.canvas.on('canvas:cleared',this._removeTextarea.bind(this))
        },
        _createTextarea : function(){
            this.textarea = fabric.document.createElement('textarea');
            this.textarea.setAttribute('id',this.id);
            this.textarea.style.resize= 'none';
            this.textarea.style.position= 'absolute';
            this.textarea.style.fontFamily= 'Verdana, Verdana, Geneva, sans-serif';
            this.textarea.style['background-color'] = this.options['fill'];
            jQuery(this.textarea).focus(this._setFocus.bind(this))
            this.canvas.lowerCanvasEl.parentNode.appendChild(this.textarea);
            this._setTextareaCoord();
            this._setTextareaStyle();
            this._bindEvents();
        },
        _setTextareaStyle: function(){
            if(!this.options.textarea) return;
            var _this = this;
            _.each(this.options.textarea,function(val,prop){
                _this.textarea.style[prop] = val;
            })
        },
        _bindEvents :function(){
            var _this = this;
            this.canvas.on('object:moving',function(o){if(_this._checkTargetObject(o)) _this._setTextareaCoord()});
            this.canvas.on('object:scaling',function(o){if(_this._checkTargetObject(o)) _this._setTextareaCoord()})
            this.canvas.on('object:rotating',function(o){if(_this._checkTargetObject(o)) _this._setTextareaCoord()})
        },
        _checkTargetObject: function(o){
            return o.target==this ||
                (o.target._objects && o.target._objects.indexOf(this)>=0)
        },
        _setFocus: function(){
            if(this.selectable){
                this.canvas.setActiveObject(this);
                this.canvas.bringToFront(this);
            }
        },
        _setTextareaCoord :function(){
            console.log('oi');
            var width = this.getWidth() -8,
                height = this.getHeight() - 8,
                translate50percX = -width/ 2,
                translate50percY = -height/ 2,
                rotateMatrix = this._calcRealRotateMatrix(),
                center = this._realCenter()

            this.textarea.style.width = (width) + 'px';
            this.textarea.style.height = (height) + 'px';
            this.textarea.style.transform = 'matrix('+rotateMatrix[0]+','+rotateMatrix[1]+','+rotateMatrix[2]+','+rotateMatrix[3]+','+(translate50percX)+','+(translate50percY)+')';
            this.textarea.style.left= center.x + 'px';
            this.textarea.style.top= center.y + 'px';

        },
        _removeTextarea : function(){
            if(this.textarea.parentNode && this.textarea.parentNode == this.canvas.lowerCanvasEl.parentNode )
                this.canvas.lowerCanvasEl.parentNode.removeChild(this.textarea);
        },
        _realCenter : function(){
            if(this.group){
                var groupCenter = this.group.getCenterPoint(),
                    groupRotateMatrix = this.group._calcRotateMatrix(),
                    myCenter = this.getCenterPoint()
                return new fabric.Point(
                    groupCenter.x + (myCenter.x * groupRotateMatrix[0] +  myCenter.y * groupRotateMatrix[2]),
                   ( groupCenter.y + (myCenter.x * groupRotateMatrix[1] +  myCenter.y * groupRotateMatrix[3]))
                )
            }
            return this.getCenterPoint();


        },
        _calcRealRotateMatrix: function(){
            if(!this.group){
                return this._calcRotateMatrix()
            }else{
                var myRotateMatrix = this._calcRotateMatrix(),
                    groupRotateMatrix =  new fabric.util.Matrix(this.group._calcRotateMatrix()),
                    center = this.getCenterPoint() // center relative to group
                myRotateMatrix[4] = center.x //translating x
                myRotateMatrix[5] = center.y //translating y
                myRotateMatrix = new fabric.util.Matrix(myRotateMatrix)
                myRotateMatrix.convertTransformMatrix1Dto2D();
                groupRotateMatrix.convertTransformMatrix1Dto2D();
                var newMatrix = myRotateMatrix.multiply(groupRotateMatrix);
                return newMatrix.convertTransformMatrix2Dto1D();
            }
        },
        toObject: function() {
            console.log('toObject')
            return fabric.util.object.extend(this.callSuper('toObject'),{textarea:this._getTextareaStyles(),id:this.id});
        },
        _getTextareaStyles : function(){
            if(typeof this.textarea == 'object' && !(this.textarea instanceof HTMLElement)) return this.textarea
            return {
                'border-width':this.textarea.style['border-width'],
                'border-color':this.textarea.style['border-color'],
                'background':this.textarea.style['background-color'],
                'font-size':this.textarea.style['font-size'],
                'font-family':this.textarea.style['font-family'],
                'color':this.textarea.style['color'],
            }
        },
        getStrokeWidth: function(){
            return parseFloat(css(this.textarea,'border-width').replace('px',''));
        },
        setStrokeWidth :function(width){
            this.textarea.style['border-width'] = width + 'px';
        },
        getStroke: function(){
            return css(this.textarea,'border-color');
        },
        setStroke :function(color){
            this.textarea.style['border-color'] = color;
        },
        getFontFamily :function(){
            return css(this.textarea,'font-family').replace(/'/g,'');
        },
        setFontFamily :function(fontFamily){
            this.textarea.style['font-family'] = fontFamily;
        },
        getFontSize :function(){
            return parseFloat(css(this.textarea,'font-size').replace('px','')) ;
        },
        setFontSize :function(size){
            this.textarea.style['font-size'] = size + 'px';
        },
        getFontWeight :function(){
            return css(this.textarea,'font-weight');
        },
        setFontWeight :function(weight){
            this.textarea.style['font-weight'] = weight;
        },
        getColor:function(){
            return css(this.textarea,'color');
        },
        setColor:function(color){
            this.textarea.style['color'] = color;
        },
        getFill:function(){
            return css(this.textarea,'background-color');
        },
        setFill:function(color){
            this.textarea.style['background-color'] = color;
        }



    });
    fabric.Textarea.fromObject = function(object) {
        return new fabric.Textarea(clone(object));
    };
    function css( element, property ) {
        return window.getComputedStyle( element, null ).getPropertyValue( property );
    }


})(typeof exports !== 'undefined' ? exports : this);