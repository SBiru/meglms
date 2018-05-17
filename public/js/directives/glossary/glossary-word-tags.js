(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('glossaryWordTags', [
        'GlossaryTags',
        '$modal',
        function(GlossaryTags,$modal){
            return {
                restrict:'A',
                templateUrl:'/public/views/directives/glossary/glossary-word-tags.html?v='+window.currentJsVersion,
                scope:{
                    'word':'=?',
                    'orgId':'=?',
                    'readOnly':'=?'
                },
                link:function(scope,element,attrs){
                    scope.removeTag = function(i){
                        if(!scope.word.id)
                            return spliceTag(i);
                        var newTags = angular.extend([],scope.word.tags),
                            newTagIds;
                        newTags.splice(i,1);
                        newTagIds = _.map(newTags,function(tag){
                            return tag.id
                        });
                        saveTags(scope.word.id,newTagIds);
                    };

                    function saveTags(id,tags){
                        if(id){
                            GlossaryTags.save({id: id,tags:tags}).$promise.then(
                                function(tags){
                                    scope.word.tags = tags;
                                    toastr.success("Saved!");
                                },
                                function(error){
                                    toastr.error("Something went wrong :(");
                                }
                            );
                        }
                    }
                    function appendTags(tags){
                        for(var i = 0; i<tags.length;i++)
                            scope.word.tags.push(tags[i]);
                    }
                    function spliceTag(i){
                        scope.word.tags.splice(i,1);
                    }
                    scope.addTag = function(){
                        $modal.open({
                            templateUrl:'/public/views/directives/glossary/glossary-add-tag-modal.html?v='+window.currentJsVersion,
                            controller:'AddGlossaryTagModalController',
                            resolve:{
                                params:function(){
                                    return {word:angular.copy(scope.word)}
                                }
                            },
                            windowClass:'add-tags-modal modal_95'

                        }).result.then(function(tags){
                            if(!scope.word.id)
                                return appendTags(tags);
                            var newTagIds = pushTags(tags);
                            saveTags(scope.word.id,newTagIds);
                        })
                    };
                    function pushTags(tags){
                        var newTags  = _.map(scope.word.tags,function(tag){
                            return tag.id
                        });
                        for(var i = 0; i<tags.length;i++)
                            newTags.push(tags[i].id);
                        return newTags;
                    }
                }
            }
        }
    ]).controller("AddGlossaryTagModalController",['$scope','$timeout','GlossaryTags','params',function($scope,$timeout,GlossaryTags,params){
        $scope.showCreateButton = false;
        $scope.selectedTagId = null;
        $scope.tagOptions = [];
        $scope.params = params;


        $scope.$watch('showAdvancedOptions',function(){
            var modal = angular.element('.add-tags-modal .modal-dialog');
            if($scope.showAdvancedOptions){
                $( ".add-tags-modal .modal-dialog" ).animate({
                    'max-width':'95%',
                }, 500);

            }
            else{
                $( ".add-tags-modal .modal-dialog" ).animate({
                    'max-width':900,
                }, 500);

            }


        })


        $scope.startSearch = function(term,callBack){
            $scope.showCreateButton = false;
            if(term){
                $scope.ready = false;
                GlossaryTags.queryArray({term:term,orgId:params.word.org_id}).$promise.then(function(tags){
                    callBack(tags);
                    $scope.showCreateButton = tags.length==0;
                })
            }
            $scope.lastTerm = term;
        };


        $scope.createNew = function(term,cb){
            term = term || $scope.lastTerm;
            GlossaryTags.create({tag:$scope.lastTerm,orgId:params.word.org_id}).$promise.then(function(newTag){
                cb(newTag);
            })
        };
        $scope.addTag = function(){
            if(!$scope.selectedTagId)
                return;
            $scope.$close(_.filter($scope.tagOptions,function(o){return $scope.selectedTagId.indexOf(o.id)>=0}));
        };

        $scope.selectizeConfig = {
            placeholder: 'Start typing to search for a tag',
            labelField: 'name',
            valueField:'id',
            maxItems:10,
            searchField: ['name'],
            create: $scope.createNew
        };
        $scope.onInitialize = function(selectize){
            $scope.selectize = selectize;
            $timeout(function () {
                startSelectedTags(selectize);
                selectize.$control_input.click();
                selectize.$control_input[0].focus();
            },100);


        }
        function startSelectedTags(selectize){
            if(params.word && params.word.tags && params.word.tags.length){
                _.each(params.word.tags,function(tag){
                    selectize.addOption(tag);
                    selectize.addItem(tag.id);
                })
            }
        }
    }])

}());