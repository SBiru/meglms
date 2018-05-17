'use strict';
(function(angular,$){
    angular.module('app').value('e3ChatLog',{}).directive('e3ChatIcon',['$compile','e3ChatLog','E3ChatActions','E3ChatUsers','e3UnreadThreads','$q','E3WsCurrentJob',function($compile,e3ChatLog,actions,users,unreadThreads,$q,E3WsCurrentJob){
        var callbackRegistered;
        return {
            restrict:'A',
            link:function(scope){
                function init(myId){
                    var ws = scope.$root.e3Ws;
                    var PageTitleNotification = {
                        Vars:{
                            OriginalTitle: document.title,
                            Interval: null
                        },
                        On: function(notification, intervalSpeed){
                            var _this = this;
                            var pos = 0;
                            var msg = this.Vars.OriginalTitle+" "+notification;
                            if(_this.Vars.Interval)clearInterval(_this.Vars.Interval);
                            _this.Vars.Interval = setInterval(function(){
                                document.title = msg.substring(pos, msg.length) + " " +msg.substring(0,pos);
                                pos++;
                                if (pos > msg.length) pos = 0;
                            }, (intervalSpeed) ? intervalSpeed : 1000);
                        },
                        Off: function(){
                            clearInterval(this.Vars.Interval);
                            document.title = this.Vars.OriginalTitle;
                        }
                    }
                    actions.start(ws,scope);
                    registerCallbacks();
                    var callBacks;
                    function registerCallbacks(){
                        if(callbackRegistered) return;
                        callBacks = {
                            'actions':{
                                'onlineUsers':actions.registerCallback('onlineUsers',users.updateOnlineUsers.bind(users)),
                                'message':actions.registerCallback('message',actions.newMessageArrived.bind(actions,users)),
                                'messageHasBeenRead':actions.registerCallback('messageHasBeenRead',actions.messageHasBeenReadByMe.bind(actions)), // to update in all logged in tabs....
                                'openCloseConversation':actions.registerCallback('openCloseConversation',users.openCloseConversation.bind(users)),
                                'hideFromOthers':actions.registerCallback('hideFromOthers',users.onHideFromOthers.bind(users)),
                            },
                            'E3WsCurrentJob':{
                                'currentJobFor':E3WsCurrentJob.registerCallback('currentJobFor',users.userCurrentJobChanged.bind(users))
                            }
                        };
                        callbackRegistered = true;
                    }
                    function unregisterCallbacks(){
                        for(var handler in callBacks){
                            for(var event in callBacks[handler]){
                                callBacks[handler].removeCallback(event,callBacks[handler][event]);
                            }
                        }
                    }

                    scope.open = function(forceOpen){
                        if(!angular.element('#e3-chat').length){
                            startChat();
                        }
                        scope.opened = forceOpen?true:!scope.opened;

                    }
                    function startChat(){
                        var chatElement = '<div id="e3-chat" e3-chat opened="opened" ng-if="opened"></div>';
                        angular.element('body').append($compile(chatElement)(scope));
                    }
                    function Notify() {
                        if(scope.unreadBagde>0){
                            var flashTitle = "("+scope.unreadBagde+")"+" New Message"+(scope.unreadBagde>1?"s":"");
                            PageTitleNotification.On(flashTitle, 150);
                        }else {
                            PageTitleNotification.Off();
                        }
                    }
                    scope.opened = false;
                    scope.unreadThreads = unreadThreads;
                    scope.unreadThreads.myId = ws.userId
                    scope.unreadThreads.load()

                    scope.users = users
                    users.myId = myId
                    users.amIAdvisor = scope.$root.user.is_advisor
                    users.loadGroups();
                    scope.$watch('unreadThreads.unreadThreadsCount',function(count){
                        scope.unreadBagde = count || 0;
                        Notify();
                    })


                }
                var unsubscribeOpened = scope.$watch('opened',function(opened){
                    if(!opened){
                        unreadThreads.visibleBoxes = []
                    }
                })
                var unsubscribeOpenChat = scope.$root.$on('OpenChat',function(evnt,data){
                    scope.open(true);
                    setTimeout(function(){scope.$root.$broadcast('OpenBox',data)},300);
                })
                var unsubscribeUser = scope.$watch('$root.user',function(user){
                    if(user)
                        init(user.id);
                })
                scope.$on('$destroy',function(){
                    unsubscribeOpenChat();
                    unsubscribeUser();
                    unsubscribeOpened();
                    unregisterCallbacks();
                })


            }
        }
    }]).factory('e3ChatNotifications',[function(){
        return {
            popup_box:null,
            prepareMessage:function(message){
                if(message.length<40){
                    return message;
                }else{
                    return message.substring(0,40) + '...'
                }
            },
            newMessage:function(msg,scope){
                var self = this;
                if(this.popup_box) {
                    toastr.clear()
                }
                var audio = new Audio('/public/audio/newEmail.ogg');
                audio.play();
                this.popup_box = toastr.success(this.prepareMessage(msg.message),'New message from ' + msg.fromFullName,{
                    onHidden:function(){
                        self.popup_box = null
                    },
                    toastClass:'toast toast-success new-message',
                    positionClass:jQuery('#e3-chat').length?'toast-top-right':'toast-bottom-right',
                    onclick:function(){
                        scope.$root.$broadcast('OpenChat',{userId:msg.from});
                    }

                })

            }
        }
    }])
        .directive('e3Chat',['E3ChatActions','E3ChatUsers','$filter','e3UnreadThreads',function(actions,users,$filter,e3UnreadThreads){
        return {
            restrict:'A',
            templateUrl:'/public/views/directives/app_chat/e3chat.html?v='+window.currentJsVersion,
            scope:{
                opened:"=?"
            },
            link:function(scope){
                var ws = scope.$root.e3Ws;
                scope.e3ChatReady = true;
                scope.openedBoxes = [];
                if($(window).width() < 768){
                    scope.chatclass = {
                        "top" : " 62px"
                    }
                }
                scope.users = users;
                scope.sortBy = {type:'user'};
                scope.tabs = [
                    {label:'Online',unreadFunction:sumUnreadMessagesForState.bind(this,'online')},
                    {label:'Offline',unreadFunction:sumUnreadMessagesForState.bind(this,'offline')},
                    {label:'All',unreadFunction:function(){return sumUnreadMessagesForState('online') + sumUnreadMessagesForState('offline')}}
                ];
                scope.hideFromOthers = users.hideFromOthers || false;
                users.onHideFromOthersChange = function(){
                    scope.hideFromOthers =users.hideFromOthers || false;
                }
                users.onOnlineUsersChange = selectVisibleUsers
                scope.setHideFromOthers = function(hideFromOthers){
                    actions.sendMessage({
                        event: 'hideFromOthers',
                        data: hideFromOthers
                    });
                    scope.hideFromOthers = hideFromOthers;
                }

                scope.openChatBoxWith = function(user){
                    var index = scope.openedBoxes.indexOf(user);
                    if(index>=0)
                        scope.openedBoxes.splice(index,1);
                    scope.openedBoxes.push(user);
                };

                scope.hoverUser = function(user,hideDetails){
                    if(!hideDetails){
                        user.isTeacher = users.teachers.indexOf(parseInt(user.id))>=0
                        scope.hoveredUser=user;
                    }

                }
                scope.leaveUser = function(user){
                    if(scope.hoveredUser==user)
                        scope.hoveredUser = null;
                }

                scope.closeChat = function(){
                    scope.$parent.$parent.opened = false;
                }
                scope.hasTeacherRole = function(){
                    var me = scope.$root.user;
                    return (me.is_super_admin ||
                    me.is_organization_admin ||
                    me.is_observer ||
                    me.teacher_supervisor ||
                    me.is_teacher ||
                    me.is_edit_teacher)
                }
                scope.changeTab = function(tab){
                    scope.currentTab = tab;
                    selectVisibleUsers()
                }
                scope.hasOnlyOneClass = function(){
                    return Object.keys(users.classes).length==1
                };
                function selectVisibleUsers(){
                    if(scope.currentTab == 'Online'){
                        scope.visibleUsers = selectVisibleOnlineUsers();
                    }else if(scope.currentTab == 'Offline'){
                        scope.visibleUsers = selectVisibleOfflineUsers()
                    }else {
                        scope.visibleUsers = selectVisibleAllUsers()
                    }
                }
                function selectVisibleOnlineUsers(){
                    return scope.users.getOnlineUsers(scope.sortBy.type)
                }
                function selectVisibleOfflineUsers(){
                    return scope.users.getOfflineUsers(scope.sortBy.type)
                }
                function selectVisibleAllUsers(){
                    return users.getAllUsers(scope.sortBy.type)

                }
                users.setNotifyCallback(function(){
                    scope.changeTab(scope.currentTab)
                })
                scope.$root.$on('OpenBox',function(event,data){
                    if(data && data.userId)
                        openBox(data.userId);
                })
                function openBox(userId){
                    var user = users.getUser(userId);
                    if(user){
                        scope.openChatBoxWith(user);
                        actions.updateScope();
                    }else if(scope.loadingOfflineUsers){
                        users.loadOfflineUsers().then(function(){
                            openBox(userId);
                        })
                    }
                }
                actions.addScopeToUpdate(scope);
                scope.changeTab('Online');
                function loadOfflineUsers(){
                    scope.loadingOfflineUsers = true;
                    users.loadOfflineUsers().then(function(){
                        scope.loadingOfflineUsers = false;
                        scope.showWaitingMessage = false;
                        selectVisibleUsers()
                    })
                }
                scope.loadOfflineUsers = users.loadingOfflineUsers
                if(!users.offlineUsersHasBeenLoaded && !users.loadingOfflineUsers)
                    loadOfflineUsers()
                scope.$watch('sortBy.type',function(){
                    selectVisibleUsers()
                })
                scope.noUsersAvailable = function(){
                    return false;
                    if(scope.currentTab == 'Online')
                        return scope.visibleUsers && scope.visibleUsers.length
                    else{
                        return scope.visibleUsers && scope.visibleUsers.byUser && scope.visibleUsers.byUser.length && !scope.loadingOfflineUsers;
                    }

                }
                function sumUnreadMessagesForState(state){
                    var ureadMessagesArray = _.map(e3UnreadThreads.unreadThreads,function(messages,room){
                        var user = e3UnreadThreads.userFromRoom(room),
                            isOnline = users.isOnline(user),
                            isCurrentState = (isOnline&&state=='online') || (!isOnline&&state=='offline');
                        return isCurrentState?messages:0
                    })
                    return _.reduce(ureadMessagesArray,function(memo,num){return memo + num},0);
                }

            }
        }
    }]).directive('e3ChatGroup',['e3UnreadThreads',function(unreadThreads){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_chat/e3-chat-group.html',
            link:function(scope){
                var BOX_SIZE_PX = 220,
                    ULIST_SIZE_PX = 220;

                function updateVisibleBoxes(){
                    if(!scope.openedBoxes) return;
                    if(!scope.maxBoxes) calcMaxBoxes();

                    if(scope.openedBoxes.length<=scope.maxBoxes)
                        unreadThreads.visibleBoxes = scope.visibleBoxes  =  scope.openedBoxes;
                    else{
                        unreadThreads.visibleBoxes = scope.visibleBoxes  = scope.openedBoxes.slice(-scope.maxBoxes);
                    }

                }
                scope.close = function(user){
                    var index = scope.visibleBoxes.indexOf(user);
                    if(index>=0)
                        scope.visibleBoxes.splice(index,1);
                }

                function calcMaxBoxes(){
                    if($(window).width() < 768){
                        scope.maxBoxes = 1;
                    }else {
                        scope.maxBoxes = Math.floor((window.innerWidth - ULIST_SIZE_PX)/BOX_SIZE_PX)
                    }
                    updateVisibleBoxes();
                }
                $(window).resize(calcMaxBoxes);
                scope.$watch('openedBoxes',updateVisibleBoxes,true);
            }
        }
    }]).factory('e3UnreadThreads',['E3ChatApi',function(api){
        return {
            unreadThreads:{},
            unreadThreadsCount:0,
            myId:null,
            visibleBoxes:[],
            load:function(){
                var _this = this;
                api.getUnreadMessages({}).$promise.then(function(threads){
                    _.each(threads,function(counter,room){
                        if(!room.startsWith("$"))
                            _this.unreadThreads[room] = counter
                    })
                    _this.updateThreadCount();
                })
            },
            addNewRoomMessage:function(room){
                this.unreadThreads[room] = this.unreadThreads[room] || 0;
                this.unreadThreads[room]++;
                this.updateThreadCount();

            },
            isBoxOpened:function(room){
                var _this = this;
                return _.some(this.visibleBoxes,function(user){
                    if(user.room)
                        return user.room == room;
                    return user.id == _this.userFromRoom(room)
                })
            },
            userFromRoom:function(room){
                var users = room.split('-');
                return users[0]==this.myId?users[1]:users[0];
            },
            removeRoom:function(room){
                if(this.unreadThreads[room]){
                    delete this.unreadThreads[room];
                    this.updateThreadCount();
                }
            },
            updateThreadCount:function(){
                this.unreadThreadsCount = _.reduce(this.unreadThreads,function(memo,newMessages){return memo + newMessages;},0)
            }
        }
    }])
}(angular,jQuery))