'use strict';
(function(angular){
angular.module('app').directive('selectAssignment',['myClasses','Class','UserV2',
    function(myClasses,Class,UserV2){
    return{
        restrict:'E',
        require: "?ngModel",
        scope:{
            forClass:'=?',
            onlyGradeable:'=?'
        },
        template:'<select selectize ng-change=onChange() ng-model="selectedAssignment" ng-options="a as a.name for a in assignments"></select>',
        link:function(scope,el,attr,ngModel){
            var unWatchClass = scope.$watch('forClass',init);
            function init(){
                if(!scope.forClass || !scope.forClass.id){
                    return;
                }
                scope.class_ = getClass(scope.forClass.id)
                if(scope.class_ && scope.class_.assignments){
                    scope.assignments = angular.copy(class_.assignments)
                    return;
                }
                loadAssignments();
            }
            function getClass(id){
                return _.find(myClasses,{id:id});
            }
            function loadAssignments(){
                scope.loadingAssignments = true;
                Class.getAssignments({id:scope.forClass.id,onlyGradeable:scope.onlyGradeable}).$promise.then(function(assignments){
                    delete scope.loadingAssignments;
                    scope.assignments = assignments;
                    if(scope.class_){
                        scope.class_.assignments = angular.copy(assignments);
                    }
                },function(error){
                    delete scope.loadingAssignments;
                })
            }
            ngModel.$render = function(){
                scope.selectedAssignment = ngModel.$modelValue;
            };
            scope.onChange = function(){
                ngModel.$setViewValue(angular.copy(scope.selectedAssignment));
            }
            el.on("destroy",function(){
                unWatchClass();
                scope.destroy();
            })
        }
    }
}])
}(angular))