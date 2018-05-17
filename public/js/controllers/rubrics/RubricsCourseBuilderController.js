appControllers.controller('RubricsCourseBuilderController', [ '$scope','$state','EditCourse','CurrentCourseId',
    function($scope,$state,EditCourse,CurrentCourseId){
        $scope.getOrg = function(){
            var courseId;
            if($scope.$root.course){
                courseId = $scope.$root.course.id;
            }
            EditCourse.get({courseId:courseId || CurrentCourseId.getCourseId()},function(response){
                    $scope.org_id = response.course.organization_id;
                }
            );
        }
        $scope.getOrg();

    }
]);