
import './index.less'
import timedEditorHTML from './template.html'
import TimedEditorController from './controller.js'
import './app.js'

angular.module('timed-editor', ['ui.sortable'])
  .directive('timedEditor', function timedEditor() {
    return {
      scope: {
        data: '=',
        onSave: '=',
        onRemove: '=',
      },
      template: timedEditorHTML,
      controller: TimedEditorController,
    }
  })
