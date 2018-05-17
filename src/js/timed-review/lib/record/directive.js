
var Recorder = require('./')

module.exports = function recordDirective() {
  return {
    scope: {
      onDone: '=',
      autostart: '=',
    },
    template: require('./index.html'),
    controller: function ($scope, $element, $sce) {
      $scope.previewUrl = null;
      $scope.recorder = new Recorder({
        onDone: $scope.onDone || function () {
        },
        onUpdate: $scope.$digest.bind($scope),
        onPreview: function (url) {
          if (!url) {
            $scope.previewUrl = null;
          } else {
            $scope.previewUrl = $sce.trustAsResourceUrl(url);
          }
          // var video = $element.children('video')[0]
          // video.src = url;
          // video.play()
          if (!$scope.$$phase) {
            try {
              $scope.$digest()
            } catch(e) {}
          }
          // videoElement.play();
          // videoElement.muted = true;
          // videoElement.controls = false;
        }
      });

      if ($scope.autostart) {
        $scope.recorder.start()
      }
    },
      /*
      $scope.$watch('data', function (data) {
        $scope.dialog = new DialogItem(data, $scope.$digest.bind($scope));
      })
      */
  }
}


