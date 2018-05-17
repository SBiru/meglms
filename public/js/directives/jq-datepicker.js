angular.module('app')
.directive('jqdatepicker', function($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
           options: '=?'
        },
        link: function(scope, element, attrs, ctrl) {
            var options = {
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true


            };
            angular.extend(options,scope.options);
            createElement();

            function createElement(){
                jQuery(element).datepicker(options)
                bindOnSelect()
            }
            function bindOnSelect(){
                jQuery(element).datepicker('option', 'onSelect', function(date) {
                    $timeout(function(){
                        ctrl.$setViewValue(date);
                        ctrl.$render();
                        scope.$apply();
                        if(options.onSelect){
                            options.onSelect(date);
                        }
                    })
                });
            }



            //binding refresh function to root scope
            scope.$root.refreshDatepicker = function(){
                jQuery(element).datepicker('refresh');
                bindOnSelect()
            }
            scope.$watch(
                function(){
                    return ctrl.$modelValue;
                }, function(data, oldValue){
                    if(data)
                        jQuery(element).datepicker('setDate',data);
                }, true);
            scope.$watch('options',function(newOptions){
                if(newOptions){
                    angular.extend(options,newOptions);
                    createElement();
                }
            })
        }
    };
});