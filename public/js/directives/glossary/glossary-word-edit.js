(function(){
    "use strict";
    angular.module('app').directive('glossaryWordEdit',['GlossaryWords',function(GlossaryWords){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-word-edit.html?v='+window.currentJsVersion,
            scope:{
                word:'=?',
                close:'=?',
                orgId:'=?',
                editDefinition:'=?',
                newDefinition:'=?',
                editWord:'=?'
            },
            link:function(scope){
                scope.word= scope.word || {org_id:scope.orgId,tags:[]};

                scope.save = function(){
                    if(scope.editWord && !scope.word.word)
                        return toastr.error("Concept is required");
                    if(scope.editDefinition &&  !scope.word.definition)
                        return toastr.error("Definition is required");


                    scope.saving = true;
                    var saveFn = getSaveFn();

                    scope.word.orgId = scope.word.org_id;
                    scope.word.word = scope.word.word || '-';
                    scope.word.definition = scope.word.definition || '-';
                    saveFn(scope.word).$promise.then(function(word){
                        scope.saving = false;
                        scope.word.id = word.id;
                        scope.close && scope.close();
                    },function(e){
                        handleError(e);
                        scope.saving = false;

                    });
                }
                function getSaveFn(){
                    if(scope.editWord || (scope.word.word && scope.newDefinition)){
                        return GlossaryWords.save;
                    }
                    return GlossaryWords.updateDefinition

                }
                function handleError(e){
                    var headers = e.headers();
                    if(headers.type){
                        if(headers.type==='duplicated_key'){
                            toastr.error("Concept already exists");
                        }
                    }else{
                        toastr.error("Something went wrong :(")
                    }
                }
            }
        }
    }])

}());
