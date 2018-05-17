
var app = angular.module('app')
app.directive('sendProgressReport',[
    'Gradebook',
function(Gradebook){
    return{
        restrict:'E',
        templateUrl:'/public/views/directives/send-report-modal.html',
        scope:{
            reports:'=?',
            isOpened:'=?',
            orgId:'=?'
        },
        link:function($scope){
            $scope.sendReportToUsers = function(){
                var reports = $scope.reports;
                if(!reports) return;
                var options={
                    orgId:$scope.orgId,
                    toRoles:['parents','students'],
                    studentReports:reports
                }
                Gradebook.sendReportToUsers(options,function(){
                    $scope.isOpened=false;
                    toastr.success("The emails were sent to the users");
                },function(error){
                    $scope.isOpened=false;
                    if(error.data.showToUser){
                        toastr.options.timeOut=10000
                        toastr.error(error.data.error);
                    }
                    else{
                        toastr.options.timeOut=1000
                        toastr.error("Something went wrong");
                    }
                })

            }
            $scope.studentAndGuardianEmail = function(student){
                return student.email + ', ' + _.map(student.guardians,function(g){return g.email}).join(', ')
            }
        }
    }
}
]);
