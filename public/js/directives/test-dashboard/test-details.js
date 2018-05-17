'use strict';
(function(angular){
    var shareResultsTemplate;
    var ShareResultsTemplateJ1;
    var ShareResultsTemplateE3PT;
    var ShareResultsTemplateScoreTable;
    var ShareResultsComments;
    angular.module('app').directive('testDashboardDetails',['$state','$modal','$filter','ProficiencyTestService',function($state,$modal,$filter,ProficiencyTestService){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/test-dashboard/test-details.html?v='+window.currentJsVersion,
            link:function(scope,el,attrs){
                scope.loading=true;
                scope.hideBack = scope.$eval(attrs.hideBack)
                scope.goBack = function(){
                    $state.go($state.$current.parent.toString()+'.summary',{classId:$state.params.classId});
                }
                var studentId=scope.$eval(attrs.studentId) || $state.params.studentId,
                    classId = scope.$eval(attrs.classId) || $state.params.classId
                ProficiencyTestService.get({studentId:studentId,classId:classId},init);
                function init(testDetails){
                    scope.loading = false;
                    testDetails.pageGroups = $filter('orderBy')(testDetails.pageGroups,function(p){return p.submissions.length},true);
                    scope.testDetails = testDetails;
                    scope.idTooltip = testDetails.idImage?'<img src="' + testDetails.idImage + '">':'';
                    scope.idHref = testDetails.idImage || '#'
                    setScoreColumnWidth();
                    setTimeout(function(){jQuery(el.find('.grid')).isotope()});
                }

                function setScoreColumnWidth(){
                    var STATIC_COLUMNS_COUNT = 2,
                        DYNAMIC_COLUMNS_COUNT =scope.testDetails.pageGroups.length,
                        width =  (DYNAMIC_COLUMNS_COUNT*100/(DYNAMIC_COLUMNS_COUNT + STATIC_COLUMNS_COUNT))/DYNAMIC_COLUMNS_COUNT + '%'
                    scope.scoreColumnWidth = scope.testDetails && scope.testDetails.isJ1?null:width;
                }

                scope.openSubmission = function(submission){
                    $modal.open({
                        templateUrl:'/public/views/directives/test-dashboard/modals/submission.html',
                        controller:'TestSubmissionController',
                        windowClass:'modal-flat test-submission',
                        resolve:{
                            submission:function(){return submission},
                            studentName:function(){return scope.testDetails.name}
                        }
                    })
                }
                scope.hasAdditionalComments = function(){
                    return scope.testDetails && Array.isArray(scope.testDetails.additionalComments) == false;
                }
                scope.viewReport = function(){
                    $modal.open({
                        template:'<a class="btn btn-xs btn-info download" ng-href="/e3pt-report?userId={{studentId}}&classId={{testId}}" download >Download</a><span class="fa fa-close" ng-click="cancel()"></span><proficiency-test-report class="padding-10" cancel="cancel" student-id="studentId" test-id="testId"></proficiency-test-report>',
                        controller:['$modalInstance','$scope',function($modalInstance,$scope){
                            $scope.cancel = $modalInstance.dismiss;
                            $scope.testId = scope.testDetails.classId
                            $scope.studentId = scope.testDetails.id
                            $scope.download = function(){
                                html2canvas(jQuery('proficiency-test-report')[0], {
                                    onrendered: function(canvas) {
                                        var options = {
                                            data:{
                                                jsonData:JSON.stringify({
                                                    imageData:canvas.toDataURL()
                                                })
                                            },
                                            httpMethod:'POST'
                                        }
                                        jQuery.fileDownload('/api/test/export',options)
                                    }
                                });
                            }

                        }],
                        windowClass:'modal-flat test-report',
                    })
                }
                scope.shareResults = function(){
                    $modal.open({
                        templateUrl:"public/views/directives/test-dashboard/modals/share-results.html?v="+window.currentJsVersion,
                        controller:'ShareResultsController',
                        windowClass:'modal-flat test-report',
                        resolve:{
                            params:function(){return {testDetails:scope.testDetails}}
                        }
                    })
                }
            }
        }
    }]).service('ProficiencyTestService',['$resource',function($resource){
        var rootUrl = '/api/test/:studentId';
        return $resource(rootUrl,{studentId:'@studentId',classId:'@classId'},{
            getSubmission:{
                url:rootUrl+'/submission'
            },
            getClasses:{
                url:'/api/test/classes',
                isArray:true
            },
            status:{
                url:'/api/test/status'
            },
            all:{
                url:rootUrl+'/all',
                isArray:true
            },
            addClass:{
                url:'/api/test/classes',
                method:'POST'
            },
            removeClass:{
                url:'/api/test/classes/:classId',
                method:'DELETE',
                params:{
                    classId:'@classId'
                }
            },
            testCompleted:{
                url:'/api/proficiency-test/user/:studentId/completed/:classId',
                method:'POST'
            },
            addAdmin:{
                url:'/api/test/:groupId/admins/:userId',
                method:'POST',
                params:{groupId:"@groupId",userId:"@userId"}
            },
            removeAdmin:{
                url:'/api/test/:groupId/admins/:userId',
                method:'DELETE',
                params:{groupId:"@groupId",userId:"@userId"}
            },
            saveTag:{
                url:'/api/test/classes/:classId/tag',
                method:'POST',
                params:{
                    classId:'@classId'
                }
            },
            shareResults:{
                url:'/api/test/share-results',
                method:"POST"
            },
            exportClass:{
                url:'/api/test/:classId/export',
                method:"POST"
            }
        });

    }]).controller('ShareResultsController',['$scope','params','$compile','ProficiencyTestService',function($scope,params,$compile,ProficiencyTestService){
        $scope.testDetails = params.testDetails;
        var subject = params.testDetails.isJ1?
            ("We have graded the " + params.testDetails.testName):
            (params.testDetails.name + " - English proficiency interview results")
        $scope.email = {
            'subject': subject,
            'includeID':true,

            'includeVideo':false,

        };
        if(params.testDetails.enableCertificate)
            $scope.email.includeCertificate = true;
        if(!params.testDetails.isJ1)
            $scope.email.includeReport = true;


        var ckeditor;
        function compile(template){
            return $compile(template)($scope);
        }

        var compiled;

        function updateCompiled(){
            setTimeout(function(){
                if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.emailBody)) {
                    ckeditor = CKEDITOR.instances.emailBody
                    ckeditor.setData(compiled[0].outerHTML);
                }
                $scope.$apply();
            },1000);
        }
        $scope.recompile = function(){
            var template = shareResultsTemplate(params.testDetails.isJ1);
            template = template.replace('<score-table></score-table>',ShareResultsTemplateScoreTable);
            compiled  = compile(template);
            updateCompiled();
        }

        $scope.recompile();


        $scope.send = function(){
            $scope.sending = true;
            ProficiencyTestService.shareResults(_.extend({
                body:ckeditor.getData(),
                classId:params.testDetails.classId,
                userId:params.testDetails.id
            },prepareBoolean($scope.email))).$promise.then(function(){
                $scope.sending = false;
                toastr.success("Email successfully sent!");
                $scope.$close();
            },function(){
                $scope.sending = false;
                toastr.error('Could not send email');
            })
        };
        function prepareBoolean(request){
            var r = angular.copy(request);
            _.each(r,function(value,key){
                if(_.isBoolean(value)){
                    r[key] = value?1:0
                }
            })
            return r;
        }
        
    }]);
    shareResultsTemplate = function(isJ1){
        return isJ1?ShareResultsTemplateJ1:ShareResultsTemplateE3PT
    };
    ShareResultsTemplateE3PT =
        '<div>' +
'     <div>{{testDetails.name}} has completed the English proficiency interview. See the results below</div>' +
' ' +


        '<score-table></score-table> '
        ;
    ShareResultsTemplateScoreTable = '     <div style="margin-top:20px;padding:10px;border:3px solid #dfdfdf;display:inline-block">' +
        '         <div style="font-weight:bold;color:#5fc04f;font-size:17px">{{testDetails.testName}} -' +
        ' {{testDetails.submittedOn}}</div>' +
        '     <table border="0" style="border-collapse:collapse;margin:auto;width:1000px">' +
        '         <tbody>' +
        '         <tr>' +
        '<td style="width:20%;border-top:initial;text-align:center;font-weight:bold;color:#7d7d7d;padding:3px;vertical-align:middle">' +
    '         <div>E3PT Score</div>' +
    ' ' +
    '         <div>{{testDetails.finishedGradeClass?testDetails.actualTotalScore:"N/A"}}</div>' +
    '         </td>' +
        '<td style="width:20%;border-top:initial;text-align:center;color:#7d7d7d;padding:3px;vertical-align:middle" data-ng-repeat="pg in testDetails.pageGroups">\n' +
        '                                <div ng-bind="pg.name"></div>\n' +
        '                                <div ng-bind="pg.finishedGrade?pg.actualScore :\'N/A\'"></div>\n' +
        '                            </td>' +

        '         </tr>' +
        '         </tbody>' +
        '         </table>' +
        '         </div>'+
        '</div>'
    ShareResultsTemplateJ1 =
        '<div>' +
'     <p> The interview results for {{testDetails.name}} are now available. You can view the applicant’s score below, or on the\nattached Score Report. To review the interview video, log in to your  account at elearn.english3.com.</p>' +
' ' +
        '     <table border="0" style="border-collapse:collapse;margin:auto;border: 1px solid #ccc;width: 100%;margin-bottom:20px">' +
        '         <tbody>' +
        '         <tr>'+
        '           <th style="width:200px;text-align: left;padding-left: 15px;border: 1px solid #ccc;background: #e6e3e3;font-weight: normal;font-size: 1.7em;padding-bottom: 5px;padding-top: 5px;">Interview Score</th>'+
        '           <th style="text-align: left;padding-left: 15px;border: 1px solid #ccc;background: #e6e3e3;font-weight: normal;font-size: 1.7em;padding-bottom: 5px;padding-top: 5px;">Score Description</th>'+
        '         </tr>'+
        '         <tr>' +
        '           <td style="padding-left: 15px;border: 1px solid #ccc;font-size: 5em;padding-left:0;text-align:center;line-height: 1.5;height: 150px;">{{testDetails.actualTotalScore}}</td>' +
        '           <td style="padding-left: 15px;border: 1px solid #ccc;" ng-bind-html="$root.trustAsHtml(testDetails.scoreDescription)"></td>' +

        '         </tr>' +
        '         </tbody>' +
        '     </table>' +
        '<p style="color:white">[comments_section]</p>' +
'  <p>If you have any question or concern about the score please send an email to matthew.heiner@english3.com.</p>   '+
    '<p>Best Regards,<br>The English3 Team</p>';


}(angular))
