(function(){
    "use strict";
    angular.module('app').directive('glossaryWordManager',['$modal','GlossaryWordPagination','Glossary','GlossaryWords','Alerts','GlossaryModals',
        function($modal,GlossaryWordPagination,Glossary,GlossaryWords,Alerts,GlossaryModals){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-word-manager.html?v='+window.currentJsVersion,
            scope:{
                onlySelect:'=?',
                close:'=?',
                pageId:'=?',
                orgId:'=?',
            },
            link:function(scope){

                scope.pagination = GlossaryWordPagination.create();

                scope.callbacks = {
                    updateResult:scope.pagination.updatePaginationData.bind(scope.pagination),
                    close:scope.close,
                    delete:confirmDelete,
                    canSelectDefinition:false,

                };



                scope.search = function(){
                    if(scope.filter.type!=='term')
                        scope.filter.type = 'term';
                    else{
                        scope.callbacks.changePage && scope.callbacks.changePage();
                    }

                };

                scope.addWords = function(){
                    if(!scope.pageId) return;
                    if(scope.pagination.paginationConfig.selectAll)
                        addFromSelectAll();
                    else addFromArray();
                };
                function addFromSelectAll(){
                    var pConfig = scope.pagination.paginationConfig;
                    var ignoreIds = pConfig.ignoreIds || [];
                    var params = _.extend({},pConfig.lastSearch.params,{
                        saveToGlossary:scope.pageId,
                        ignoreIds:ignoreIds.join(',')
                    });
                    pConfig.lastSearch.fn(params).$promise.then(handleAddWordsSuccess);
                }
                function addFromArray(){
                    var words = scope.pagination.paginationConfig.selectedIds;
                    if(!words){
                        return toastr.error("Nothing to add");
                    }
                    Glossary.save({
                        id:scope.pageId,
                        words:words
                    }).$promise.then(handleAddWordsSuccess)
                }
                function handleAddWordsSuccess(){
                    scope.close && scope.close();
                }

                var modals = GlossaryModals.start(scope.callbacks,scope.orgId);
                scope.openCreateNew = modals.openCreateNew.bind(modals);;

                scope.openImport = modals.openImport.bind(modals);;
                scope.callbacks.edit = modals.openEditWord.bind(modals);
                scope.callbacks.editDefinition = modals.openEditDefinition.bind(modals);
                scope.callbacks.createDefinition = modals.openCreateDefinition.bind(modals);
                scope.callbacks.deleteDefinition = modals.confirmDeleteDefinition.bind(modals);


                function confirmDelete(word){
                    Alerts.warning({
                        title:'Delete word',
                        content:'Are you sure you want to delete this word from the glossary?',
                        textOk:'Ok'
                    },deleteWord.bind(null,word));
                }
                function deleteWord(word){
                    GlossaryWords.delete({
                        id:word.id
                    }).$promise.then(function(){
                        scope.callbacks.changePage && scope.callbacks.changePage();
                    });
                }
            }
        }
    }]).factory('GlossaryModals',['$modal','GlossaryWords','Alerts',function($modal,GlossaryWords,Alerts){
        var Instance = function(callbacks,orgId){
            var self = this;
            this.callbacks = callbacks;
            this.orgId = orgId;
            this.openEditWord = function(word){
                word = angular.copy(word);
                word['description'] = '';
                this.openModal('glossary-word-edit-modal',{word:angular.copy(word),editWord:true,orgId:this.orgId})
            }
            this.openEditDefinition = function(def,word){
                def.word = word
                this.openModal('glossary-word-edit-modal',{word:angular.copy(def),editDefinition:true,orgId:this.orgId})
            };
            this.openCreateDefinition = function(word){
                var w = angular.copy(word);
                w.tags = []
                w.id = undefined;
                this.openModal('glossary-word-edit-modal',{word:w,editDefinition:true,orgId:this.orgId,newDefinition:true})
            };
            this.openCreateNew = function(){
                this.openModal('glossary-word-edit-modal',{editDefinition:true,editWord:true,orgId:this.orgId})
            };
            this.openImport = function(){
                this.openModal('glossary-import-modal',{orgId:this.orgId});
            };
            this.openModal = function(template,params,cb){
                params = params || {};
                return $modal.open({
                    templateUrl:'/public/views/directives/glossary/'+ template +'.html?v='+window.currentJsVersion,
                    controller:['$scope','params',function($scope,params){
                        $scope.params = params;
                    }],
                    resolve:{
                        params:function(){
                            return params;
                        }
                    }
                }).result.then(function(){
                    self.callbacks.changePage && self.callbacks.changePage();
                    cb && cb();
                })
            }
            this.confirmDeleteDefinition = function(def){
                Alerts.warning({
                    title:'Delete definition',
                    content:'Are you sure you want to delete this definition? This will affect all glossaries' +
                    ' using this word!',
                    textOk:'Ok'
                },deleteDefinition.bind(null,def));
            }
            function deleteDefinition(def){
                GlossaryWords.deleteDefinition({
                    id:def.id
                }).$promise.then(function(){
                    self.callbacks.changePage && self.callbacks.changePage();
                });
            }
        }

        return {
            start:function(callbacks,orgId){
                return new Instance(callbacks,orgId)
            }
        }
    }])

}());
