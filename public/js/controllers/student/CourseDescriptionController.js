appControllers.controller('CourseDescriptionController', ['$rootScope', '$scope', '$sce','$q', 'Page',
    function($rootScope, $scope, $sce,$q, Page) {

        var pageId = $scope.$state.params.contentId;

        getPage();
        function getPage() {
            Page.courseDescription({id: pageId},
                function (response) {
                    $scope.pageData = response
                    $rootScope.backgroundUrl = $rootScope.backgroundUrl || {}
                    $rootScope.backgroundUrl[$rootScope.$stateParams.contentId]=response.backgroundUrl
                },
                function (error) {
                    $scope.error = error.error;
                }
            )
        }

    }
]);