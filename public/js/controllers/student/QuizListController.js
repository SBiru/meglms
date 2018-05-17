appControllers.controller('QuizListController', ['$rootScope', '$scope','QuizData','QuizList','EditPage',
    function($rootScope,$scope,QuizData,QuizList,EditPage){
        QuizList.already_taken({page_id:$rootScope.$stateParams.quizId},function(response){
            if(response.alreadyTaken){
                QuizData.setId(response.alreadyTaken);
                $scope.ready=true;
            }
            else{
                EditPage.get({pageId: $rootScope.$stateParams.quizId},function(page){
                    QuizList.list({search:page.searchquiz},function(response){
                        var randomIndex = Math.floor(Math.random() * (response.quizzes.length));
                        var quiz = response.quizzes[randomIndex] ;
                        QuizData.setId(quiz.id);
                        $scope.ready=true;
                    });
                });
            }
        });



    }
]);
