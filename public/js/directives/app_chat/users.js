'use strict';
(function(angular){
    angular.module('app').factory('E3ChatUsers',['E3ChatActions','$http','$q','E3ChatApi','E3WsCurrentJob',function(actions,$http,$q,api,E3WsCurrentJob){
        return {
            onlineUserIds : [],
            activeUserIds : [],
            users : {},
            classes:{},
            sites:{},
            teachers:[],
            students:[],
            allGroups:[],
            onlineGroups:[],
            offlineGroups:[],
            onlineStatus:{},
            onlineUsersHasBeenLoaded:false,
            offlineUsersHasBeenLoaded:false,
            cachedUserDetails:{},
            firstLoad:true,
            myId:null,
            amIAdvisor:false,
            updateOnlineUsers : function(response){
                var self = this;
                this.onlineUserIds = response.data.onlineUserIds;
                this.firstLoad && this.getCurrentJobs(response.data.students);
                response.data.teachers = _.map(response.data.teachers,function(u){return parseInt(u)});
                response.data.students = _.map(response.data.students,function(u){return parseInt(u)});
                this.updateState(response.data);
                this.updateOnlineStatus(_.map(this.onlineUserIds,function(id){return self.users[id]}),'online');
                this.onlineUsersHasBeenLoaded =true;
                this.onOnlineUsersChange && this.onOnlineUsersChange();
                actions.updateScope();
            },
            getCurrentJobs: function(students){
                _.each(students,function(id){
                    E3WsCurrentJob.getCurrentJobFor(id+'')
                })
                this.firstLoad = false
            },
            updateState:function(data){
                this.extendObject(data.users || {},'users');
                this.extendObject(data.classes || {},'classes');
                this.extendObject(data.sites || {},'sites','name');
                this.teachers = _.union(this.teachers,data.teachers);
                this.students =_.union(this.students,data.students);
            },
            extendObject:function(array,object,idField){
                var self = this,
                    idField = idField || "id"
                _.each(array,function(o){
                    self[object][o[idField]] = _.extend({},self[object][o[idField]],o);
                })
            },

            isOnline:function(userId){
                return _.some(this.onlineUserIds,function(id){return id==userId});
            },
            isActive:function(userId){
                return _.some(this.activeUserIds,function(id){return id==userId});
            },
            isStudent:function(userId){
                return this.users[userId] && this.users[userId].isStudent;
            },
            getUser:function(userId){
                return this.users[userId];
            },
            updateOnlineStatus:function(users,status){
                var updatedIds  = []
                for(var i = 0; i<users.length;i++){
                    var user = users[i];
                    this.onlineStatus[user.id] = this.onlineStatus[user.id] || {};
                    this.onlineStatus[user.id].isOnline = status=='online'
                    updatedIds.push(user.id+'');
                }
                if(status=='online'){
                    for(var id in this.onlineStatus){
                        if(updatedIds.indexOf(id) < 0){
                            this.onlineStatus[id].isOnline = false;
                        }
                    }
                }
                this.updateGroupStatus();
            },
            updateGroupStatus:function(){
                var onlineGroups = [],
                    offlineGroups = [],
                    this_ = this;

                _.each(this.allGroups,function(group){
                    if(this_.hasAnyOnlineUsers(group))
                        onlineGroups.push(group)
                    else
                        offlineGroups.push(group)
                })
                this.offlineGroups = offlineGroups;
                this.onlineGroups = onlineGroups;
            },
            hasAnyOnlineUsers:function(group){
                var this_ = this;
                return _.some(group.users,function(u){return this_.isOnline(u.id)});
            },
            validateProfilePicture:function(user){
                $http.head(user.profilePicture).then(function(){},function(){
                    user.profilePicture = '/public/img/chatuserdefault.png';
                })
            },
            loadGroups: function(){
                var this_ = this;
                api.loadGroups().$promise.then(function(groups){
                    this_.allGroups = groups;
                    this_.updateGroupStatus();
                })
            },
            addNewGroup:function(users){
                var room = actions.buildRoom(this.myId,'group',users)
                if(!_.some(this.allGroups,function(g){return g.room == room})){
                    var group= this.prepareNewGroup(users,room);
                    this.allGroups.push(group);
                    this.updateGroupStatus();
                }
            },
            prepareNewGroup:function(users,room){
                return {
                    'room':room,
                    users:users,
                    lastName:'',
                    firstName: _.map(users,function(u){return u.firstName + ' ' + u.lastName}).join(', ')
                }
            },
            openCloseConversation:function(res){
                var room = res.data.room,
                    isClosed = res.data.closed;
                var group = _.find(this.allGroups,function(g){return g.room = room});
                group.closed = isClosed
                this.updateGroupStatus();
                actions.updateScope();
            },
            isGroupTeacherOnline:function(users){
                var self = this;
                return _.some(users,function(u){
                    var teacherIndex = self.teachers.indexOf(parseInt(u.id))
                    return teacherIndex==-1?false:self.isOnline(u.id)
                })
            },
            someTeacher:function(users){
                var self = this;
                return _.some(users,function(u){
                    var teacherIndex = self.teachers.indexOf(parseInt(u.id))
                    return teacherIndex>=0
                })
            },
            canTalkToStudents:function(users){
                for(var i = 0;i<users.length;i++){
                    var uId = users[i].id;
                    if(!this.isOnline(uId)){
                        return false;
                    }
                }
                return true;
            },
            loadOfflineUsers:function(){
                var self = this;
                if(this.loadingOfflineUsers)
                    return this.loadingUsersPromise;

                this.loadingUsersPromise =  api.loadOfflineUsers().$promise;
                this.loadingOfflineUsers = true;
                this.loadingUsersPromise.then(function(offlineUsers){
                    self.loadingOfflineUsers = false;
                    self.offlineUsersHasBeenLoaded = true;
                    self.updateState(offlineUsers);
                    actions.updateScope();
                });
                return this.loadingUsersPromise;
            },
            getOnlineUsers:function(by){
                var self = this;
                if(by=='user'){
                    return {
                        teachers: this.filterAndPrepareOnlineUsers(this.teachers) ,
                        students: this.filterAndPrepareOnlineUsers(this.students),
                        groups:this.onlineGroups
                    }
                }
                if(by=='class'){
                    return _.map(this.classes,function(c_){
                        var c = _.extend({},c_);
                        c.students = self.filterAndPrepareOnlineUsers(c['students']);
                        c.teachers = self.filterAndPrepareOnlineUsers(c['teachers']);
                        c.hasEntries = c.students.length || c.teachers.length
                        return c;
                    })
                }
                if(by=='site'){
                    return _.map(this.sites,function(s_){
                        var s = _.extend({},s_);
                        s.users = s.users = self.filterAndPrepareOnlineUsers(s.users)
                        return s;
                    })
                }
            },
            filterAndPrepareOnlineUsers:function(users){
                return this.filterAndPrepareUsers(users,true);
            },
            filterAndPrepareOfflineUsers:function(users){
                return this.filterAndPrepareUsers(users,false);
            },
            filterAndPrepareUsers:function(users,isOnline){
                var self = this;
                return _.map(_.filter(users,function(id){
                    if(isOnline=='ignore'){
                        return true;
                    }
                    return isOnline?self.isOnline(id):!self.isOnline(id);
                }),function(id){
                    self.users[id].room = actions.buildRoom(id,actions.myId);
                    return self.users[id]
                })
            },
            getOfflineUsers:function(by){
                var self = this;
                if(by=='user'){
                    return {
                        teachers:this.filterAndPrepareOfflineUsers(this.teachers),
                        students:this.filterAndPrepareOfflineUsers(this.students),
                        //students:_.map(this.students,function(id){return self.users[id]}),
                        groups:this.offlineGroups
                    }
                }
                if(by=='class'){
                    return _.map(this.classes,function(c_){
                        var c = _.extend({},c_);
                        c.students = self.filterAndPrepareOfflineUsers(c['students']);
                        c.teachers = self.filterAndPrepareOfflineUsers(c['teachers']);
                        c.hasEntries = c.students.length || c.teachers.length
                        return c;
                    })
                }
                if(by=='site'){
                    return _.map(this.sites,function(s_){
                        var s = _.extend({},s_);
                        s.users = self.filterAndPrepareOfflineUsers(s.users)
                        return s;
                    })
                }
            },
            getAllUsers:function(by){
                var self = this;
                if(by=='user'){
                    return {
                        teachers:this.filterAndPrepareUsers(this.teachers,'ignore'),
                        students:this.filterAndPrepareUsers(this.students,'ignore'),
                        //students:_.map(this.students,function(id){return self.users[id]}),
                        groups:this.offlineGroups
                    }
                }
                if(by=='class'){
                    return _.map(this.classes,function(c_){
                        var c = _.extend({},c_);
                        c.students = self.filterAndPrepareUsers(c['students'],'ignore');
                        c.teachers = self.filterAndPrepareUsers(c['teachers'],'ignore');
                        c.hasEntries = c.students.length || c.teachers.length
                        return c;
                    })
                }
                if(by=='site'){
                    return _.map(this.sites,function(s_){
                        var s = _.extend({},s_);
                        s.users = self.filterAndPrepareUsers(s.users,'ignore')
                        return s;
                    })
                }
            },
            userCurrentJobChanged:function(response){
                var data = response.data;

                if(data.currentJob && data.currentJob.classId  && this.isClassITeach(data.currentJob.classId)){
                    var index = this.activeUserIds.indexOf(data.userId);
                    if(index<0){
                        this.activeUserIds.push(data.userId)
                        this.notify();
                    }
                }else{
                    var index = this.activeUserIds.indexOf(data.userId);
                    if(index>=0){
                        this.activeUserIds.splice(index,1);
                        this.notify();
                    }
                }
            },
            notify:function(){
                this.updateGroupStatus()
                this.notifyChanges && this.notifyChanges();
                actions.updateScope();
            },

            isClassITeach:function(classId){
                return this.classes[classId] && this.classes[classId].students.length>0
            },
            setNotifyCallback:function(callBack){
                this.notifyChanges = callBack;
            },
            onHideFromOthers:function(res){
                this.hideFromOthers = res.data;
                this.onHideFromOthersChange && this.onHideFromOthersChange();
            }

        }
    }]).directive('e3ChatUserGroup',['e3UnreadThreads','StudentsMissingAttendance',function(e3UnreadThreads,StudentsMissingAttendance){
        return {
            restrict:'A',
            templateUrl:'/public/views/directives/app_chat/e3-chat-group-users.html',
            scope:{
                group:'=?',
                hidePicture:'=?',
                filterUser:'=?',
            },
            link:function(scope){
                scope.parent = scope.$parent;
                scope.threads = e3UnreadThreads;
                var users = scope.parent.users
                scope.hideUser = function(user){
                    var currentTab = scope.parent.currentTab;
                    if(currentTab=='Offline'){
                        return users.onlineStatus[user.id] && users.onlineStatus[user.id].isOnline
                    }
                    if(currentTab=='Online'){
                        return user.id && !users.isOnline(user.id+'')
                    }
                }
                scope.$watch('group.collapseAll',function(collapseAll){
                    if(!_.isUndefined(collapseAll)){
                        scope.closed = collapseAll;
                    }
                })
                scope.isActive = function(user){
                    return users.isActive(user.id)?1:0
                }

                scope.isMissingAttendance = StudentsMissingAttendance.isStudentMissingAttendance
            }
        }

    }]).
    filter('orderByActive', ['E3ChatUsers','e3UnreadThreads',function (users,e3UnreadThreads) {
        // custom value function for sorting
        function myValueFunction(user) {
            if(e3UnreadThreads.unreadThreads[user.room]){
                return e3UnreadThreads.unreadThreads[user.room];
            }
            return users.isActive(user.id)?1:0
        }

        return function (obj) {
            var array = [];
            Object.keys(obj).forEach(function (key) {
                // inject key into each object so we can refer to it from the template
                obj[key].name = key;
                array.push(obj[key]);
            });
            // apply a custom sorting function
            array.sort(function (a, b) {
                return myValueFunction(b) - myValueFunction(a);
            });
            return array;
        };
    }]);
}(angular))