'use strict';
(function(angular){
    angular.module('app').service('E3ChatApi',['$resource',function($resource){
        var rootUrl = '/api/chat';
        return $resource(rootUrl,{},{
            loadLog:{
                url: rootUrl+'/:room/log',
                isArray:true,
                params:{room:'@room'}
            },
            getUnreadMessages:{
                url: rootUrl+'/unread-messages'
            },
            loadGroups:{
                url: rootUrl+'/group-rooms',
                isArray:true
            },
            loadOfflineUsers:{
                url: rootUrl+'/offline-users',

            },
            downloadLog:{
                url: rootUrl+'/:room/log/download',
                params:{room:'@room'}
            }

        })
    }])
}(angular))