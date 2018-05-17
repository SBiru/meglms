'use strict';
(function(angular){
    angular.module('app').directive('e3ChatAddUser',['E3ChatUsers',function(chatUsers){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/app_chat/e3-chat-add-user.html',
            scope:{
                done:'=?',
                currentUsers:'=?',
                currentUser:'=?'
            },
            link:function(scope){
                scope.startSearching = function(term,callback){
                    if(!chatUsers.users){
                        setTimeout(function(){scope.startSearching(term,callback)},500);
                        return;
                    }
                    var filteredUsers = _.filter(chatUsers.users,function(user){
                        var fullNameToBeTested = [user.firstName,user.lastName,user.email].join(' ')
                        return fullNameToBeTested.toLowerCase().indexOf(term.toLowerCase()) >=0 && notInTheGroup(user);
                    });
                    scope.users = _.map(filteredUsers,function(u){
                        u.text = u.firstName + ' ' + u.lastName + " (" + u.email + ")"
                        u.value = u.id;
                        return u;
                    })
                    callback(scope.users)
                }
                function notInTheGroup(user){

                    return scope.currentUser.id != user.id && (!scope.currentUsers || !_.some(scope.currentUsers,function(u){return u.id == user.id}));
                }
                scope._addUser = function(){
                    if(scope.selected.user){
                        if(scope.done){
                            scope.done(_.find(scope.users,function(u){return u.id==scope.selected.user}));

                        }

                        scope.selected.user = null;
                    }
                }
            }
        }
    }])
}(angular))