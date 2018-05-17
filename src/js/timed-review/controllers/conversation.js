
var Conversation = require('../lib/conversation')

module.exports = function ($scope, $sce) {
  let conversation = $scope.conversation
  $scope.game = new Conversation(conversation, update, $scope.onDone)

  $scope.$on('$destroy', function () {
    $scope.game.end();
  })

  if (localStorage.DEBUG_CONVERSE) {
    $scope.game.start()
  }

  function update() {
    if (!$scope.$$phase) {
      try {
        $scope.$digest()
      } catch (e) {}
    }
  }
}

