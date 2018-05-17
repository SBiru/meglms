var appServices = angular.module('app.services');
appServices.service('E3WsForum',['E3WsDefaultChannel',function(E3WsDefaultChannel){
    return angular.extend({},E3WsDefaultChannel,{
        serverTopic:'/topic/server.forum',
        clientTopic:'/topic/client.forum',

        scope:null,

        _init:function(){
            // this.registerCallback('update',this.update.bind(this))
        },
        update:function(res){
            // var msg = res.data.id;

        },
        onClientConnected: function(e3ws){
            this.messageBroker.subscribe(this.clientTopic,this.onMessage.bind(this)
                ,{selector:"toUserId = "+e3ws.userId}
                );
            this.ready=true;
            this.sendMessagesInQueue();
        }

    })


}]);