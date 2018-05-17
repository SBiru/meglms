
import SimpleDirective from '../timed-review/lib/simple-directive'
import Conversation from '../timed-review/lib/conversation'
import DialogItem from '../timed-review/lib/dialog-item'

import './index.less'

function iPromised($q, data) {
  var p = $q.defer()
  p.resolve(data)
  return p.promise
}

export default angular.module('timed-review', [])

  .controller('TimedReviewController', function ($scope, $rootScope, TimedReview) {
    $scope.onDone = function (data) {
      alert('finished')
    }

    $scope.reviewId = $rootScope.$stateParams.contentId

    TimedReview.get({contentId: $scope.reviewId}, function (data) {
      $scope.reviewData = data.reviewData
      $scope.timeLimit = data.timed_limit
      $scope.pauseDuration = data.timed_pause
      $rootScope.pagename = data.title
        // $rootScope.$digest()
    })

    $scope.submitResults = (recorded, done) => {
      let data = new FormData()
      data.append('chunks', recorded.length)
      for (let i=0; i<recorded.length; i++) {
        data.append('chunk-' + i + '-audio', recorded[i].audio)
        data.append('chunk-' + i + '-video', recorded[i].video)
      }
      let xhr = new XMLHttpRequest()
      xhr.responseType = 'json'
      xhr.addEventListener('load', evt => {
        if (xhr.response !== 'success') {
          console.log('bad response saving timed review', xhr.response)
          return done(new Error('failed to save'));
        }
        console.log('done!', xhr.response)
        done()
      })
      xhr.open('POST', '/timed_review/' + $scope.reviewId + '/post')
      xhr.send(data)
    }

  })

  .directive('timedReview', function timedReview() {
    return {
      scope: {conversation: '=timedReview', onDone: '=', timeLimit: '=', pauseDuration: '='},
      templateUrl: '/public/views/timed-review/conversation.html',
      controller: require('./controllers/conversation')
    }
  })

  .directive('timerCircle', require('./lib/timer'))

  .directive('dialogItem', function dialogItem() {
    return {
      scope: {
        // pastItems: '=',
        data: '=',
        onDone: '=',
        onData: '=',
        stream: '=',
        timeLimit: '=',
        pauseDuration: '=',
      },
      templateUrl: '/public/views/timed-review/dialog-item.html',
      controller: function ($scope, $element, $sce) {
        $scope.$watch('data', function (data) {
          // $scope.dialog = new DialogItem(data, $scope.stream, $scope.time, $scope.$digest.bind($scope));
          $scope.dialog = new DialogItem({
            data: $scope.data,
            stream: $scope.stream,
            timeLimit: $scope.timeLimit,
            pauseDuration: $scope.pauseDuration,
            onUpdate: $scope.$digest.bind($scope),
            onData: $scope.onData,
          });
        })
        $scope.$watch('stream', function (stream) {
          $scope.dialog.stream = stream
          $scope.previewUrl = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream))
        })
        $scope.$watch('dialog.state', function (state) {
          if (state === 'started') {
            $element.find('video')[0].play()
          } else {
            $element.find('video')[0].pause()
          }
        })
        $element.find('video')[0].muted = true
        $scope.$on('$destroy', function () {
          $scope.dialog.stop()
        })
      },
    }
  })

