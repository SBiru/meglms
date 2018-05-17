'use strict';
(function(angular){
    angular.module('app').directive("adminUsersForSite",
    ['Site','SiteAdmin','OrganizationV2',function(Site,SiteAdmin,OrganizationV2){
        return{

            restrict:'E',
            templateUrl:'/public/views/directives/admin/admin_users_for_site.html?v='+window.currentJsVersion,
            scope:{
                sites:'=?',
                orgId:'=?'
            },
            link:function(scope){
                function init(){
                    scope.addedIds = [];
                    loadUsers();
                }
                function loadUsers(){
                    OrganizationV2.getUsers(
                        {'id': scope.orgId},
                        function(users){
                            scope.users = users;
                            scope.loading = false;
                        },
                        function(error){
                            scope.error = error.error;
                        }
                    );
                }
                scope.$watch('site',function(site){
                    if(site){
                        prepareAddedIds()
                    }
                })
                function prepareAddedIds(){
                    scope.addedIds=[];
                    angular.forEach(scope.site.admins,function(user){
                        scope.addedIds.push(user.id);
                    })
                }

                scope.isInSite = function(user){
                    return (scope.addedIds.indexOf(user.id) > -1);
                }
                scope.addToSite = function(user,skipSave){
                    scope.addedIds.push(user.id);
                    scope.site.admins.push(user);
                    if(!skipSave)
                        SiteAdmin.addUserAdmin({userId:user.id,siteId:scope.site.id});
                }
                scope.removeFromSite = function(user){
                    SiteAdmin.removeUserAdmin({userId:user.id,siteId:scope.site.id});
                    scope.addedIds.splice(scope.addedIds.indexOf(user.id),1)
                    scope.site.admins.splice(scope.site.admins.indexOf(user),1)
                }
                init();
            }
        }
    }]
    )
}(angular))