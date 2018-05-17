(function () {
    var app;
    try {
        app = angular.module('app.testbank');
        console.log(app);
    }
    catch (err) {
        app = angular.module('app');
        console.log(app);
    }
    var grapnum = 0;
    app.directive('editAutogradedInModal', [
        function () {
            return {
                restrict: 'E',
                scope: {
                    question: '=?'
                },
                templateUrl: '/public/views/directives/quiz-editor/questions/create_or_edit/autograded.html',
                link: function (scope) {
                    scope.question.extra = scope.question.extra || {max_chars:30,rows:2};
                    if(typeof scope.question.extra === 'string')
                        scope.question.extra = JSON.parse(scope.question.extra);
                }

            }
        }
    ]);
}());