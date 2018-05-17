
appControllers.controller('TimedReviewController', ['$rootScope', '$scope', 'EditPage', 'TimedReviewContent', 'History', 'Currentpageid', '$sce','$modal','Alerts',
    function ($rootScope, $scope, EditPage, TimedReviewContent, History, Currentpageid, $sce,$modal,Alerts) {
    	$scope.contentid = $rootScope.$stateParams.contentId;

    	$rootScope.$on('reloadPostedMessages', function (event, data) {
    		$scope.$broadcast('reloadPostedMessages', true);
    	});

    	//console.log($scope.contentid);
    	$scope.pageContent = {};
    	EditPage.get({
    		pageId: $scope.contentid,
			fetchTimedReview:true
    	}, function (page) {
			console.log('page', page);
    		$rootScope.pagename = page.pagename;
    		$scope.page_sub_title = page.subtitle;
			$scope.post_options = {new_post_color:page.meta.new_post_color || 'btn-primary btn-post'};

    		
    		$scope.timeReviewPrompts = page.time_review_data;
			$scope.hasDefaultTime = true;
			if(page.time_review_data){
				for(var i = 0;i<page.time_review_data.length;i++){
					if(page.time_review_data.time_limit!==null){
						$scope.hasDefaultTime=false;
						break;
					}
				}
			}
			$scope.hasOnlyVideo = !_.some($scope.timeReviewPrompts,function(p){
				return p.type=='text';
			});
    			//console.log($scope.timeReviewPrompts);
    		
    		$scope.pageData = page;

    		// timed review
			$scope.timed_id = page.timed_id;
    		$scope.timed_limit = page.timed_limit;
    		$scope.timed_pause = page.timed_pause;
    		$rootScope.page_title = page.timed_title;
    		//$scope.timed_title = page.timed_title;
    		$scope.timed_description = page.timed_description;

    	});
		$scope.startActivity = function(){
			var windowClass = 'timed-review-modal' + ($scope.hasOnlyVideo?'_only-video':'');
			var modalInstance = $modal.open({
				template:'<div timed-review prompts="prompts" page-data="pageData" modal-instance="modalInstance" timelimit="timed_limit"pauseduration="timed_pause"> Timing your Review {{reviewId}} </div>',
				controller:['$scope','data','$modalInstance',function($scope,data,$modalInstance){
					$scope.timed_limit = data.timed_limit;
					$scope.timed_pause = data.timed_pause;
					$scope.prompts = data.prompts;
					$scope.modalInstance = $modalInstance;
					$scope.pageData = data.pageData;
				}],
				resolve:{
					data:function(){
						return{
							timed_limit: $scope.timed_limit,
							timed_pause: $scope.timed_pause,
							prompts: $scope.timeReviewPrompts,
							pageData:$scope.pageData
						}
					}
				},
                backdrop: 'static',
				windowClass:windowClass
			}).result.then(function(result){
					if(result=='notWorking'){
						showCameraNotWorkingWarning()
					}
				})
		}
		function showCameraNotWorkingWarning(){
			Alerts.danger({
				title:'Webcam not available',
				contentHtml:"<p>Please check that you have a webcam connected and that it is working properly. Make sure that Adobe Flash is installed and enabled in your web browser.</p><p>If you continue to experience technical problems, please send an email to support@english3.com</p>",
				textOk:'Ok'
			},function(){});
		}

    	var contentArray = TimedReviewContent.get({
    		contentId: $rootScope.$stateParams.contentId
    	}, function (content) {
    		//console.log(content.contenthtml);
    		Currentpageid.RecordingPageAccess($scope.contentid);


    		var isEnglishSelected = document.getElementById('english-language-selector').checked;
    		$scope.contenthtml = $sce.trustAsHtml(content.contenthtml);
    		$scope.pagename = content.pagename;
    		$rootScope.pagename = (isEnglishSelected) ? content.pagename : content.subtitle;
    		$scope.is_mobile = ON_MOBILE;
    		$scope.allow_video_post = content.allow_video_post;
    		$scope.allow_text_post = content.allow_text_post;
    		$scope.allow_upload_post = content.allow_upload_post;
    		$scope.allow_template_post = content.allow_template_post;    		
    		$scope.page_is_private = content.page_is_private;
    		$scope.page_is_gradeable = content.page_is_gradeable;
			$scope.newPostText = content.new_post_text || 'Start activity';
			$scope.limited_post_page = content.meta.limited_post_page;
			$scope.post_limit = content.meta.post_limit;
			$scope.number_of_posts = content.number_of_posts;
			$scope.disablevalue=false;
			if($scope.limited_post_page==1)
			{
				if($scope.number_of_posts<$scope.post_limit)
				{
					$scope.disablevalue = false;
				}
				else
				{
					$scope.disablevalue = true;


				}

			}


		});

    }
]);
