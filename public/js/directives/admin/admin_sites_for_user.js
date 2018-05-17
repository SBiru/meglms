'use strict';
(function(angular){
    angular.module('app').directive("adminSitesForUser",
    ['Site','SiteAdmin',function(Site,SiteAdmin){
        return{

            restrict:'E',
            templateUrl:'/public/views/directives/admin/admin_sites_for_user.html?v='+window.currentJsVersion,
            scope:{
                userId:'=?',
                orgId:'=?'
            },
            link:function(scope){
                scope.addSite = function(){
                    SiteAdmin.addUserAdmin({userId:scope.userId,siteId:scope.site.id}).$promise.then(function(){
                        scope.sites.push(scope.site);
                    },function(e){
                        toastr.error("Could not save site");
                    });
                };
                scope.removeSite = function(site){
                    var index = scope.sites.indexOf(site);
                    if(index<0) throw "Invalid site";
                    scope.sites.splice(index,1);
                    SiteAdmin.removeUserAdmin({userId:scope.userId,siteId:site.id});
                };
                function loadAvailableSites(){
                    Site.getOrgSites({'orgId': scope.orgId}).$promise.then(function(sites){
                        scope.availableSites = sites;
                    })
                }
                function loadUserSites(){
                    SiteAdmin.sitesForUser({userId:scope.userId}).$promise.then(function(sites){
                        scope.sites = sites;
                    })
                }
                loadAvailableSites();
                loadUserSites();


            }
        }
    }]
    )
}(angular));