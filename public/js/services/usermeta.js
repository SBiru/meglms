var appServices = angular.module('app.services');
appServices.factory('UserMeta',['$resource',function($resource){
    return $resource('/usermeta/', {userId:'@userId'}, {
        get:{
            url:'/usermeta/:userId/',
            method: 'GET'
        },
        save:{
            url:'/usermeta/:userId/',
            method: 'POST'
        },
        delete:{
            url:'/usermeta/:userId/',
            method: 'DELETE'
        }
    });
}]);
appServices.factory('UserMetaData',['$q','UserMeta','User',
    function($q,UserMeta,User){
    return {
        data:{},
        getData : function(){
            var that = this;
            $q.all({
                user: User.query({userId: 'me'}).$promise,
                usermeta: UserMeta.get({userId: 'me'}).$promise
            }).then(function(result){
                that.data = result.user;
                that.data.meta = result.usermeta;
            });
        }
    };
}]);
