var appServices = angular.module('app.services');
appServices.service('E3WsAutomatedAlerts',['E3WsDefaultChannel',function(E3WsDefaultChannel){
    return angular.extend({},E3WsDefaultChannel,{
        serverTopic:'/topic/server.alerts',
        clientTopic:'/topic/client.alerts',

        scope:null,

        _init:function(){
            this.registerCallback('alertLog',this.logReceived.bind(this))
        },
        logReceived:function(res){
            var msg = res.data.msg;
            console.log(msg);
            this.updateScope();
        },
        onClientConnected: function(e3ws){
            this.messageBroker.subscribe(this.clientTopic,this.onMessage.bind(this));
            this.ready=true;
            this.sendMessagesInQueue();
        }

    })


}]);