appControllers.controller('TeacherInfoMenuController', ['$scope','$q','ClassMetaData','CurrentCourseId','User','E3ChatUsers',
    function($scope,$q,ClassMetaData,CurrentCourseId,User,E3ChatUsers){
        $scope.me = ClassMetaData;
        $scope.course = CurrentCourseId;

        $scope.$watch('course.course_id',function(){
            $scope.me.getData(CurrentCourseId.getCourseId());
        });
        $scope.$watch('me.data.teacher.meta_value',function(newValue){
            if(angular.isDefined(newValue))
                User.get({
                        userId:$scope.me.data.teacher.meta_value
                    },function(user){
                        user.user_id=user.id;
                        $scope.me.teacher = user;
                    }
                );
        });
        $scope.checkIsOnline = function(){
            return $scope.me.teacher  && E3ChatUsers.isOnline($scope.me.teacher.id)
        }
        $scope.show_edit = function(){
            return window.location.pathname=='/editor/';
        }
        $scope.prepareForEmail = function(){
            return {
                fname: $scope.me.data.fname.meta_value,
                lname: $scope.me.data.lname.meta_value,
                email: $scope.me.data.email.meta_value
            }
        }
        $scope.openChat = function(){
            if($scope.checkIsOnline())
                $scope.$root.$broadcast('OpenChat',{userId:$scope.me.teacher.id});
        }
    }
]);

