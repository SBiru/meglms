'use strict';

angular.module('app')
    .controller('PEModalScoreController',
    [	'$scope',
        '$modalInstance',
        '$stateParams',
        'params',
        'Gradebook',
        'Page',
        'UserV2',
        function($scope, $modalInstance, $stateParams, params, Gradebook, Page, UserV2){
            var original;


            var close = function(){
                $scope.saving = false;
                $modalInstance.close({params:$scope.params})
            };
            $scope.$root.classInfo=params.class
            $scope.params = params;
            $scope.addExemptComments = null;
            $scope.extraAttempt = false;
            $scope.score={};
            $scope.pageOptions = {
                preview: true,
                hidePreviewAlert: true
            };
            $scope.ckeditorOptions = {
                toolbar:'basic'
            }
            if(params.page.maxScore===null){
                $scope.recalculating = true;
                Gradebook.recalculateGrades(
                    {
                        'userId':params.student.id,
                        'classId':params.class.id

                    },
                    function(ok){
                        window.location.reload();
                    }

                );
            }
            else{
                Page.get(
                    {id: params.page.id, userId: params.student.id},
                    function(page){
                        console.log(page);
                        $scope.page = page;
                        $scope.isOverriden = $scope.params.page.isScoreOverride;
                        //if($scope.isOverriden) {
                        //	UserV2.getUser($scope.params.page.overrideBy).then(function(user){
                        //		$scope.overridingUser = user;
                        //	});
                        //}
                        $scope.isExempt = ($scope.params.page.exemptedBy) || $scope.params.page.isExempt;
                        $scope.score.initial= $scope.params.page.score
                        original = {
                            isExempt: $scope.isExempt,
                            score: $scope.score.initial,
                            extraAttempt: false
                        };
                    }
                );
                $scope.$root.$on('graderNonSubmittableFinished',function(){
                    $scope.params.page.scoreOverride = $scope.score.initial
                    close();
                })
                $scope.scoreAsPercent = function(){
                    if(!$scope.score.initial) {
                        return 0;
                    }
                    return Math.round(($scope.score.initial * 100) / params.page.maxScore);
                };

                $scope.isScored = function(){
                    return $scope.score.initial !== null && $scope.score.initial !== undefined;
                };

                $scope.addScore = function(){
                    $scope.addingScore = true;
                    $scope.score.initial = 0;
                };

                $scope.exempt = function(value){
                    if(value && !original.isExempt) {
                        $scope.addExemptComments = '';
                    }
                    $scope.isExempt = value;
                    $scope.score.initial = original.score;
                };
                $scope.showGiveExtra = function(){
                    return $scope.page && $scope.page.quiz && !$scope.isExempt && parseInt($scope.page.quiz.completedAttempts) >= parseInt($scope.page.quiz.allowedTakes);
                }
                $scope.toggleExtraAttempt = function(){
                    $scope.extraAttempt = !$scope.extraAttempt;
                };

                $scope.getMaxAttempts = function(){
                    return ($scope.page.quiz.allowedTakes)? $scope.page.quiz.allowedTakes : 'unlimited';
                };

                $scope.canSave = function(){
                    return !angular.equals(
                        original,
                        {
                            isExempt: $scope.isExempt,
                            score: $scope.score.initial,
                            extraAttempt: $scope.extraAttempt
                        }
                    );
                };
                $scope.graderNonSubmittableFinished = function(){
                    close();
                }
                $scope.save = function(){
                    $scope.saving = true;
                    if(!$scope.params.page.requireSubmission){
                        $scope.$broadcast('gradeUsingRubric');
                        return;
                    }
                    if($scope.extraAttempt) {
                        Gradebook.giveExtraAttempt(
                            {pageId:$scope.page.id, userId:params.student.id},
                            function(){
                                close();
                            });
                    } else if($scope.isExempt) {
                        Gradebook.exempt(
                            $stateParams.classId,
                            $scope.params.page.id,
                            $scope.params.student.id,
                            $scope.addExemptComments
                        ).then(function(result){
                                $scope.params.page.exemptedBy = result.exemptedBy;
                                $scope.params.page.exemptedComments = result.exemptedComments;
                                close();
                            });
                    } else {
                        if(original.isExempt) {
                            // if we get to this point, changes have happened, hence Save button is enabled
                            // Student was exempt before changes. Unexempting..
                            Gradebook.unexempt(
                                $stateParams.classId,
                                $scope.params.page.id,
                                $scope.params.student.id
                            ).then(function(){
                                    $scope.params.page.exemptedBy = null;
                                    $scope.score.initial = original.score;
                                    close();
                                });
                        } else {
                            // was not AND is not exempt, saving score
                            // change must have happened in overriding score input box
                            if(parseInt($scope.score.initial) === 'NaN') {
                                $scope.score.initial = 0;
                            } else {
                                $scope.score.initial = parseFloat($scope.score.initial);
                            }
                            $scope.params.page.scoreOverride = $scope.score.initial;
                            Gradebook.overrideScore(
                                $scope.params.class.id,
                                $scope.params.page.id,
                                $scope.params.student.id,
                                $scope.params.page.scoreOverride
                            ).then(function(){
                                    close();
                                });

                        }
                    }
                };

                $scope.cancel = function () {
                    if($scope.isOverriden) {
                        $scope.params.page.score = $scope.params.page.scoreOverride = original.score;
                    } else {
                        $scope.params.page.score = original.score;
                    }
                    $modalInstance.dismiss('cancel');
                };
            }

        }
    ]
);
