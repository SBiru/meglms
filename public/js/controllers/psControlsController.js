/**
 * Created by root on 2/13/17.
 */
appControllers.controller('psControlsController', ['$rootScope','$scope','$http','$modal',
    function($rootScope,$scope,$http,$modal) {

        $.ajax({
            method: "POST",
            url: "../powerschool/get_settings.php",
            headers: {
                "accept":"application/json"
            }
        }).done(function (response) {
            var returnObj = JSON.parse(response);
            $scope.reportTo = returnObj.reportTo;
            $scope.termids = returnObj.termids;
            $scope.schoolids = returnObj.schoolids;
        });

        $scope.saveSettings = function() {
            var settings = {
                reportTo: $scope.reportTo,
                termids: $scope.termids,
                schoolids: $scope.schoolids
            };
            $http({
                method: "POST",
                url: "../powerschool/save_settings.php",
                data: settings
            }).then(function () {
                    alert("Update complete");
                },
                function errorHandler(response) {
                    console.log(response);
                }
            );
        };

        $scope.editAdvisors = function() {
            $modal.open({
                templateUrl: '/public/views/partials/admin/editadvisormap.html',
                controller: 'EditAdvisorsModal',
                size: 'lg',
                resolve: {
                    'orgId': function(){
                        return $rootScope.$stateParams.organizationId;
                    }
                }
            });
        }
    }
]);