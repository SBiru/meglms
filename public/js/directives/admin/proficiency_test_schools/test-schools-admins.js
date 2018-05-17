'use strict';
(function(angular){
    angular.module('app').directive('testSchoolsAdmins',['UserV2','TestSchoolsAdmins','HelperService',function(UserV2,TestSchoolsAdmins,HelperService){
        return {
            restrict: 'E',
            templateUrl:'/public/views/directives/admin/proficiency_test_schools/test_schools_admin.html',
            scope:{
                admins:'=?',
                schoolId:'=?',
            },
            controller:function($scope){
                $scope.loading = {};
                $scope.selectedUser = {}
                if(!$scope.schoolId){
                    throw "Invalid schoolId"
                }

                if(_.isUndefined($scope.admins)){
                    getAdmins();
                }
                function getAdmins(){
                    runAsyncCall('query',{schoolId:$scope.schoolId},'admins',function(admins){
                        $scope.admins = admins;
                    })
                }
                $scope.canAddAdmin = function(){
                    return $scope.selectedUser.Id;
                };
                $scope.addAdmin = function(){
                    var id = $scope.schoolId.id?$scope.schoolId.id:$scope.schoolId;
                    runAsyncCall('save',{schoolId:id,userId:$scope.selectedUser.Id},'adding',function(){
                        toastr.success("A new admin was added!");
                        $scope.addingNew = false;
                        getAdmins();
                    })
                };
                $scope.removeAdmin = function(id){
                    runAsyncCall('delete',{schoolId:$scope.schoolId,userId:id},'removing',function(){
                        toastr.success("The admin was removed");
                        getAdmins();
                    })
                }
                $scope.startSearch = function(term,callBack){
                    if(term){
                        UserV2.getUsers({term:term}).$promise.then(function(users){
                            callBack(_.map(users,function(u){
                                u.text = u.firstName + ' ' + u.lastName + " (" + u.email + ")"
                                u.value = u.id;
                                return u;
                            }))
                        })
                    }
                }
                function runAsyncCall(method,params,loadingFlag,callBack){
                    HelperService.runAsyncCall(
                        TestSchoolsAdmins[method],
                        params,
                        {obj:$scope.loading,flag:loadingFlag},
                        callBack
                    );
                }
            }
        }
    }]).service('TestSchoolsAdmins',['$resource',function($resource){
        return $resource('/api/proficiency-test/school/:schoolId/admin/:userId',{schoolId:'@schoolId',userId:'@userId'});
    }])
}(angular))