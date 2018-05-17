(function(){
    "use strict";
    angular.module('app').directive('glossaryTagsFilter',['$modal','GlossaryTagsPagination','Alerts','GlossaryTags',
        function($modal,GlossaryTagsPagination,Alerts,GlossaryTags){
            return {
                restrict:'E',
                templateUrl:'/public/views/directives/glossary/glossary-tags-filter.html?v='+window.currentJsVersion,
                scope:{
                    selectedTags:'=?',
                    word:'=?',
                    selectizeElement:'=?'
                },
                link:function(scope){
                    scope.pagination = GlossaryTagsPagination.create();
                    scope.filter = {};


                    scope.callbacks = {
                        updateResult:scope.pagination.updatePaginationData.bind(scope.pagination),
                        edit:openEdit,
                        delete:confirmDelete,
                        select:toggleTag,
                        selectedTags:scope.selectedTags
                    };

                    scope.openCreateNew = function(){
                        openEdit(false);
                    };
                    scope.search = function(){
                        if(scope.filter.type!=='term')
                            scope.filter.type = 'term';
                        else{
                            scope.callbacks.changePage && scope.callbacks.changePage();
                        }

                    };
                    function toggleTag(tag){
                        var index;
                        if(scope.word.tags.length)
                            index = _.findIndex(scope.word.tags,{id:tag.id});
                        if(index>=0){
                            scope.selectizeElement && scope.selectizeElement.removeItem(tag.id);
                            scope.word.tags.splice(index,1);
                        }else{
                            scope.selectizeElement && scope.selectizeElement.addOption(tag);
                            scope.selectizeElement && scope.selectizeElement.addItem(tag.id);
                            scope.word.tags.push(tag);
                        }
                    }
                    function openEdit(tag){
                        $modal.open({
                            templateUrl:'/public/views/directives/glossary/glossary-tag-edit-modal.html?v='+window.currentJsVersion,
                            controller:['$scope','params',function($scope,params){
                                $scope.params = params;
                            }],
                            resolve:{
                                params:function(){
                                    return {tag:angular.copy(tag),orgId:scope.word.org_id};
                                }
                            }
                        }).result.then(function(){
                            scope.callbacks.changePage && scope.callbacks.changePage();
                        })
                    }
                    function confirmDelete(tag){
                        Alerts.warning({
                            title:'Delete tag',
                            content:'Are you sure you want to delete this tag from the glossary?',
                            textOk:'Ok'
                        },deleteTag.bind(null,tag));
                    }
                    function deleteTag(tag){
                        GlossaryTags.delete({
                            id:tag.id
                        }).$promise.then(function(){
                            scope.callbacks.changePage && scope.callbacks.changePage();
                        });
                    }
                }
            }
        }])

}());
