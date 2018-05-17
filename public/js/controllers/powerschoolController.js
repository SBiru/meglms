appControllers.controller('powerschoolController', ['$scope','Powerschool',
    function($scope,Powerschool) {

        Powerschool.getTeacherCourseStats({},function(response){
            $scope.teacherCourseStats = response.unmatched;
        });

    }
]);