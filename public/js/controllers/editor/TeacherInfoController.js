appControllers.controller('TeacherInfoController', ['$scope','$window','$q','ClassMeta','ClassMetaData','CurrentCourseId','$modal','CourseClass','E3ChatUsers',
    function($scope,$window,$q,ClassMeta,ClassMetaData,CurrentCourseId,$modal,CourseClass,chatUsers){
        $scope.me = ClassMetaData;


        $scope.original = angular.copy($scope.me.data);
        CourseClass.teachers(
            {courseId:CurrentCourseId.getCourseId()},
            function(response){
                $scope.teachers=response.teachers;
                if(!angular.isDefined($scope.me.data.teacher)){
                    $scope.me.data.teacher={meta_value:response.teachers[0].id}
                }

            }
        );
        $scope.$watch('me.data.teacher.meta_value',function(id){
            var teacher = _.find($scope.teachers,{id:id})
            if(teacher){
                if(!$scope.me.data.v_office_hours)
                    $scope.me.data = _.extend({
                            v_office_hours: {meta_value: ''},
                            office_hours: {meta_value: ''},
                            v_office_url: {meta_value: ''}
                        },
                        $scope.me.data
                    )
                $scope.me.data.v_office_hours.meta_value = teacher.meta.v_office_hours;
                $scope.me.data.office_hours.meta_value = teacher.meta.office_hours;
                $scope.me.data.v_office_url.meta_value = teacher.meta.v_office_url;
            }
        })

        if(!angular.isDefined($scope.me.data.length))
            $scope.me.getData(CurrentCourseId.getCourseId());

        //   $scope.me.getData();

        $scope.open = function(size) {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/editor/photo-modal.html',
                controller: 'ProfilePhotoModalController',
                size: size,
                windowClass: 'photo-modal-window'
            });
            modalInstance.result.then(function(result){
                if(!angular.isDefined($scope.me.data.profile_picture))
                    $scope.me.data.profile_picture={};
                $scope.me.data.profile_picture.meta_value = result;
            });
        };
        $scope.save = function(){
            $scope.saving=true;
            var metadata = {classId:CurrentCourseId.getCourseId()}
            for(var i in $scope.me.data){
                if(angular.isDefined($scope.me.data[i].meta_value))
                    metadata[i]=$scope.me.data[i].meta_value;
            }
            ClassMeta.save(metadata,function(){
                $scope.saving=false
                $scope.original = angular.copy($scope.me.data);
            });

        };

        $scope.canSave=function(){
            return !angular.equals($scope.original,$scope.me.data);
        }

        window.onbeforeunload = function(){
            if($scope.canSave()){
                return 'You have unsaved changes, are you sure you want to leave?'
            }
        }
        $scope.$on("$locationChangeStart", confirmLeavePage);

        function confirmLeavePage(event) {
            if ($scope.canSave())
                if(!confirm('You have unsaved changes, are you sure you want to leave?')){

                    event.preventDefault();

                }
        }



    }
]);