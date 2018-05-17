'use strict';
(function(angular){
    angular.module('app').directive('testSchoolsSubmitted',['UserV2','TestSchoolsSubmitted','HelperService','$modal',function(UserV2,TestSchoolsSubmitted,HelperService,$modal){
        return {
            restrict: 'E',
            templateUrl:'/public/views/directives/admin/proficiency_test_schools/test_schools_submitted.html',
            scope:{
                tests:'=?',
                schoolId:'=?',
            },
            controller:function($scope){
                $scope.loading = {};
                $scope.selectedUser = {}
                if(!$scope.schoolId){
                    throw "Invalid schoolId"
                }

                if(_.isUndefined($scope.tests)){
                    getTests();
                }
                function getTests(){
                    runAsyncCall('query',{schoolId:$scope.schoolId},'tests',function(tests){
                        $scope.tests = tests;
                    })
                }

                $scope.showTest = function(test){
                    $modal.open({
                        template:'<span class="fa fa-close" ng-click="cancel()"></span><div test-dashboard-details class-id="testId" student-id="userId" hide-back="true"></div>',
                        controller:['$scope','testId','userId','$modalInstance',function($scope,testId,userId,$modalInstance){
                            $scope.userId = userId;
                            $scope.testId = testId;
                            $scope.cancel = $modalInstance.dismiss
                        }],
                        resolve:{
                            testId:function(){return test.testId},
                            userId:function(){return test.userId}
                        },
                        size:'lg',
                        windowClass:'test-details-modal'
                    })
                }

                function runAsyncCall(method,params,loadingFlag,callBack){
                    HelperService.runAsyncCall(
                        TestSchoolsSubmitted[method],
                        params,
                        {obj:$scope.loading,flag:loadingFlag},
                        callBack
                    );
                }
            }
        }
    }]).service('TestSchoolsSubmitted',['$resource',function($resource){
        return $resource('/api/proficiency-test/school/:schoolId/submitted/:userId',{schoolId:'@schoolId',userId:'@userId'});
    }])
}(angular))