appControllers.controller('JournalController', ['$rootScope', '$scope', '$sce','$q', 'Journal', 'Post', 'CurrentCourseId',
    function($rootScope, $scope, $sce,$q, Journal, Post, CurrentCourseId) {
        $scope.checkPassword = checkPassword;
        $scope.trustAsHtml = trustAsHtml;
        $scope.canSaveChanges = canSaveChanges;
        $scope.saveChanges = saveChanges;
        $scope.showEditButton = showEditButton;
        $scope.showStartJournal = showStartJournal;
        $scope.submitJournal = submitJournal;
        $scope.data = {}
        $scope.ckeditorOptions={
            toolbar:'simple',
            disableNativeSpellChecker : false
        }

        var pageId = $scope.$state.params.contentId;
        var originalStudents = {};
        getJournal();

        function getJournal(){
            Journal.get({id:pageId},
                function(response){
                    if(response.hasPassword)
                        $scope.need_password = true;
                    $scope.data = response;
                    originalStudents = angular.copy(response.students);
                    $rootScope.pagename = response.page.name;
                },
                function(error){
                    $scope.error=error.error;
                }
            )
        }
        function canSaveChanges(student){
            var originalStudent = originalStudents[student.id];
            for(var i =0;i<student.journal.posts.length;i++){
                var post = student.journal.posts[i];
                var originalPost = originalStudent.journal.posts[i];
                if(originalPost.message!=post.message) return true;
            }
            return false;
        }
        function savePost(post){
            $scope.isSubmitting=1;
            return Post.submit(post).$promise;
        }
        function saveChanges(student){
            var originalStudent = originalStudents[student.id];
            var query = {}
            for(var i =0;i<student.journal.posts.length;i++) {

                var originalPost = originalStudent.journal.posts[i];
                var post = student.journal.posts[i];
                if(originalPost.message!=post.message){
                    originalPost.message = post.message;
                    var newpost = {
                        'contentid':pageId,
                        'check_is_private':$scope.data.page.isPrivate,
                        'video_comment':post.message.trim(),
                        'courseId' : CurrentCourseId.getCourseId(),
                        'reply_to_id':post.rootId
                    }
                    query[i]=savePost(newpost);
                }
            }
            if(!angular.equals(query,{})){
                $q.all(query).then(function(ok){
                    for(var i =0;i<student.journal.posts.length;i++) {
                        student.journal.posts[i].editing=false;
                    }
                    $scope.isSubmitting = 0;
                    $scope.$root.$emit('NavRootUpdate');
                    getJournal();
                })
            }
        }
        function showStartJournal(){
            var me = $scope.$root.user;
            return !angular.equals($scope.data,{}) && Object.keys($scope.data.students).indexOf(me.id)<0;
        }
        function showEditButton(student){
            var me = $scope.$root.user;
            return me.id==student.id
        }
        function trustAsHtml(html){
            if(html){
                return $sce.trustAsHtml(html);
            }
        }
        function checkPassword() {
            if ($scope.need_password) {
                Page.get({
                    id: $scope.contentid,
                    password: $scope.user_password
                }, function (res) {
                    if (!res.error) {
                        $scope.need_password = false;
                    }
                })
            }
        }
        function submitJournal(){
            if(!$scope.data.newJournalMessage) return;
            var post = {
                'contentid':pageId,
                'check_is_private':$scope.data.page.isPrivate,
                'video_comment':$scope.data.newJournalMessage.trim(),
                'courseId' : CurrentCourseId.getCourseId()
            }
            savePost(post).then(function(post){
                $scope.data.newJournal = false;
                $scope.isSubmitting = 0;
                if (post.message == 'successful') {
                    $scope.$root.$emit('NavRootUpdate');
                    getJournal();
                } else {
                    toastr.error(post.message);
                }
            })

        }
    }
]);