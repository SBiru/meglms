//requires underscore or lodash library
if(_){
    var E3Util,E3Callbacks;
    E3Callbacks = {
        callbacks:{},
        registerCallback:function(event,callback){
            if(!this.callbacks.hasOwnProperty(event)){
                this.callbacks[event] = []
            }
            this.callbacks[event].push(callback);
            return this.removeCallback.bind(this,event,this.callbacks[event].length-1);
        },
        removeCallback:function(event,i){
            if(i){
                this.callbacks[event].splice(i,1);
            }else{
                delete this.callbacks[event];
            }
        }
    }

    E3Util = {
        addCallbacks : function(objectToBeExtended){
            _.extend(objectToBeExtended,E3Callbacks);
        },
        getOffset:function( el ) {
            var _x = 0;
            var _y = 0;
            while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
                _x += el.offsetLeft - el.scrollLeft;
                _y += el.offsetTop - el.scrollTop;
                el = el.offsetParent;
            }
            return { top: _y, left: _x };
        }
    }

}
