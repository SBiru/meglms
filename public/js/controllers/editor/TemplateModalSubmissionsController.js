appControllers.controller('TemplateModalSubmissionsController', ['$rootScope', '$scope','$modalInstance','template','rawHtml','$http','HtmlTemplates',
    function ($rootScope, $scope,$modalInstance,template,rawHtml,$http,HtmlTemplates) {
        $scope.rawHtml = rawHtml;
        $scope.selectedTemplate  = template
        
        $scope.cancel = function () {
            $modalInstance.close( $scope.selectedTemplate);
        };
        
        function loadTemplates(){
            HtmlTemplates.query({'orgId':10}).$promise.then(function(templates){
                $scope.options = _.sortBy(templates,'title');
                getHtmlTemplate(template);
            })
        }
        function getHtmlTemplate(template){
            $http.get(template.template_url).then(function(response) {
                $scope.rawHtml = response.data;
            });
        }
        $scope.selectTemplateOptionsChange = function()
        {
            getHtmlTemplate($scope.selectedTemplate);
        }
        loadTemplates();

    }
])