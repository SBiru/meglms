(function(){
"use strict";
angular.module('app').directive('splashPageClasses',
[
    '$location',
    '$q',
    'MenuV2',
    'Course',
    'ShowDatesGrades',
    'CurrentCourseId',
    'CurrentUnitId',
    'UserV2',
    'Categories',
    function($location,$q,MenuV2,Course,ShowDatesGrades,CurrentCourseId,CurrentUnitId,UserV2,Categories){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/splash-page/classes/classes.html',
            link:function($scope){

                $scope.showTeacherWarning = showTeacherWarning;
                $scope.showStartLearningText = showStartLearningText;

                $scope.$watch('user',userChanged);
                $scope.classes=[];

                function userChanged(user){
                    if(user){
                        if(user.org.category_dashboard)
                            getClassesUsingCategories();
                        else
                            getClassesUsingAllPages();
                    }
                }
                function getClassesUsingAllPages(){
                    UserV2.getUser().then(function(res){
                        getMenusForMyClasses(res.classes);
                    });
                }
                function getMenusForMyClasses(courses){
                    if($location.path()=="/password"){
                        return;
                    }
                    var query = {}
                    $scope.loading=true;
                    if(!courses.length)
                        $scope.loading=false;

                    var classCount = 0;
                    _.each(courses,function(course){
                        if (course.isTeacher == false){
                            if (course.is_active === false){
                                return
                            }
                            classCount++;
                        }
                        if(classCount>16)
                            return;
                        var groupId;
                        var courseId;
                        //if it has '-' then this course uses groups (courseId-groupId)
                        if(course.groupId){
                            groupId = course.groupId;
                            courseId = course.courseId;
                        }
                        else courseId = course.courseId;
                        if(!course.isTeacher)
                            query[courseId]=MenuV2.get({courseId:courseId,groupId:groupId}).$promise;
                        else{
                            $scope.classes.push(course);
                        }
                    });
                    $q.all(query).then(function(menus){
                        for(var id in menus){
                            menus[id].courseid=id;
                            $scope.classes.push(handleClassName(menus[id]));
                        }
                        $scope.loading=false;
                    },function(error){
                        $scope.loading=false;
                        $scope.error=true;
                    });
                }
                function handleClassName(class_){
                    if(class_.isFinished || class_.isSuspended || class_.isExpired){
                        class_.isAllowed=false;
                    }else{
                        class_.isAllowed=true;
                    }
                    if(class_.isFinished){
                        class_.name += ' - Finished';
                    }else if(class_.isSuspended){
                        class_.name += ' - You are suspended';
                    }else if(class_.isExpired){
                        class_.name += ' - Class expired on ' + class_.expiration_date;
                    }
                    return class_
                }

                function getClassesUsingCategories(){
                    if(!hasClasses()){
                        $scope.loading = true;
                        Categories.user.query({
                            userId:'me'
                        },function(classes){
                            $scope.loading = false;
                            $scope.classes=classes;
                        },function(error){
                            $scope.loading = false;
                            $scope.error = error;
                        })
                    }
                }

                function showStartLearningText(){
                    if(!hasClasses())
                        return false;
                    for(var i = 0;i<$scope.classes.length;i++){
                        if($scope.classes[i].isStudent)
                            return true;
                    }
                    return false;
                }
                function showTeacherWarning(){
                    if(!hasClasses()){
                        return false;
                    }
                    for(var i = 0;i<$scope.classes.length;i++){
                        if($scope.classes[i].isTeacher)
                            return true;
                    }
                    return false;
                }
                function hasClasses(){
                    return $scope.classes && $scope.classes.length;
                }
            }
        }
    }
])
}());