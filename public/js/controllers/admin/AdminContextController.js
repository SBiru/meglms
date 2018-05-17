/**
 * This controller is in charge of keeping track of context for the admin page.
 */
appControllers.controller('AdminContextController', ['$rootScope', '$scope', '$modal', 'Languages',
    function($rootScope, $scope, $modal, Languages) {
        $scope.languages = [];
        Languages.get({}, function(languages) {
            $scope.languages = languages.languages;

        });
        $scope.isCourseManagementView = true;


        $scope.$on('TranslationsMenu', function(){
            $scope.isCourseManagementView = false;
        });

        $scope.$on('ClassManagementMenu', function(){
            $scope.isCourseManagementView = true;
        });

        // This object houses the options for the chat preference selection when adding a course. The value that is
        // to be persisted in the database is the enumeration value of 'code'
        $scope.chatPreferences = [{
            label: 'Students can chat with teacher and other students',
            value: 'all',
            code: 0
        }, {
            label: 'Students can only chat with teacher',
            value: 'student2Teacher',
            code: 1
        }, {
            label: 'Disable chat for this course',
            value: 'disabled',
            code: 2
        }];

        $scope.editSites = function(){
            $modal.open({
                templateUrl: '/public/views/partials/admin/editsitesmodal.html?v='+window.currentJsVersion,
                controller: 'EditSitesModal',
                size: 'lg',
                resolve: {
                    'orgId': function(){
                        return $rootScope.$stateParams.organizationId;
                    }
                }
            });
        };
        if($(window).width() <768){
            $rootScope.sidebarCollapsed = true;
            $("#superadmin-content").css("cssText", "margin-left: 25% !important");
        }
        $rootScope.toggleSidebar = function() {
            if(!$rootScope.sidebarCollapsed){
                $("#superadmin-content").css("cssText", "margin-left: 15px !important");
            }else {
                $("#superadmin-content").css("cssText", "margin-left: 25% !important");
            }
            $rootScope.sidebarCollapsed = !$rootScope.sidebarCollapsed;
            var xValue = $rootScope.sidebarCollapsed?"-100%":"0";
            $('.sidebar').css({"transform": "translateX("+xValue+")"});
        }
        $scope.powerschoolImport = function(){
            $modal.open({
                templateUrl: '/public/views/partials/admin/powerschoolimportmodal.html',
                controller: 'PowerschoolImportModal',
                size: 'md',
                backdrop : 'static',
                resolve: {
                    'orgId': function(){
                        return $rootScope.$stateParams.organizationId;
                    }
                }
            });
        };
    }
]);