(function(){
    "use strict";
    angular.module('app').directive('glossaryTagsDateFilter',['GlossaryTags',
        function(GlossaryTags){
            return {
                restrict:'E',
                require: 'ngModel',
                templateUrl:'/public/views/directives/glossary/glossary-tags-date-filter.html?v='+window.currentJsVersion,
                scope:{
                    orgId:'=?'
                },
                link:function(scope,el,attr,ngModel){
                    scope.dates = [
                        {period:1,label:'1 Day'},
                        {period:3,label:'3 Days'},
                        {period:7,label:'1 Week'},
                        {period:14,label:'2 Weeks'},
                        {period:21,label:'3 Weeks'},
                        {period:30,label:'1 Month'},
                        {period:'all',label:'All time'},
                    ];

                    scope.setDate = function(period){
                        ngModel.$setViewValue(period)
                    };
                    var unWatch = scope.$watch('ngModel',function(){
                        if(_.isNaN(parseInt(scope.ngModel))){
                            scope.setDate(null);
                        }
                    });
                    scope.$on('$destroy',function(){
                        unWatch();
                    })
                }
            }
        }])

}());
