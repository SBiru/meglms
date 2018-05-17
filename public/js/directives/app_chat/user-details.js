'use strict';
(function(angular){
    angular.module('app').directive('chatUserDetails',[
        'E3ChatUsers',
        '$q',
        'UserV2',
        function(users,$q,UserV2){
        return {
            restrict:'A',
            templateUrl:'/public/views/directives/app_chat/e3-chat-user-details.html?v='+window.currentJsVersion,
            scope:{
                user:'=?',
                role:'=?'
            },
            link:function(scope,el){
                var unWatchUser = scope.$watch('user',function(user){
                    if(user){
                        init()
                    }
                })

                function init(){
                    loadUserData().then(setUserData)
                }
                function loadUserData(){
                    scope.userData = null;
                    scope.loadingData = true;
                    var defer = $q.defer();
                    if(users.cachedUserDetails[scope.user.id])
                        defer.resolve(users.cachedUserDetails[scope.user.id]);
                    else{
                        UserV2.getUser(scope.user.id,'includeClassMeta=1').then(function(userData){
                            users.cachedUserDetails[scope.user.id] = userData;
                            defer.resolve(users.cachedUserDetails[scope.user.id]);
                        })
                    }
                    return defer.promise;
                }
                function setUserData(userData){
                    scope.loadingData = false;
                    scope.userData = userData;
                }
                scope.$watch(function(){
                    scope.__height = el.outerHeight()
                },setBoxAndArrowPosition,true);
                function setBoxAndArrowPosition(){
                    setTimeout(function(){
                        setBoxPosition();
                        el.css('display','block');
                        setArrowPosition();

                    })
                }
                function setBoxPosition(){
                    var cssProperties = calculateBoxPosition();
                    el.css(cssProperties);
                }
                function calculateBoxPosition(){
                    var elHeight = el.outerHeight(),
                        winHeight = window.innerHeight,
                        hoveredEl = getHoveredEl(),
                        hoveredElOffset = E3Util.getOffset(hoveredEl[0]),
                        optimalTopPosition = hoveredElOffset.top - 10;

                    if(optimalTopPosition + elHeight > winHeight){
                        return {bottom:0}
                    }else{
                        return {top:optimalTopPosition};
                    }

                }
                function setArrowPosition(){
                    var cssProperties = calculateArrowPosition();
                    el.find('.user-arrow').css(cssProperties);
                    el.find('.user-arrow-border').css(cssProperties);

                }
                function calculateArrowPosition(){
                    var hoveredEl = getHoveredEl(),
                        hoveredElOffset = E3Util.getOffset(hoveredEl[0]),
                        elOffset = E3Util.getOffset(el[0]),
                        hoveredElMid =hoveredElOffset.top + hoveredEl.outerHeight()/2;
                    return {top:(hoveredElMid - elOffset.top) + 'px'}

                }
                function getHoveredEl(){
                    return el.parent().find('.hovered')
                }


                scope.$on('$destroy',cleanUp);
                function cleanUp(){
                    unWatchUser();
                }

            }

        }
    }]).directive('chatTeacherDetails',[
        'UserV2',
        function(UserV2){
            return {
                restrict:'A',
                templateUrl:'/public/views/directives/app_chat/e3-chat-teacher-details.html?v='+window.currentJsVersion,
                scope:{
                    userData:'=?',
                },
                link:function(scope){
                    var me = UserV2.user;
                    scope.$watch('userData',function(){
                        scope.classes = []
                        scope.userData && scope.userData.classes.forEach(function(c){
                            if(c.meta && c.meta.teacher && isMyClass(c))
                                scope.classes.push(c);
                        })
                    })
                    function isMyClass(c){
                        return _.some(me.classes,function(myClass){
                            return myClass.id == c.id
                        })
                    }

                }
            }
        }]).directive('chatStudentDetails',[
        'UserV2',
        'E3WsCurrentJob',
        'StudentsMissingAttendance',
        function(UserV2,E3WsCurrentJob,StudentsMissingAttendance){
            return {
                restrict:'A',
                templateUrl:'/public/views/directives/app_chat/e3-chat-student-details.html?v='+window.currentJsVersion,
                scope:{
                    userData:'=?',
                    user:'=?'
                },
                link:function(scope){
                    var me = UserV2.user;
                    E3WsCurrentJob.addScopeToUpdate(scope);
                    scope.currentJobs = E3WsCurrentJob;

                    scope.$watch('userData',function(){
                        if(!scope.userData) return;
                        getCurrentJob();
                        scope.classes = [];
                        scope.userData && scope.userData.classes.forEach(function(c){
                            if(c.isStudent && isMyClass(c)){
                                scope.classes.push(c);
                            }

                        });
                        function isMyClass(c){
                            return _.some(me.classes,function(myClass){
                                return myClass.id == c.id
                            })
                        }
                    })
                    scope.$watch('currentJobs.studentJobs['+scope.user.id+']',function(currentJob){
                        scope.currentJob = currentJob;
                    },true)
                    function getCurrentJob(){
                        scope.currentJobs.getCurrentJobFor(scope.userData.userId);
                    }
                    scope.$on('$destroy',function(){
                        E3WsCurrentJob.removeScopeToUpdate(scope);
                    })
                    scope.isMissingAttendance = StudentsMissingAttendance.isStudentMissingAttendance

                }
            }
        }])

}(angular))