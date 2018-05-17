"use strict";
(function () {
    angular.module('app')

        .directive('quizAdvancedSettings', [
            '$modal',
            function($modal){
                return {
                    restrict:'E',
                    templateUrl:'/public/views/directives/quiz-editor/quiz-advanced-settings.html?v='+window.currentJsVersion,
                    scope:{
                        settings:'=?',
                        quizId:'=?'
                    },
                    link:function(scope,element,attrs){
                        scope.open = function() {
                            $modal.open({
                                controller: AdvancedSettingsController,
                                templateUrl: 'quiz-advanced-settings-modal',
                                windowClass: 'modal-flat',
                                resolve:{
                                    params:function(){
                                        return {
                                            settings:angular.copy(scope.settings),
                                            id:scope.quizId
                                        }
                                    },
                                }

                            }).result.then(function(res){
                                if(res)
                                    _.extend(scope.settings,res)
                            })
                        }
                    }
                }
            }
        ])

    var AdvancedSettingsController = ['$scope','params','TestbankTestService',function($scope,params,TestbankTestService){
        $scope.settings = params.settings;

        $scope.font_names = _.map(CKEDITOR.config.font_names.split(';'),function(n){
            var parts = n.split('/');
            return {
                label: parts[0],
                family: parts[1],
            }
        });
        $scope.font_sizes = _.map(CKEDITOR.config.fontSize_sizes.split(';'),function(n){
            var parts = n.split('/');
            return {
                label: parts[0],
                size: parts[1],
            }
        });

        $scope.close = function(){
            TestbankTestService.advancedSettings(params.id,$scope.settings).then($scope.$close.bind(null,$scope.settings))
        }

    }]
}());