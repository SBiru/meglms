'use strict';
(function(angular){

    angular.module('app').directive('userFormOptions',[function(){
        return {
            restrict: 'E',
            scope:{
                pageOptions:'=?',
                orgDetails:'=?'
            },
            templateUrl:'/public/views/directives/editor/user-form-options.html?v='+window.currentJsVersion,
            link:function(scope){
                scope.formOptions = [
                    {
                        key:'nationality',
                        label:'Nationality'
                    },{
                        key:'gender',
                        label:'Gender'
                    },{
                        key:'language',
                        label:'Native language'
                    },{
                        key:'department',
                        label:'The Department at ' + scope.orgDetails.name + ' that you will be working with'
                    },{
                        key:'department_contact',
                        label:'Primary Contact (the person we should send your interview results to)'
                    },{
                        key:'department_email',
                        label:'Primary Contact Email'
                    }
                ]

            }
        }
    }])
}(angular));