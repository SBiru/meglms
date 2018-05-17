(function(){
    "use strict";
    angular.module('app').directive('glossaryAuthorFilter',['GlossaryWords',
        function(GlossaryWords){
            return {
                restrict:'E',
                require: 'ngModel',
                templateUrl:'/public/views/directives/glossary/glossary-author-filter.html?v='+window.currentJsVersion,
                scope:{
                    orgId:'=?'
                },
                link:function(scope,el,attr,ngModel){
                    loadAuthors();

                    function loadAuthors(){
                        scope.loading = true;
                        if(GlossaryWords.loadingAuthors === undefined){
                            GlossaryWords.loadingAuthors = GlossaryWords.authors({orgId:scope.orgId})
                        }
                        GlossaryWords.loadingAuthors.$promise.then(function(authors){
                            scope.loading = false;
                            scope.authors = authors;
                        },function(){
                            scope.loading = false;
                            toastr.error('Something went wrong :(');
                        })
                    }

                    scope.setAuthor = function(authorId){
                        ngModel.$setViewValue(authorId)
                    };
                    var unWatch = scope.$watch('ngModel',function(){
                        if(_.isNaN(parseInt(scope.ngModel))){
                            scope.setAuthor(null);
                        }
                    });
                    scope.$on('$destroy',function(){
                        unWatch();
                    })
                }
            }
        }])

}());
