"use strict";

(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('selectGlossaryTags',[function(){
        return{
            restrict:'E',
            scope:{
                ngModel:'=?',
                wordCount: '=?',
                orgId:'=?',
                startSearchTags:'=?',
                options:'=?'
            },
            templateUrl:'/public/views/directives/glossary/select-glossary-tags.html?v=' + window.currentJsVersion
        }
    }]).controller('SelectGlossaryTagsController',['$scope','GlossaryTags',function($scope,GlossaryTags){
        if($scope.startSearchTags){
            this.startSearchTags = $scope.startSearchTags.bind(this)
        }
        else{
            this.startSearchTags =  function(term,callBack){
                if(term){
                    var currentTagIds = $scope.$parent.ngModel && _.isArray($scope.$parent.ngModel) ?$scope.$parent.ngModel:[];
                    GlossaryTags.queryArray({
                        term:term,
                        removeEmpty:true,
                        selectedTags:currentTagIds.join(','),
                        orgId:$scope.orgId
                    }).$promise.then(function(tags){
                        callBack(tags);
                    })
                }
            };
        }


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
                    var className = 'label-warning';

                    return '<div>' +
                        '<span>' + escape(label) + ' (' + item.count + ')' + '</span>' +
                        '</div>';
                }
            },
            onChange:function(values){
                this.close();
                $scope.$parent.ngModel = values;
                values.length && updateWordCount(values);
                self.tagOptions = _.filter(self.tagOptions,function(o){return values.indexOf(o.id)>=0});
            }
        };
        function updateWordCount(values){
            var lastTag = _.findWhere(self.tagOptions,{id:values[values.length-1]})
            $scope.$parent.wordCount = parseInt(lastTag.count)
        }
        this.tagOptions = $scope.options || [];
    }])
}());