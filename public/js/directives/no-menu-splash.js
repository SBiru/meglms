'use strict';
(function(angular){
angular.module('app').directive('noMenuSplash',['Nav','CurrentCourseId','ProficiencyTestService',function(Nav,CurrentCourseId,ProficiencyTestService){
    return{
        restrict:'EA',
        templateUrl:'/public/views/directives/no-menu-splash.html',
        scope:{
            userId:'=?'
        },
        link:function(scope){
            var self = this,
                attemptsToLoad= 0,
                MAXATTEMPTS=10;
            function init(){
                if(!isDataAvailable())
                    return;
                scope.ready=true;
                scope.courseCompleted = Nav.navData.currentPage.unit==-1 || isLastPage();
                if(!scope.courseCompleted && !(Nav.navData.pageInstructions && Nav.navData.pageInstructions.show)){
                    Nav.showNoMenuInstructions = false;
                }
                if(scope.courseCompleted)
                    sendEmailIfProficiencyTest();
                if(Nav.navData.pageInstructions)
                    scope.previousPageGroup = Nav.navData.pageInstructions.previousPageGroupName;
                scope.courseName = CurrentCourseId.data.name
                setTimeout(function(){scope.$apply()})
            }
            function isLastPage(){
                return Nav.navData.currentPage.unit == Nav.navData.units.length-1 && Nav.navData.currentPage.page == Nav.navData.units[Nav.navData.units.length-1].pages.length-1
            }
            function isDataAvailable(){
                if(!Nav.navData || !Nav.navData.units){
                    if(attemptsToLoad<MAXATTEMPTS){
                        setTimeout(init,200);
                        attemptsToLoad++;
                    }
                    return false;
                }
                return true;
            }

            function sendEmailIfProficiencyTest(){
                // ProficiencyTestService.getClasses({asStudent:1}).$promise.then(function(classes){
                //     if(_.some(classes,{id:CurrentCourseId.data.class_id})){
                //         ProficiencyTestService.testCompleted({
                //             studentId:scope.userId,
                //             classId:CurrentCourseId.data.class_id
                //         })
                //     }
                // })
            }

            scope.goToNext = function(){
                Nav.showNoMenuInstructions = false;
            };
            scope.goToPrevious = function(){
                Nav.showNoMenuInstructions = false;
                window.location = getHref(scope.previousPage)
            };
            function getHref(nav){
                return '#/'+nav.layout+'/'+nav.id;

            }
            scope.$watch('$stateParams.contentId',function(){setTimeout(init,200)});

        }
    }
}])
}(angular));