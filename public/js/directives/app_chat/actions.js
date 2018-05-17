'use strict';
(function(angular){
    angular.module('app').factory('E3ChatActions',['E3ChatApi','e3UnreadThreads','e3ChatLog','e3ChatNotifications','HelperService',function(api,unreadThreads,e3ChatLog,e3ChatNotifications,HelperService){
        var serverTopic = '/topic/server.chat',
            clientTopic = '/topic/client.chat';
        return {
            messageBroker:null,
            scopes:[],
            myId:null,
            start:function(e3ws,scope){
                E3Util.addCallbacks(this);
                this.addScopeToUpdate(scope);
                this.messageBroker = e3ws.client;
                this.myId = e3ws.userId
                this.messageQueue = [];
                e3ws.registerCallback('onConnected',this.onClientConnected.bind(this,e3ws));
                if(this.messageBroker.ws.readyState == 1){
                    e3ws.callbackConnected();
                }

            },
            addScopeToUpdate:function(scope){
                this.scopes.push(scope);
            },
            onClientConnected: function(e3ws){
                this.messageBroker.subscribe(clientTopic,this.onMessage.bind(this),{selector:"toUserId = "+e3ws.userId});
                this.ready=true;
                this.sendClientQueueToServer()
                this.sendMessagesInQueue();
            },
            sendClientQueueToServer:function(){
                var _this = this;
                this.sendMessage({
                    event:'newClientConnected',
                    data:{
                        userId:_this.messageBroker.userId
                    }
                });
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
                    this.messageBroker.send(serverTopic,{},message);
                }

            },
            buildRoom:function(from,to,users){
                if(to=='group'){
                    var userIds = _.map(users,function(u){return u.id});
                    userIds.push(from);
                    userIds = userIds.sort();
                    return userIds.join('-');
                }else{
                    return Math.min(from,to) + '-' + Math.max(from,to)
                }

            },
            newMessageArrived:function(users,response){
                var room = response.data.room
                if(e3ChatLog[room]){
                    e3ChatLog[room].push(response.data);
                }else{
                    if(response.data.to=='group'){
                        users.loadGroups();
                    }
                }
                if(unreadThreads.isBoxOpened(room)){
                    this.sendMessageHasBeenRead(room)
                }else{
                    unreadThreads.addNewRoomMessage(room);
                    e3ChatNotifications.newMessage(response.data,this.scopes[0]);
                }
                this.updateScope();

            },
            downloadLog: function(room){
                api.downloadLog({room:room}).$promise.then(function(res){
                    HelperService.buildFileFromData(res.content,res.filename,'txt');
                })
            },
            sendMessageHasBeenRead: function(room){

                var message={
                    event:'messageHasBeenRead',
                    data:{
                        from:unreadThreads.userFromRoom(room),
                        room:room
                    }
                }
                this.sendMessage(message);
            },
            messageHasBeenReadByMe: function(response){  // to update in all logged in tabs....
                var room = response.data.room;
                unreadThreads.removeRoom(room);
                this.updateScope();
            },
            updateScope:function(){
                this.scopes.forEach(function(scope){
                    setTimeout(function(){scope.$apply()});
                })
            }
        }
    }])
}(angular))