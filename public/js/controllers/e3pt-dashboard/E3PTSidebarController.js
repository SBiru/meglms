angular.module('app')

    .controller('E3PTSidebarController',['$scope','Gradebook','ProficiencyTestService','HelperService','SharedTestSidebarController','TestSchoolsSubmitted',function($scope,Gradebook,ProficiencyTestService,HelperService,SharedTestSidebarController,TestSchoolsSubmitted){
        var self = this;
        $scope.$watch('$root.user',function(user){

            if(user){
                if(user.school_admin){
                    $scope.schoolId = user.school_admin;
                    TestSchoolsSubmitted.query({includeGradebook:true,schoolId:$scope.schoolId}).$promise.then(function(tests){
                        tests[0].students = _.chain(tests).map(function(t){return t.students}).flatten().value();
                        init({gradebook:tests[0]})
                    });
                }else{
                    init({})
                }


            }
            function init(params){
                SharedTestSidebarController.call(self,$scope,Gradebook,ProficiencyTestService,HelperService,_.extend({
                    dashboardState:'e3pt_dashboard',
                    isJ1:0,
                    isE3PT:1
                },params))
            }

        })



    }]);