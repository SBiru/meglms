
import appMenuTemplate from './menu.html'
import appContentTemplate from './content.html'
import './service'
import modalTemplate from './modal.html'
import modalController from './modal.js'

import appMenuController from './menu.js'


angular.module('app.timed-editor', [
  'app.timed-editor.service',
  'ui.router',
  'timed-editor',
])
.config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {

  $stateProvider
    .state('timedReviews', {
      parent: 'nav.course', // required to link to the main (top) navigation
      url: 'timed-review',
      views: {
        'menu@': {
          template: appMenuTemplate,
          controller: appMenuController,
        },
        'content@': {
          template: appContentTemplate,
          controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav',
            function($rootScope, $scope, $state, $stateParams, nav) {

              // give this controller 'a little more scope'
              $scope.nav = nav;
              $scope.course = nav.selected_course;
            }
          ]
        }
      }
    })

    .state('timedReviews.detail', {
      url: ':{reviewId:[0-9]{1,11}}',
      views: {
        'content@': {
          template: '<timed-editor data="data" on-remove="onRemove" on-save="onSave">The Timed Review</timed-editor>',
          resolve: {
            reviewDetails: ['$stateParams', 'TimedReviewService',
              function($stateParams, TimedReviewService) {
                return TimedReviewService.details($stateParams.reviewId);
              }
            ]
          },
          controller: ['$rootScope', '$scope', '$state', '$stateParams', 'reviewDetails', 'nav', 'TimedReviewService', '$sce',
            function($rootScope, $scope, $state, $stateParams, reviewDetails, nav, TimedReviewService, $sce) {
              $scope.data = reviewDetails.data;

              $scope.onRemove = function () {
                TimedReviewService.delete($scope.data.id)
                .success(respose => {
                  let ix = null
                  nav.data.timedReviews.forEach((r, i) => {
                    if (r.id === $scope.data.id) ix = i;
                  })
                  if (!ix) return console.warn('TimedReview not in nav list', $scope.data.id);
                  nav.data.timedReviews.splice(ix, 1);
                  $state.go('timedReviews');
                });
              }

              $scope.onSave = function (data, done) {
                TimedReviewService.update($scope.data.id, data)
                .success(respose => {
                  done()
                });
              }
            }
          ]
        }
      }
    })
}])
.controller('ModalAddTimedReviewController', ($scope, $state, $modal, nav, TimedReviewService) => {

  $scope.open = function(size) {

    var modalInstance = $modal.open({
      template: modalTemplate,
      controller: modalController,
      size: size,
      resolve: {
        /*
course: function() {
return nav.selected_course;
}
*/
      }
    });

    modalInstance.result.then(response => {
      if (!response.id) return

      nav.data.timedReviews.push(response);

      // change state to the newly created bank
      $state.go('timedReviews.detail', {
        reviewId: response.id
      });

    }, _ => {/* cancel */});

  };
});


