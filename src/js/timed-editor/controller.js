
export default function TimedEditorController($scope) {

  $scope.saved = false;

  // to fix css transition strangeness
  setTimeout(_ => {
    $scope.tick = true
    $scope.$digest()
  }, 100)

  $scope.sortableOptions = {
    handle: '.TimedEditor_handle',
  }

  $scope.isInvalid = function () {
    return $scope.data.dialog_json.some(item => {
      return !item.prompt.trim() || !item.answers[0].trim()
    })
  }

  $scope.remove = function (index) {
    $scope.data.dialog_json.splice(index, 1);
  }

  $scope.addNew = function () {
    $scope.data.dialog_json.push({
      prompt: '',
      answers: [''],
    })
  }

  $scope.really_remove = false;

  $scope.removeReview = function () {
    $scope.really_remove = true;
  }

  $scope.save = function () {
    $scope.saving = true;
    $scope.onSave($scope.data, _ => {
      console.log('done!')
      $scope.saving = false;
      $scope.saved = true;
      try {
      $scope.$digest()
      } catch (e) {}
      setTimeout(_ => {
        $scope.saved = false;
        try {
        $scope.$digest()
        } catch (e) {}
      }, 1500)
    })
  }

}

