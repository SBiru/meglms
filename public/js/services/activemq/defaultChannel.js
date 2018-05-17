var appServices = angular.module('app.services');
appServices.factory('E3WsDefaultChannel',[function(){
    return {
        serverTopic:null,
        clientTopic:null,
        scopes:[],
        init: function(e3ws){
            E3Util.addCallbacks(this);
            this.messageBroker = e3ws.client;
            this.myId = e3ws.userId;
            this.messageQueue = [];
            e3ws.registerCallback('onConnected',this.onClientConnected.bind(this,e3ws));
            if(this.messageBroker.ws.readyState == 1){
                e3ws.callbackConnected();
            }
            if(this._init)
                this._init();
        },
        onClientConnected: function(e3ws){
            this.messageBroker.subscribe(this.clientTopic,this.onMessage.bind(this),{selector:"toUserId = "+e3ws.userId});
            this.ready=true;
            this.sendMessagesInQueue();
        },
        onMessage:function(response){
            var message = JSON.parse(response.body)
            if(message.event && this.callbacks[message.event]){
                this.callbacks[message.event].forEach(function(callback){
                    callback(message);
                })
            }
        },
        sendMessage:function(message){
            message = JSON.stringify(message)
            this.messageQueue.push(message);
            this.sendMessagesInQueue();
        },
        sendMessagesInQueue:function(){
            if(!this.ready) return;
            while(this.messageQueue.length>0){
                var message = this.messageQueue.shift()
                this.messageBroker.send(this.serverTopic,{},message);
            }

        },
        addScopeToUpdate:function(scope){
            this.scopes.push(scope);
        },
        removeScopeToUpdate:function(scope){
            var index = this.scopes.indexOf(scope);
            if(index>=0)
                this.scopes.splice(index,1);
        },
        updateScope:function(){
            this.scopes.forEach(function(scope){
                if(scope.$apply)
                    setTimeout(function(){scope.$apply()});
            })
        }
    }
}]);