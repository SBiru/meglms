angular.module('app')
    .controller('ComplianceUsersContentController',['$scope','ComplianceContentShared',function($scope,ComplianceContentShared){
        var vc_content = this;
        this.loading=true;
        var userId= $scope.$state.params.id;
        ComplianceContentShared.init(vc_content,$scope,'getUser',{userId:userId})

        this.placeholder = 'Search for a class'
        this.title = 'Classes'

    }])
    .controller('ComplianceClassesContentController',['$scope','ComplianceContentShared',function($scope,ComplianceContentShared){
        var vc_content = this;
        this.loading=true;
        var classId= $scope.$state.params.id;
        ComplianceContentShared.init(vc_content,$scope,'getClass',{classId:classId})

        this.placeholder = 'Search for a user'
        this.title = 'Users'

    }]).factory('ComplianceContentShared',['ComplianceDashboard',function(ComplianceDashboard){
        return {
            init:function(vc,$scope,method,params){


                ComplianceDashboard[method](params).$promise.then(function(res){
                    vc.loading = false;
                    vc.data = res;
                    vc.data.item.sort = {
                        by: 'percCompletedTasks',
                        reverse:false
                    }
                },function(){
                    vc.loading = false;
                });

                $scope.formatDate = function(str){
                    return moment(str).format('MMM Do YYYY');
                }
                $scope.sortBy = function(obj,predicate){
                    if(!obj.sort){
                        obj.sort = {by:'lastName',reverse:false}
                        return;
                    }
                    if(obj.sort.by==predicate)
                        obj.sort.reverse=!obj.sort.reverse;
                    else{
                        obj.sort.reverse=false;
                        obj.sort.by=predicate;
                    }
                }
            }
        }
}]);