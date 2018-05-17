(function(){
"use strict"
angular.module('app').directive('splashPageClass',[
    '$location',
    '$q',
    'MenuV2',
    'Course',
    'ShowDatesGrades',
    'CurrentCourseId',
    'CurrentUnitId',
    'UserV2',
    function($location,$q,MenuV2,Course,ShowDatesGrades,CurrentCourseId,CurrentUnitId,UserV2){
        return{
            restrict:'E',
            template: '<div ng-include="contentUrl"></div>',

            link:function($scope){
                $scope.contentUrl = getContentUrl()
                $scope.orderPages = orderPages;
                $scope.getHref = getHref;
                $scope.goToCourse=goToCourse;
                function orderPages(page){
                    return parseInt(page.position);
                }

                function goToCourse(class_,unit){
                    var courseId = class_.courseid || class_.courseId;
                    CurrentCourseId.setCourseId(courseId);
                    if(unit)
                        CurrentUnitId.setUnitId(unit.id);
                }
                function getHref(page){
                    if($scope.$root.user.org.category_dashboard)
                        return page.is_exempt!='1'?'/#/'+page.layout+'/'+page.id:'';
                    else
                        return page.isAllowed&&page.isExempt!='1'?'/#/'+page.layout+'/'+page.id:'';
                }
                function getContentUrl(){
                    if($scope.$root.user.org.category_dashboard)
                        return '/public/views/directives/splash-page/classes/classUsingCategories.html';
                    else
                        return '/public/views/directives/splash-page/classes/class.html';
                }


            }
        }


    }
])
}())