'use strict';
(function(angular){
angular.module('app').directive('htmlTemplateResponse',[
'HtmlTemplates','UserV2','$http','$modal',
function(HtmlTemplates,UserV2,$http,$modal){
    return{
        restrict:'E',
        templateUrl:'/public/views/directives/html-template-response.html',
        scope:{
            'userId':'=?',
            'postId':'=?',
            'response':'=?',
            'user':'=?',
            'opened':'=?',
            'pageName':'=?'
        },
        link:function(scope,el){
            if(!scope.userId)
                throw "Incorrect user id";
            if(!scope.postId)
                throw "Incorrect post id";
            function getUser(){
                UserV2.getUser(scope.userId).then(function(user){
                    user.name = user.lastName + ', ' + user.firstName;
                    scope.user = user;
                    init()
                })
            }
            function getResponse(){
                if(scope.loadingResponse) return;
                scope.response = null;
                scope.loadingResponse = true;
                HtmlTemplates.userResponse({id:scope.postId,userId:scope.userId}).$promise.then(function(response){
                    scope.response = response
                    scope.templateId = scope.response.template
                    scope.loadingResponse = false;
                    init();
                },function(e){scope.loadingResponse = false});

            }
            function init(selector){
                if(!scope.response || !scope.user || !scope.canvasLoaded) return;

                prepareResponses(selector)

            }
            function prepareResponses(selector){
                var el1 = el;
                if(selector)
                    el1 = $(selector);

                _.each(scope.response.templateContent,function(text,id){
                    var textarea = el1.find('#'+id);
                    if(textarea.length){
                        textarea.val(text);
                        textarea.attr('disabled',true)
                    }
                })
            }
            scope.loaded = function(selector,cb){
                scope.canvasLoaded = true;
                init(selector)
                cb && cb()
            };
            if(!scope.user) getUser();
            if(!scope.response) getResponse();
            scope.openModal = function(){
                $modal.open({
                    templateUrl:'template-response-modal.html',
                    windowClass:'template-response-modal',
                    size:'lg',
                    controller:['$scope',function($scope){
                        $scope.templateId = scope.templateId
                        $scope.loaded = scope.loaded.bind(null,'.template-response-modal',cb);
                        $scope.pageName = scope.pageName;
                        function cb(){
                            setTimeout(function(){
                                $('#canvas_'+scope.templateId + ' .canvas-container').height($('#canvas_'+scope.templateId + ' .canvas-container').height()+2)
                                $('.template-response-modal .modal-dialog').width($('#canvas_'+scope.templateId + ' .canvas-container').width() + 70)
                            })

                        }
                    }]
                })
            }
            scope.$watch('postId',getResponse);
            if(el.closest('.feedback-modal')){
                var dialog = el.closest('.feedback-modal').find('.modal-dialog');
                dialog.css({height:'90vh','max-height':'90vh !important','width':'90%'});
                dialog.find('.student-submission-td > div').css('width','100%');
            }

        }
    }
}
])
}(angular))