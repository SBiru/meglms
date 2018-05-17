
try {
    var app = angular.module('app.testbank');
} catch (err) {
    var app = angular.module('app');
}

app
    .directive('studentClassesFilter',
    [
        'Class',
        'UserV2',
        '$filter',
        function(Class,UserV2,$filter) {
            return {
                restrict: 'E',
                require: 'ngModel',
                templateUrl: '/public/views/directives/studentClassesFilter.html',
                scope:{
                    hideViewBtn:'=?',
                    onChange:'=?'
                },
                link: function(scope,element,attrs,ctrl){
                    //private variables
                    var me;

                    scope.selected = {};
                    scope.filters={};
                    scope.canFinish = canFinish;
                    scope.setModel = setModel;


                    //private functions
                    scope.$watch('selected.classId',somethingHasChanged,true);
                    scope.$root.$watch('user',main);

                    function somethingHasChanged(classId){
                        if(!classId || !scope.hideViewBtn || !prepareFilter()) return;
                        setModel();
                    }

                    //main
                    function main(user){
                        if(!user) return;
                        me = user;
                        reloadClasses()
                    }
                    function reloadClasses(){
                        var params = {
                            as:'student'
                        }
                        Class.query(params,function(classes){
                            scope.classes = $filter('orderBy')(classes,'name');
                            scope.classes.splice(0,0,{name:"All classes", id:"all"});

                        },function(error){
                                scope.error = error.error;
                            }
                        )
                    }
                    function canFinish(){
                        return true;
                    }
                    function setModel(){
                        var filter;
                        ctrl.$setViewValue(filter);
                        filter = prepareFilter(true);
                        ctrl.$setViewValue(filter);
                        if(scope.onChange) scope.onChange(filter);
                    }
                    function prepareFilter(throwError){
                        var filter;
                        var filters = [];
                        if(scope.selected.classId == 'all'){
                            filter = {
                                id:'user',
                                length:1,
                                value:me.id
                            }
                        }else{
                            filter = {
                                id:'class',
                                length:1,
                                value:scope.selected.classId
                            }
                        }
                        filters.push(filter)
                        return filters;
                    }
                    ctrl.$render = function(){
                        if(ctrl.$modelValue){
                            _.each(ctrl.$modelValue,function(filter){
                                scope.selected[filter.id + 'Id'] = filter.value;
                                scope.filters[filter.id] = true;
                            })
                        }
                    };
                }

            }
        }
    ]
);