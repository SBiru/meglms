appControllers.controller('NoMenuController', [ '$scope','GraderPost','Nav','noMenuFooterOptions',
    function($scope,GraderPost,Nav,noMenuFooterOptions){
        $scope.nextPage = nextPage;
        $scope.currentNav = currentNav;
        $scope.require_submission = require_submission;
        $scope.isCompleted = isCompleted;
        $scope.showNextButton = showNextButton;

        $scope.contentId = contentId();
        function contentId(){
            return $scope.$stateParams.contentId || $scope.$stateParams.vocabId || $scope.$stateParams.quizId;
        }


        function nextPage(){
            var status = $scope.isCompleted();
            if(!status){
                if(!confirm("This page is not completed. Do you want to continue?"))
                    return;
            }
            if (status=='post' && !noMenuFooterOptions.postFunction){
                GraderPost.submit({
                    video_comment:'no_menu activity completed',
                    contentid:contentId(),
                    check_is_private: 1
                },function(res){
                    if(res.message=='successful'){
                        $scope.$root.$emit('NavRootUpdate');
                    }
                    else{
                        toastr.error(res.message);
                    }
                });
                return;
            }if(noMenuFooterOptions.postFunction){
                noMenuFooterOptions.postFunction();
                noMenuFooterOptions.postFunction = null;
                return ;

            }
            $scope.$root.$emit('NavRootUpdate');
        }
        function require_submission(){
            var page = $scope.currentNav();
            return page && (page.allow_video_post=='1' ||
                page.allow_text_post=='1' ||
                page.allow_upload_post=='1' ||
                page.layout === 'picture')
        }

        function isCompleted(){
            var currentState = $scope.$state.current.name;
            if(currentState.indexOf('quiz')>=0){
                return $scope.quizEnded||false;
            }
            else{
                if($scope.require_submission()){
                    return $scope.currentNav().isSubmitted || false;
                }
                else return 'post';
            }
        }

        function currentNav(){
            var pages = Nav.getPages();
            return _.findWhere(pages,{id: contentId()});
        }
        function showNextButton(){
            if(!angular.isDefined($scope.navService.classMeta)|| !angular.isDefined($scope.navService.classMeta.no_menu)) return false;
            var currentState = $scope.$state.current.name;
            if(currentState.indexOf('quiz')>=0){
                return false;
            }
            return $scope.navService.classMeta.no_menu.meta_value && (!require_submission() || (require_submission() && canProceed()));
        }
        function canProceed(){
            var page = $scope.currentNav();
            return (page.isSubmitted || page.isGraded)

        }

    }
]);