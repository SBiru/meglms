(function(){
    "use strict";
    angular.module('app').directive('glossaryEditor',['$modal','Glossary','GlossaryWords','GlossaryWordPagination','Alerts','GlossaryModals',
        function($modal,Glossary,GlossaryWords,GlossaryWordPagination,Alerts,GlossaryModals){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-editor.html?v='+window.currentJsVersion,
            scope:{
                pageId:'=?',
                orgId:'=?',
                linkOptions:'=?'
            },
            link:function(scope){
                scope.pagination = GlossaryWordPagination.create();
                scope.selected = {};
                scope.search = loadGlossary;

                scope.callbacks = {
                    changePage:loadGlossary,
                    delete:confirmDelete,
                    canSelectDefinition:true,
                    toggleDefinition:toggleDefinition
                };

                var modals = GlossaryModals.start(scope.callbacks,scope.orgId);
                scope.callbacks.editDefinition = modals.openEditDefinition.bind(modals);;
                scope.callbacks.deleteDefinition = modals.confirmDeleteDefinition.bind(modals);;
                if(scope.pageId)
                    loadGlossary();

                scope.openModal = function(type,params){
                    var templateUrl
                    if(type==='manager'){
                        templateUrl='/public/views/directives/glossary/glossary-word-manager-modal.html?v='+window.currentJsVersion
                    }
                    $modal.open({
                        controller:['$scope','params',function($scope,params){
                            $scope.params = params;
                        }],
                        templateUrl:templateUrl,
                        resolve: {
                            params: function () {
                                return params;
                            }
                        }
                    }).result.then(loadGlossary)
                }
                function loadGlossary(){
                    scope.loading = true;
                    Glossary.get(_.extend({
                        id:scope.pageId,
                        limit:scope.pagination.paginationConfig.itemsPerPage,
                        page:scope.pagination.paginationConfig.currentPage+1
                    },prepareTermParams())).$promise.then(function(result){
                        scope.loading = false;
                        scope.pagination.updatePaginationData(result);
                    });
                }
                function prepareTermParams(){
                    if(!scope.selected.searchTerm) return {};
                    if(scope.full_text){
                        return {
                            term:"^"+scope.selected.searchTerm+"$",
                            isRegex:1
                        }
                    }else{
                        return {
                            term:scope.selected.searchTerm
                        }
                    }
                }

                function confirmDelete(word){
                    Alerts.warning({
                        title:'Remove word',
                        content:'Are you sure you want to remove this word from the glossary?',
                        textOk:'Ok'
                    },deleteWord.bind(null,word));
                }
                function deleteWord(word){
                    Glossary.removeWords({
                        id:scope.pageId,
                        wordIds:[word.id]
                    }).$promise.then(function(){
                        loadGlossary();
                    });
                }
                function toggleDefinition(id,isSelected){
                    Glossary.toggleDefinition({
                        id:scope.pageId,
                        definitionId:id,
                        isSelected:isSelected
                    }).$promise.then(function(){
                        loadGlossary();
                    });
                }

            }
        }
    }])

}());
