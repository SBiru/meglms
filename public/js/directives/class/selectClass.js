'use strict';
(function(angular){
angular.module('app').value('myClasses',{}).directive('selectClass',['myClasses','OrganizationV2','UserV2','$filter',
    function(myClasses,OrganizationV2,UserV2,$filter){
    return{
        restrict:'E',
        require: "?ngModel",
        scope:{
            role:'=',
            options: '='
        },
        template:'<select selectize ng-change=onChange() ng-model="selectedClass" ng-options="class as class.name for class in myClasses"></select>',
        link:function(scope,el,attr,ngModel){
            scope.myClasses = angular.copy(myClasses);
            var loadClassesRoles = {
                teacher:loadClassesForTeachers,
                advisor:function(){},
                'edit-teacher':function(){},
                student:function(){}
            }

            UserV2.getUser().then(function(user){
                scope.user = angular.copy(user);
                init()
            })

            function init(){
                if(_.isEmpty(myClasses)){
                    loadClasses();
                }
            }
            function loadClasses(){
                if(_.isFunction(loadClassesRoles[scope.role])){
                    scope.loadingClasses = true;
                    loadClassesRoles[scope.role]().then(prepareClasses,handleErrors);
                }
            }
            function prepareClasses(classes){
                delete scope.loadingClasses;
                if(scope.options){
                    classes = applyExtraOptions(classes);
                }
                myClasses = classes;
                scope.myClasses = angular.copy(classes);
            }
            function handleErrors(error){
                delete scope.loadingClasses
            }
            function applyExtraOptions(classes){
                if(scope.options.filter){
                    classes = applyFilters(classes);
                }
                return classes;
            }
            function applyFilters(classes){
                return $filter('filter')(classes,scope.options.filter);
            }

            function loadClassesForTeachers(){
                return OrganizationV2.getClasses({id:scope.user.orgId}).$promise
            }
            ngModel.$render = function(){
                scope.selectedClass = ngModel.$modelValue;
            };
            scope.onChange = function(){
                ngModel.$setViewValue(angular.copy(scope.selectedClass));
            }
            el.on('$destroy',function(){
                scope.$destroy();
            })
        }
    }
}])
}(angular))