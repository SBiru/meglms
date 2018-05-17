"use strict";

(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('selectTags',[function(){
        return{
            restrict:'E',
            scope:{
                ngModel:'=?',
                questionCount: '=?'
            },
            templateUrl:'/public/views/directives/quiz-editor/select-tags.html?v=' + window.currentJsVersion
        }
    }]).controller('SelectTagsController',['$scope','QuestionTags',function($scope,QuestionTags){
        this.startSearchTags = function(term,callBack){
            if(term){
                var currentTagIds = $scope.$parent.ngModel?$scope.$parent.ngModel:[];
                QuestionTags.query({
                    term:term,
                    removeEmpty:true,
                    includeDefaults:true,
                    selectedTags:currentTagIds.join(',')
                }).$promise.then(function(tags){
                        callBack(tags);
                    })
            }
        };

        var self = this;
        this.selectizeConfig = {
            placeholder: 'Start typing to search for a tag',
            labelField: 'name',
            valueField:'id',
            searchField: ['name'],
            maxItems:10,
            render:{
                option: function(item, escape) {
                    var label = item.name;
                    var caption = item.type;
                    var className;
                    switch(caption){
                        case 'custom':
                            className = 'label-warning';
                            break;
                        default:
                            className = 'label-primary default-tags';
                            break;
                    }

                    return '<div>' +
                        '<span>' + escape(label) + ' (' + item.questionCount + ')' + '</span>' +
                        '<span class="label '+ className +'" style="margin-left:5px">' + escape(caption) + '</span>' +
                        '</div>';
                }
            },
            onChange:function(values){
                this.close();
                $scope.$parent.ngModel = values;
                values.length && updateQuestionCount(values);
                self.tagOptions = _.filter(self.tagOptions,function(o){return values.indexOf(o.id)>=0});
            }
        };
        function updateQuestionCount(values){
            var lastTag = _.findWhere(self.tagOptions,{id:values[values.length-1]})
            $scope.$parent.questionCount = parseInt(lastTag.questionCount)
        }
        this.tagOptions = [];
    }])
}());