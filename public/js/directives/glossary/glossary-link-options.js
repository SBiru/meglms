(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }

    app.directive('glossaryLinkOptions', ['Glossary',function(Glossary){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-link-options.html?v='+window.currentJsVersion,
            scope:{
                'linkOptions':'=?',
                'pageId':'=?'
            },
            link:function(scope){
                scope.columns = [];

                prepareColumns();

                function prepareColumns(){
                    var itemsPerColumn = Math.ceil(scope.linkOptions.length/3);
                    for (var i=0; i<scope.linkOptions.length; i += itemsPerColumn) {
                        var col = {start:i, end: Math.min(i + itemsPerColumn, scope.linkOptions.length) };
                        scope.columns.push(col);
                    }
                }
                function getBitwiseLinkOptions(){
                    return _.reduce(scope.linkOptions,function(count,option){
                        if(option.checked){
                            return count + option.bitval;
                        }
                        return count;
                    },0)
                }
                scope.saveLinkOptions = function(){
                    Glossary.saveLinkOptions({
                        id:scope.pageId,
                        bitval:getBitwiseLinkOptions()
                    })
                }
                scope.selectAll = toggleAll.bind(null,true);
                scope.clear = toggleAll.bind(null,false);
                function toggleAll(checked){
                    _.each(scope.linkOptions,function(option){
                        option.checked = checked;
                    })
                    scope.saveLinkOptions();
                }

            }
        }
    }
    ])
}());