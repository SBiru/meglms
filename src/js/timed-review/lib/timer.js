
function pie(x, y, t1, r) {
	var vals = {
    x1: Math.cos(0) * r + x,
    y1: Math.sin(0) * r + y,
    x2: Math.cos(t1) * r + x,
    y2: Math.sin(t1) * r + y,
    flag: t1 < Math.PI ? 0 : 1,
    r: r,
  }
  return 'M${x1} ${y1} A ${r} ${r}, 0, ${flag}, 1, ${x2} ${y2}'.replace(/\${([^}]+)}/g, function (full, name) {return vals[name]})
}

module.exports = function timerDirective() {
  return {
    scope: {
      onDone: '=',
      time: '='
    },

    template: '<div class="Timer">' +
      '<svg width=100 height=100>' +
        '<circle cx="50" cy="50" r="40"/>' +
        '<path ng-attr-d="{{path}}"/>'+
      '</svg>' +
    '</div>',
    controller: function ($scope) {
      $scope.start = Date.now()
      $scope.left = $scope.time
      function makePie() {
        return pie(50, 50, (Date.now() - $scope.start) / 1000 / $scope.time * Math.PI * 2, 40)
      }
      $scope.path = makePie()
      var tout = setInterval(function () {
        $scope.left = $scope.time - (Date.now() - $scope.start) / 1000
        if ($scope.left <= 0) {
          $scope.left = 0
          clearInterval(tout)
          $scope.onDone()
        } else {
          $scope.path = makePie()
        }
        $scope.$digest()
      }, 20);

      $scope.$on('$destroy', function () {
        clearInterval(tout)
      })
    },
  }
}

