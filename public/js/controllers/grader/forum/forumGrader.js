app.service('ForumGrader',['$resource',function($resource){
    return $resource('/api/grader/forum/:pageId',{},{
        all:{
            url:'/api/grader/forum/all/:courseId'
        }
    });
}]);
app.service('ForumGraderTopic',['$resource',function($resource){
    return $resource('/api/grader/forum/topic/:topicId/:userId');
}]);
app.service('ForumGraderPost',['$resource',function($resource){
    return $resource('/api/grader/forum/post/:postId/:userId',{postId:'@postId',forumId:'@forumId',userId:'@userId'},{
        saveForumGrade:{
            method:'POST',
            url:'/api/grader/forum/:forumId/:userId'
        }
    });
}]);
app.controller('ForumGraderController',['$scope','$state','isArchive','ForumGrader',
    function($scope,$state,isArchive,ForumGrader){
    var vc = this;

    function init(){
        loadPosts();
    }
    function loadPosts() {
        ForumGrader.get({archive:isArchive,pageId:$state.params.contentId}).$promise.then(updatePageData);
    }
    function updatePageData(data){
        vc.data = data;
        vc.data.isArchive = isArchive
    }
    var unWatch = $scope.$root.$on('reloadForumGrader',function(){
        loadPosts();
    });
    $scope.$on('$destroy',function(){
        unWatch();
    })
    init();
}
])

var ForumStudentBoxBase = function(templateUrl){
    return ['$modal','ForumGraderTopic','ForumGraderPost','CurrentCourseId',function($modal,ForumGraderTopic,ForumGraderPost,CurrentCourseId){
        return {
            restrict:'E',
            templateUrl:templateUrl + '?v='+window.currentJsVersion,
            scope:{
                student:'=',
                pageInfo:'=',
                isArchive:'=',
                studentView:'=',
                dismiss:'=?'
            },
            link: function(scope){
                var originalPosts;
                scope.data = {
                    student:scope.student,
                    pageInfo:scope.pageInfo,
                    forum : {}
                };
                if(scope.data.pageInfo.gradeMode==='wholeForum')
                    scope.data.feedback = scope.data.pageInfo.feedback || ''
                scope.loadStudentPosts = function(discussion){
                    scope.data.currentDiscussion = discussion;
                    scope.data.posts = {loading:true};

                    ForumGraderTopic.query({userId:scope.student.id,topicId:discussion.id,archive:scope.isArchive}).$promise.then(function(posts){
                        if(posts.length===0)
                            scope.$root.$broadcast('reloadForumGrader');
                        scope.data.posts = posts;
                        scope.onFilterChange();

                        originalPosts  = _.map(posts, _.clone);
                        scope.data.forum.current_index = 0;
                        updateCurrentPost();
                    });

                }
                scope.onFilterChange = function(){
                    if(!scope.data.searchTerm){
                        scope.data.filteredPosts = scope.data.posts
                        return;
                    }
                    var i = ".*" + scope.data.searchTerm.replace(/ /g, ".*") + ".*";
                    scope.data.filteredPosts = _.filter(scope.data.posts,function(p){
                        return p.message.match(new RegExp(i,'i'))
                    })
                }
                scope.addToIndex = function(offset){
                    var minValue = Math.max(0,scope.data.forum.current_index+offset);
                    scope.data.forum.current_index = Math.min(minValue,scope.data.posts.length-1);
                    if(scope.data.feedback && scope.data.pageInfo.gradeMode!=='wholeForum'){
                        scope.data.currentPost.feedback = scope.data.feedback;
                    }
                    updateCurrentPost();
                };
                scope.savePostGrade = function(){
                    for(var i = 0;i<originalPosts.length;i++){
                        if(!_.isEqual(originalPosts[i],scope.data.posts[i])){
                            if(i === scope.data.forum.current_index){
                                scope.data.posts[i].feedback = scope.data.feedback
                            }
                            doSavePost(scope.data.posts[i]);
                        }
                    }
                };
                function doSavePost(post){
                    post = post || scope.data.currentPost;
                    ForumGraderPost.save({
                        postId:post.id,
                        userId:scope.data.student.id,
                        grade:post.grade,
                        message:post.feedback
                    }).$promise.then(function(data){
                        scope.data.pageInfo.avgScore = data.avg;
                        scope.loadStudentPosts(scope.data.currentDiscussion);
                        scope.$root.$broadcast('NavUpdateMenuStatic', true);
                    })
                }
                scope.saveForumGrade = function(){
                    ForumGraderPost.saveForumGrade({
                        forumId:scope.data.pageInfo.forumId,
                        userId:scope.data.student.id,
                        grade:scope.data.pageInfo.avgScore,
                        message:scope.data.feedback
                    }).$promise.then(function(data){
                        // scope.data.pageInfo.avgScore = data.avg;
                        scope.data.forceAvg = false;
                        scope.loadStudentPosts(scope.data.currentDiscussion);
                        scope.$root.$broadcast('NavUpdateMenuStatic', true);
                    })

                };
                scope.openRubric = function(){
                    $modal.open({
                        templateUrl:'forum-grade-modal',
                        controller:'ForumRubricGraderModalController',
                        windowClass:'forum-grade-modal',
                        resolve:{
                            data:function(){
                                return scope.data
                            }
                        }
                    }).result.then(function(grade){
                        scope.data.currentPost.grade = grade;
                        scope.savePostGrade();
                    })
                }
                scope.pagConfig = {
                    itemsPerPage: 10,
                    showOnTop:false,
                    showOnBottom:true,
                    showNav:true
                }
                function updateCurrentPost(){
                    scope.data.currentPost = scope.data.posts[scope.data.forum.current_index];
                    if(scope.data.pageInfo.gradeMode!=='wholeForum'){
                        scope.data.feedback = scope.data.currentPost.feedback
                    }
                }

                scope.ckeditorOptions = {
                    toolbar: 'simple',
                    disableNativeSpellChecker: false
                };
            }
        }
    }]
}
app.directive('forumGraderStudentBox',ForumStudentBoxBase('/public/views/partials/grader/forum/studentBox.html'));
app.directive('forumStudentBox',ForumStudentBoxBase('/public/views/partials/student/forum/forum-student-box.html'));

app.controller('ForumRubricGraderModalController',['$scope','data',function($scope,data){
    $scope.rubricData = {
        selectedScore: {},
    };
    $scope.data = data;
    //adapting to match to RubricGraderController
    $scope.message = {
        rubricid : data.pageInfo.rubricId,
        id:data.currentPost.id,
        user_id:data.currentPost.userid,
        grade:data.currentPost.grade,
        update_id:data.currentPost.id,
        rubricType:'forum'
    }
    $scope.save = function(){
        $scope.$broadcast('gradeRubric', {
            postid: $scope.message.id,
            teacherid: $scope.$root.user.id,
            type:'forum'
        });
        $scope.$close($scope.message.grade);
    }
}]);