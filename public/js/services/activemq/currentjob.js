var appServices = angular.module('app.services');
appServices.service('E3WsCurrentJob',['E3WsDefaultChannel','CurrentCourseId',function(E3WsDefaultChannel,CurrentCourseId){
    return angular.extend({},E3WsDefaultChannel,{
        serverTopic:'/topic/server.currentJob',
        clientTopic:'/topic/client.currentJob',
        studentJobs:{},
        oldStudentJobs:{},
        scope:null,
        setRoutScope:function(scope){
            this.scope = scope;
        },
        _init:function(){
            var _this = this;
            this.scope.$on('$locationChangeSuccess', function(next, current){
                _this.sendCurrentState()
            });
            setTimeout(function(){_this.sendCurrentState()});
            this.registerCallback('currentJobFor',this.currentJobForReceived.bind(this))
            this.registerCallback('currentJob',this.sendCurrentState.bind(this))

        },
        sendCurrentState:function(){
            this.sendMessage({
                data:{
                    hash:window.location.hash,
                    host:window.location.host,
                    href:window.location.href,
                    pathname:window.location.pathname,
                    origin:window.location.origin,
                    courseId:CurrentCourseId.getCourseIdFromCookie()
                },
                event:'currentJob'
            })
        },
        getCurrentJobFor:function(userId,attempt){
            var MAX_ATTEMPTS = 4;
            this.studentJobs[userId]=this.studentJobs[userId]||{loading:true};
            this.studentJobs[userId].loading = true;
            if(attempt===undefined || attempt >=1){
                attempt = attempt || MAX_ATTEMPTS;
                this.studentJobs[userId].clearTimeout = setTimeout(this.getCurrentJobFor.bind(this,userId,attempt-1),1000);
            }
            if(attempt === 0){
                this.studentJobs[userId].loading = false;
                this.updateScope();
                return;
            }
            this.sendMessage({
                data:{
                    userId: userId
                },
                event:'currentJobFor'
            })
        },
        currentJobForReceived:function(message){
            var userId = message.data.userId;
            if(this.studentJobs[userId]){
                this.oldStudentJobs[userId] = _.extend({},this.oldStudentJobs[userId]);
            }
            this.studentJobs[userId]=this.studentJobs[userId]||{};
            if(message.data.currentJob){
                this.studentJobs[userId].clearTimeout && clearTimeout(this.studentJobs[userId].clearTimeout);
                this.studentJobs[userId] = message.data.currentJob;
                this.studentJobs[userId].loading = false;
            }
            else if(message.data.message == 'Permission denied'){
                this.studentJobs[userId].clearTimeout && clearTimeout(this.studentJobs[userId].clearTimeout);
                this.studentJobs[userId].loading = false;
                this.studentJobs[userId] = message.data.message;
            }
            this.updateScope();
        }

    })


}]);