'use strict';
(function(angular){

    angular.module('ngFabric').controller('FabricNewPost',['$scope','templateId','FabricTemplatesApi',function($scope,templateId,api){
        $scope.saveFile = null;
        $scope.templateId = templateId;
        $scope.submit = $scope.$close
        $scope.ready = false;
        api.getProperties({id:$scope.templateId}).$promise.then(function(properties){
            if(properties && properties.studentCanEdit){
                $scope.allowEditor=true;
            }
            $scope.ready = true;
        });

    }]).directive('fabricNewPost',['Alerts',function(Alerts){
        return {
            restrict:'A',
            link:function(scope,el){
                var originalContent = JSON.stringify(getTextareaContent());
                scope.ok = function(){
                    if(scope.allowEditor){
                        scope.$root.saveFile(function(res){
                            scope.submit({templateContent:getTextareaContent(),id:res.info.id});
                        })
                    }else{
                        scope.submit({templateContent:getTextareaContent()});
                    }
                }
                function getTextareaContent(){
                    var templateContent = {}
                    _.each(el.find('textarea'),function(textarea){
                        templateContent[textarea.id] = textarea.value;
                    })
                    return templateContent;
                }

                scope.cancel = function(){
                    if(originalContent !==  JSON.stringify(getTextareaContent())){
                        Alerts.warning({
                            title:'Unsaved changes',
                            content:'You have unsaved changes. Are you sure you want to close this window?',
                            textOk:'Ok',
                            textCancel:'Cancel'
                        },function(){
                            scope.$dismiss();
                        });
                    }else
                    scope.$dismiss();
                }
            }
        }
    }])
}(angular))
