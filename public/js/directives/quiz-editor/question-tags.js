(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('questionTags', [
        'QuestionTags',
        '$modal',
            function(QuestionTags,$modal){
                return {
                    restrict:'A',
                    templateUrl:'/public/views/directives/quiz-editor/question-tags.html?v='+window.currentJsVersion,
                    scope:{
                        'question':'=?'
                    },
                    link:function(scope,element,attrs){
                        scope.removeTag = function(i){
                            if(!scope.question.id)
                                return spliceTag(i);
                            var newTags = angular.extend([],scope.question.custom_tags),
                                newTagIds;
                            newTags.splice(i,1);
                            newTagIds = _.map(newTags,function(tag){
                                return tag.id
                            });
                           saveTags(scope.question.id,newTagIds);
                        };

                        function saveTags(id,tags){
                            if(id){
                                QuestionTags.save({id: id,tags:tags}).$promise.then(
                                    function(tags){
                                        scope.question.custom_tags = tags;
                                        toastr.success("Saved!");
                                    },
                                    function(error){
                                        toastr.error("Something went wrong :(");
                                    }
                                );
                            }
                        }
                        function appendTag(tag){
                            scope.question.custom_tags.push(tag);
                        }
                        function spliceTag(i){
                            scope.question.custom_tags.splice(i,1);
                        }
                        scope.addTag = function(){
                            $modal.open({
                                templateUrl:'/public/views/directives/quiz-editor/modals/question.tag.create.modal.html?v='+window.currentJsVersion,
                                controller:'AddQuestionTagModalController'

                            }).result.then(function(tag){
                                if(!scope.question.id)
                                    return appendTag(tag);
                                var newTagIds = pushTag(tag.id);
                                saveTags(scope.question.id,newTagIds);
                            })
                        };
                        function pushTag(tagId){
                            var newTags  = _.map(scope.question.custom_tags,function(tag){
                                return tag.id
                            });
                            newTags.push(tagId);
                            return newTags;

                        }
                    }
                }
            }
        ]).service("QuestionTags",['$resource',function($resource){
        return $resource('/api/questions/tags',{'id':'@id'},{
            create:{
                method:"POST"
            },
            save:{
                method:"POST",
                url:"/api/questions/:id/tags",
                isArray:true
            },
            filterQuestions:{
                url:'/api/questions/tags/filter'
            }

        })
    }]).controller("AddQuestionTagModalController",['$scope','QuestionTags',function($scope,QuestionTags){
        $scope.showCreateButton = false;
        $scope.selectedTagId = null;
        $scope.tagOptions = [];

        $scope.startSearch = function(term,callBack){
            $scope.showCreateButton = false;
            if(term){
                $scope.ready = false;
                QuestionTags.query({term:term}).$promise.then(function(tags){
                    callBack(tags);
                    $scope.showCreateButton = tags.length==0;
                })
            }
            $scope.lastTerm = term;
        };


        $scope.createNew = function(term){
            term = term || $scope.lastTerm;
            QuestionTags.create({tag:$scope.lastTerm}).$promise.then(function(newTag){
                $scope.$close(newTag);
            })
        };
        $scope.addTag = function(){
            if(!$scope.selectedTagId)
                return;
            $scope.$close(_.findWhere($scope.tagOptions,{id:$scope.selectedTagId}));
        };

        $scope.selectizeConfig = {
            placeholder: 'Start typing to search for a tag',
            labelField: 'name',
            valueField:'id',
            searchField: ['name'],
            create: $scope.createNew
        };
    }])

}());