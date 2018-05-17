appControllers.controller('GraderJournalController', [
    '$rootScope',
    '$scope',
    '$modal',
    '$timeout',
    '$sce',
    '$q',
    '$upload',
    'Journal',
    'isArchive',
    'Alerts',
    'GraderPost',
    '$filter',
    function($rootScope, $scope,$modal, $timeout, $sce, $q,$upload, Journal,isArchive,Alerts,GraderPost,$filter) {
        $scope.filterPosts = filterPosts;

        $scope.trustAsHtml = trustAsHtml;
        $scope.openAll = openAll;
        $scope.saveAll = saveAll;
        $scope.canSave = canSave;
        $scope.needingGrade = needingGrade;
        $scope.rubricData={
            selectedScore:{}
        }

        $scope.isArchive = isArchive;

        var pageId = $scope.$state.params.contentId;
        getJournal();
        var originalStudents = {};
        function getJournal(){
            Journal.get({
                id:pageId
            },function(response){
                originalStudents = angular.copy(response.students);
                $scope.data = response;
            })
        }
        function trustAsHtml(html){
            if(html){
                return $sce.trustAsHtml(html);
            }
        }

        function filterPosts(showOnlyNeedingGrade){
            return function( post ) {
                if(!showOnlyNeedingGrade) return true;
                return post.feedback===undefined || post.feedback.id === undefined;
            };
        }
        function openAll(student){
            for(var i = 0;i<student.journal.posts.length;i++)
                student.journal.posts[i].grading =student.openAll;
        }
        function grade(post){
            var gradePost = {
                post_id: post.id,
                grade: post.feedback.grade,
                feedback: post.feedback.message,
            }
            if(post.feedback.id){
                gradePost.archive =post.feedback.id;
            }
            return GraderPost.grade(gradePost).$promise;
        }
        function canSave(student){
            if(student.journal.gradeForWholeJournal){
                var post = student.journal.gradeForWholeJournal;
                var originalPost = originalStudents[student.id].journal.gradeForWholeJournal;
                if((post.feedback.message!= originalPost.feedback.message ||
                    post.feedback.grade!= originalPost.feedback.grade) &&
                    post.feedback.grade &&
                    !isNaN(parseFloat(post.feedback.grade))
                ){
                    return true;
                }
            }
            else{
                for(var i = 0;i<student.journal.posts.length;i++){
                    var post = student.journal.posts[i];
                    var originalPost = originalStudents[student.id].journal.posts[i];
                    if(!angular.equals(post,originalPost) &&
                        post.feedback.grade &&
                        !isNaN(parseFloat(post.feedback.grade))
                    ){
                        return true;
                    }
                }
            }
            return false;
        }
        function saveAll(student){
            var query = {};
            if(student.journal.gradeForWholeJournal){
                var post = student.journal.gradeForWholeJournal;
                var originalPost = originalStudents[student.id].journal.gradeForWholeJournal;
                if((post.feedback.message!= originalPost.feedback.message ||
                    post.feedback.grade!= originalPost.feedback.grade) &&
                    post.feedback.grade){
                    query[post.id]=grade(post);
                    $scope.$broadcast('gradeRubric', {
                        postid: post.id,
                        teacherid: $scope.$root.user.id
                    });
                }

            }
            else{
                for(var i = 0;i<student.journal.posts.length;i++){
                    var post = student.journal.posts[i];
                    var originalPost = originalStudents[student.id].journal.posts[i];
                    if(!angular.equals(post,originalPost) && post.feedback.grade){
                        query[post.id]=grade(post);
                        $scope.$broadcast('gradeRubric', {
                            postid: post.id,
                            teacherid: $scope.$root.user.id
                        });
                    }

                }
            }
            if(!angular.equals(query,{})){
                $scope.isSaving = 1;
                $q.all(query).then(function(response){
                    $scope.isSaving = 0;
                    getJournal();
                    $rootScope.$broadcast('NavUpdateMenuStatic', true);
                },function(error){
                    $scope.isSaving = 2;
                });
            }

        }
        function needingGrade(post,gradeForWholeJournal){
            return (!post.feedback.id && !gradeForWholeJournal) ||
                (gradeForWholeJournal && post.needingGrade)
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

])
