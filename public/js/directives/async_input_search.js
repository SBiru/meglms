'use strict';
(function(angular){
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
app.directive('asyncSearch',['$timeout',function($timeout){
    return {
        restrict: 'A',
        require:'^ngModel',
        scope:{
            options:'=?',
            ngModel:'=?',
            ngDisabled: '=?',
            config:'=?',
            searchMethod:'=?',
            onInitialize:'=?'
        },
        template:'<div style="position: relative">' +
        '<span class="fa fa-pulse fa-spinner" ng-show="loading"></span>' +
        '<div selectize2 options="options" ng-model="ngModel" config="config" ng-disabled="ngDisabled"></div>' +
        '</div>',
        controller:function($scope,$element,$attrs){
            var $selectize,
                timeout;
            $scope.config = angular.extend({},{
                onInitialize:function(selectize){
                    $selectize = selectize;
                    $selectize.$control_input.on('keydown',startSearch)
                    $scope.onInitialize && $scope.onInitialize(selectize);
                },
                maxItems: 1,
                placeholder: 'Start typing to search for a user'
            },$scope.config);
            function startSearch(event){
                if(timeout){
                    clearTimeout(timeout)
                }
                timeout = setTimeout(function(){
                    if($scope.searchMethod && $selectize.$control_input.val()){
                        $scope.loading = true;
                        apply();
                        $scope.searchMethod($selectize.$control_input.val(),updateOptions);
                    }

                },300);
            }
            function updateOptions(options){
                delete $scope.loading;
                var newOptions = angular.extend([],options);
                if($selectize.settings.maxItems>1){
                    newOptions = getCurrentSelectedOptions().concat(newOptions);
                }
                $scope.options = newOptions;

                apply();

            }
            function getCurrentSelectedOptions(){
                var idField,
                    selected =[];
                if($selectize.settings.maxItems<2 || !$scope.ngModel || !$scope.ngModel.length)
                    return selected;
                idField = $selectize.settings.valueField;
                selected = _.filter($scope.options,function(option){
                    return $scope.ngModel.indexOf(option[idField])>=0
                });
                return selected;
            }
            function apply(){
                $timeout(function(){$scope.$apply()})
            }
        }
    }
}])
}(angular));