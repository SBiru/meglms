

appControllers.controller('GraderQuizController', ['$filter','$rootScope', '$scope','$modal','$timeout', '$sce', '$upload', 'GraderQuiz','isArchive','Alerts', 'mathJaxConvert' ,'CurrentCourseId','GraderData',
    function($filter,$rootScope, $scope,$modal, $timeout, $sce, $upload, GraderQuiz,isArchive,Alerts,mathJaxConvert,CurrentCourseId,GraderData) {

        /*
            Moving some stuff to inside <quiz-response> directive
            We are using that directive both on grader and notification modal
         */
        $scope.showWithdrawnStudents = false;
        $scope.pageInfo = null;
        $scope.isArchive = isArchive;
        $scope.needingFeedback = !isArchive;
        $scope.summary = false;
        var groupId;
        if(CurrentCourseId.data && CurrentCourseId.data.id.indexOf("-")>=0){
            groupId = CurrentCourseId.data.id.split('-')[1];
        }
        getGraterQuiz();
        function getGraterQuiz(){
            GraderQuiz.query({
                groupId:groupId,
                pageId:$rootScope.$stateParams.contentId,
                is_archive:isArchive,
                showWithdrawnStudents:$scope.showWithdrawnStudents
            },function(response){
                $scope.pageInfo = response.pageInfo;
                $scope.quizzes=response.quizzes;
                getStudents()
                filterQuizzes()
            });
        }
        function getStudents(){
            $scope.students = {}
            for(var i =0;i<$scope.quizzes.length;i++){
                var student = $scope.quizzes[i].user;
                addStudentIfNotExists(student);
            }
            studentsObjectToArray();
            prependAllStudentsOption();

        }
        function addStudentIfNotExists(student){
            if(!$scope.students[student.user_id])
                $scope.students[student.user_id]=student;
        }
        function studentsObjectToArray(){
            $scope.students = $filter('orderBy')(_.map($scope.students,function(s){
                s.name= s.lname + ', ' + s.fname;
                return s
            }),'lname');
        }

        function prependAllStudentsOption(){
            $scope.students.unshift({
                'user_id':'all',
                name:"All students"
            });
        }
        if($scope.$root.user.graderMenuPreference=='top'){
            $scope.filter = GraderData;
            $scope.pagination = GraderData.pagination;
        }else{
            $scope.filter = {
                currentSelectedStudentId:'all',
                dateRange:{
                    max:null,
                    min:null
                }
            }
        }

        $scope.changeWithDrawn = function(){
            $scope.showWithdrawnStudents = !$scope.showWithdrawnStudents;
            getGraterQuiz();
        }

        $scope.toggleSummaryView =function(){
            $scope.summary=!$scope.summary;
        }
        // $scope.$watch('showWithdrawnStudents',filterQuizzes);
        $scope.$watch('filter.currentSelectedStudentId',filterQuizzes);
        $scope.$watch('filter.dateRange.min',filterQuizzes);
        $scope.$watch('filter.dateRange.max',filterQuizzes);
        function filterQuizzes(){
            var filteredQuizzes = angular.copy(quizzesFilteredByStudent());
            $scope.filteredQuizzes = filterQuizzesBetweenDateRange(filteredQuizzes);
        }
        function quizzesFilteredByStudent(){
            if($scope.filter.currentSelectedStudentId=='all' || $scope.filter.currentSelectedStudentId==null){
                return $scope.quizzes;
            }
            return _.filter($scope.quizzes,function(quiz){
                return quiz.user.user_id ==$scope.filter.currentSelectedStudentId;
            })
        }
        function filterQuizzesBetweenDateRange(quizzes){
            if($scope.filter.dateRange.min==null && $scope.filter.dateRange.max==null)
                return quizzes;
            return _.filter(_.map(quizzes,function(quiz){
                quiz.attempts = getAttemptsBetweenDateRate(quiz.attempts);
                return quiz;
            }),function(quiz){
                return quiz.attempts.length;
            })
        }
        function getAttemptsBetweenDateRate(attempts){
            var minDate = $scope.filter.dateRange.min;
            var maxDate = $scope.filter.dateRange.max;
            var minDateString = moment(minDate).format("YYYY-MM-DD");
            var maxDateString = moment(maxDate).format("YYYY-MM-DD");
            return _.filter(attempts,function(attempt){
                var attemptDateString =  moment(attempt.submitted).format("YYYY-MM-DD");
                var shouldRemove = !_.isNull(minDate) && attemptDateString<minDateString;
                shouldRemove = shouldRemove || (!_.isNull(minDate) && attemptDateString>maxDateString);
                return !shouldRemove;
            })
        }

        $scope.openPreview = function(){
            $modal.open({
                templateUrl: '/public/views/gradebook/modals/title.html',
                controller: 'GradebookModalTitleController',
                size: 'lg',
                resolve: {
                    params: function () {
                        return {page:$scope.pageInfo,subtype:'page',hideExempt:true};
                    }
                }
            });

        }


    }
]).controller('QuizGraderDatepickerController',['$scope',function($scope){
    $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };
    $scope.format = 'dd/MM/yy';
}]);