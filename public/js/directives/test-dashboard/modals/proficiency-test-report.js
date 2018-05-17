'use strict';
(function(angular){

angular.module('app').directive('proficiencyTestReport',
['ProficiencyTestService',function(ProficiencyTestService){
   return{
       restrict:'EA',
       templateUrl:'/public/views/directives/test-dashboard/modals/proficiency-test-report.html?v='+window.currentJsVersion,
       scope:{
           studentId:'=?',
           testId:'=?',
           test:'=?',
           cancel:'=?'
       },
       link:function(scope){
           var _testId = scope.testId
           if(_testId && !scope.test){
               ProficiencyTestService.get({studentId:scope.studentId,classId:_testId},init);
           }
           function init(test){
               if(test)
                scope.test = test;
           }
           init();
           scope.hasAdditionalComments = function(){
               return Array.isArray(scope.test.additionalComments) == false;
           }
       }


   }
    function fakeReport(){

    }
}])


}(angular))