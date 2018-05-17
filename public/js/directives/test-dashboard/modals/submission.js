'use strict';
(function(angular){
    var player;
    angular.module('app').controller('TestSubmissionController',
        ['$scope','$state','$sce','submission','studentName','ProficiencyTestService','$modalInstance',
            function($scope,$state,$sce,submission,studentName,service,$modalInstance){
        function init(){
            $scope.type = submission.type;
            $scope.pageName = submission.name;
            $scope.studentName = studentName;
            getSubmission();
        }
        function getSubmission(){

            service.getSubmission({
                studentId:$state.params.studentId,
                submissionId:submission.postId||submission.questionId,
                pageType:submission.layout,
                type:$scope.type
            }).$promise.then(function(response){
                $scope.prompt = $sce.trustAsHtml(response.prompt);
                if($scope.type=='video'){
                    $scope.videoUrl = $sce.trustAsResourceUrl(response.videofilename);
                    $scope.posterUrl = response.thumbnailfilename;
                    setTimeout(playerRender);
                }else{
                    $scope.message = $sce.trustAsHtml(response.message);
                }

            })
        }
        $scope.cancel = $modalInstance.dismiss;
        $scope.$on('$destroy',function(){
            player.dispose();
        });
        init();
    }])

    function playerRender(){
        setTimeout(function(){
            player = videojs('student-video',{
                flash: {
                    swf: '/public/lib/video-js.swf'
                }
            })
            resetPlayerSize();
            setBackgroundColor()
        },100);
        function setBackgroundColor(){
            angular.element('.modal-backdrop.fade.in').css('background-color','#E0E0E0');
        }
        function resetPlayerSize(){
            var width = Math.min(angular.element('.modal-content').width(),400)
            player.width(width);
            player.height(player.width()*2/3);
        }
        angular.element(window).resize(resetPlayerSize);
    }
}(angular))