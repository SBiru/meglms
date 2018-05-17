
module.exports = function (controller, template) {
  return ['$compile', function SimpleDirective($compile) {
    return {
      scope: {},
      template: template,
      controller: controller,
    }
  }]
}

