'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app
.service('BeforeLeavePage',
[
    '$modal',
    '$resource',
    function($modal,$resource){
        var factory={
            resource:$resource('/api/questions/:id/page-question',{id:"@id"}),
            question:null,
            setQuestion:function(question){
                this.question=question;
            },
            getQuestion:function(question){
                return this.question;
            },
            startLoadingModal:function(){
                this.loading = $modal.open({
                    template:'<div class="panel-body"><span>Sending response... <span class="fa fa-spinner fa-pulse"></span></span></div>',
                    backdrop: 'static',
                    keyboard: false
                })
            },
            saveResponse:function(pageId,userId){
                if(this.question.id)
                    return this.resource.save({
                        id:this.question.id,
                        userId:userId,
                        pageId:pageId,
                        question:this.question
                    }).$promise;
            }

        };
        factory.openModal=function(pageId,userId){
            if(factory.getQuestion()){
                this.modalInstance = $modal.open({
                    template:'<div class="modal-body"><e3-question-student options="{hideQuestionNumber:true}" ng-model="teste" question="question"></e3-question-student>' +
                    '</div><div class="modal-footer"><div class="submit pull-right"><div class="btn btn-default btn-sm" ng-click="cancel()">Close</div><div class="btn btn-primary btn-sm" ng-click="close()">Respond</div></div></div>',
                    controller:function($scope,question,$modalInstance){
                        $scope.question=question;
                        $scope.close = function(){
                            $modalInstance.close(question)
                        }
                        $scope.cancel = function(){
                            $modalInstance.dismiss('cancel')
                        }
                    },
                    resolve:{
                        question:function(){
                            return factory.getQuestion();
                        }
                    },
                    windowClass:'before-leave-question',

                }).result.then(function(question){
                    //send question
                    factory.question=question;
                    console.log(question);
                    factory.startLoadingModal();
                    factory.saveResponse(pageId,userId).then(
                        function(ok){
                            factory.loading.dismiss('cancel')
                            factory.question=null;
                        },function(error){
                            factory.loading.dismiss('cancel')
                            factory.question=null;
                        }
                    )
                });

            }

        }

        return factory;
    }
]);