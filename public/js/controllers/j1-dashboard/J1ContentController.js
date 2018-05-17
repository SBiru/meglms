angular.module('app')
    .controller('J1ContentController',['$scope','$filter','$modal','ProficiencyTestService',function($scope,$filter,$modal,ProficiencyTestService){
        var vc_content = this;
        this.loading=true;
        var studentId= $scope.$state.params.studentId,
            classId =  $scope.$state.params.classId;
        ProficiencyTestService.get({studentId:studentId,classId:classId},init);
        function init(testDetails){
            vc_content.loading = false;
            testDetails.pageGroups = $filter('orderBy')(testDetails.pageGroups,function(p){return p.submissions.length},true);
            vc_content.testDetails = testDetails;
            vc_content.idTooltip = testDetails.idImage?'<img src="' + testDetails.idImage + '">':'';
            vc_content.idHref = testDetails.idImage || '#'
            if(testDetails.submittedOn){
                testDetails.submittedOn  = moment(vc_content.testDetails.submittedOn).format('MMM DD, YYYY')
            }
            if(vc_content.hasAdditionalComments()){
                testDetails.comments = testDetails.additionalComments[Object.keys(testDetails.additionalComments)[0]].comments
            }
            if(testDetails.pageGroups.length && testDetails.pageGroups[0].submissions.length){
                vc_content.video_url = testDetails.pageGroups[0].submissions[0].video_url
                vc_content.video_thumbnail_url = testDetails.pageGroups[0].submissions[0].video_thumbnail_url
            }

            setTimeout(function () {
                angular.forEach(angular.element('video'), function (video) {
                    var setupStr = $(video).attr('data-setup') || '{}'
                    var setup;
                    try{
                        setup = JSON.parse(setupStr);
                    }catch(e){
                        setup = {}
                    }
                    if(window.innerWidth < 400){
                        setup.fluid = true;
                    }
                    videojs(video, _.extend({
                        flash: {
                            swf: '/public/lib/video-js.swf'
                        },
                        preload: "none"
                    },setup));
                });
                function adjustTitles() {
                    if($('.section.body').width() < 610){
                        $('.display-titles').css('display','none');
                    }else $('.display-titles').css('display','');
                }
                $( window ).resize(adjustTitles);
                adjustTitles()
            }, 100)

        }

        this.hasAdditionalComments = function(){
            return this.testDetails && Array.isArray(this.testDetails.additionalComments) == false;
        }
        this.shareResults = function(){
            $modal.open({
                templateUrl:"/public/views/directives/test-dashboard/modals/share-results.html?v="+window.currentJsVersion,
                controller:'ShareResultsController',
                windowClass:'modal-flat test-report',
                resolve:{
                    params:function(){return {testDetails:vc_content.testDetails}}
                }
            })
        }
        if($scope.$state.includes('home.with_tabs')){
            setTimeout(function() {
                $('.content').css('top', '102px');
                $('.content').css('height', 'calc(100% - 102px)');
            })
        }
        window.scope = $scope;
    }]);