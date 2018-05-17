(function($){
    "use strict";
    var template = '<div class="definition-list">' +
        '<div ng-repeat="def in word.definitions track by $index">'+
        '<div class="definition-wrapper">'+
        '<div class="number">'+
        '{{$index+1}}.'+
    '</div>'+
    '<div class="definition">'+
        '<div glossary-word-tags word="def" read-only="true"'+
    'class="glossary-tags" ng-show="true"></div>'+
        '<div ng-bind-html="trustAsHtml(def.definition)"></div>'+
        '</div>'+
        '<div class="clearfix"></div>'+
        '</div>'+
        '<div class="clearfix"></div>'+
        '</div>' +
        '</div>';
    angular.module('app').directive('glossaryWord',['GlossaryWords','$compile',function(GlossaryWords,$compile){
        return {
            restrict:'A',
            link:function(scope,el,attrs){
                var popover;
                $(el).on('click',handleEvent);
                function handleEvent(){
                    if(!popover)
                        createPopover();
                };

                function createPopover(){
                    popover = $(el).popover({
                        trigger: 'click',
                        html: true,
                        content: '<div><span class="fa fa-spinner fa-pulse"></span></div>',
                        placement: 'bottom',
                        container: 'body'
                    }).popover('show');
                    GlossaryWords.get({
                        id:attrs['glossaryWord']
                    }).$promise.then(function(word){
                        scope.word = word;
                        var compiled = $compile(template)(scope);
                        setTimeout(function(){
                            popover.data('bs.popover').options.content = compiled[0].outerHTML;
                            popover.popover('show');
                        },100)
                    });

                }
                scope.$on("$destroy",function(){
                    popover.popover('hide');
                    popover && popover.popover('dispose');
                    $(el).off('click', handleEvent);
                });
                if(!window.popoverClickSet){
                    $(document).on('click', function (e) {
                        $('[data-toggle="popover"],[data-original-title]').each(function () {
                            //the 'is' for buttons that trigger popups
                            //the 'has' for icons within a button that triggers a popup
                            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                                (($(this).popover('hide').data('bs.popover')||{}).inState||{}).click = false
                            }

                        });
                    });
                    window.popoverClickSet = true;
                }


            }
        }
    }])

}(jQuery));
