/**
 * Angular Selectize2
 * https://github.com/machineboy2045/angular-selectize
 **/
var deepEqual = function (x, y) {
  if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
    if (Object.keys(x).length != Object.keys(y).length)
      return false;

    for (var prop in x) {
      if (y.hasOwnProperty(prop))
      {
        if (! deepEqual(x[prop], y[prop]))
          return false;
      }
      else
        return false;
    }

    return true;
  }
  else if (x !== y)
    return false;
  else
    return true;
}
angular.module('selectize2', []).value('selectizeConfig', {}).directive("selectize2", ['selectizeConfig','$timeout', function(selectizeConfig,$timeout) {
  return {
    restrict: 'EA',
    require: '^ngModel',
    scope: { ngModel: '=', config: '=?', options: '=?', ngDisabled: '=', ngRequired: '&' ,updateFn:'=?'},
    link: function(scope, element, attrs, modelCtrl) {

      var selectize,
          settings = angular.extend({}, Selectize.defaults, selectizeConfig, scope.config);

      scope.options = scope.options || [];
      scope.config = scope.config || {};




      var isEmpty = function(val) {
        return val === undefined || val === null || !val.length; //support checking empty arrays
      };

      var toggle = function(disabled) {
        disabled ? selectize.disable() : selectize.enable();
      }

      var validate = function() {
        var isInvalid = (scope.ngRequired() || attrs.required || settings.required) && isEmpty(scope.ngModel);
        modelCtrl.$setValidity('required', !isInvalid);
      };
      var setSelectizeConfig = function(curr, prev) {
        if(deepEqual(curr,prev)) return;
        if(curr.optgroups)
          updateOptGroups(curr.optgroups)
      }
      function updateOptGroups(optgroups){
        selectize.optgroups={}
        angular.forEach(optgroups,function(optgroup){
          selectize.addOptionGroup(optgroup.value,optgroup);
        })
        setSelectizeOptions(scope.options,scope.options);
      }
      var setSelectizeOptions = function(curr, prev) {
        var updating = true;
        setTimeout(function(){

            if(deepEqual(curr,prev) ) return;
            if(prev==true){
                selectize.clear();
                selectize.clearOptions();
            }else{
                angular.forEach(prev, function(opt){
                    if(curr.indexOf(opt) === -1){
                        var value = opt[settings.valueField];
                        selectize.removeOption(value, true);
                    }
                });
            }

            if(angular.isObject(curr)){
                var tmp = []
                angular.forEach(curr,function(v){tmp.push(v)});
                curr=tmp;
            }
            selectize.addOption(curr, true);
            if(selectize.$control_input.val()){
                selectize.refreshOptions(true);
            }
            setSelectizeValue();
            updating = false;
        })

      }
      if(scope.updateFn){
        scope.updateFn(setSelectizeOptions.bind(this))
      }

      var setSelectizeValue = function() {
        setTimeout(function(){
          validate();

          selectize.$control.toggleClass('ng-valid', modelCtrl.$valid);
          selectize.$control.toggleClass('ng-invalid', modelCtrl.$invalid);
          selectize.$control.toggleClass('ng-dirty', modelCtrl.$dirty);
          selectize.$control.toggleClass('ng-pristine', modelCtrl.$pristine);

          if (!angular.equals(selectize.items, scope.ngModel)) {
            selectize.setValue(scope.ngModel, true)
          }
        });
      }

      settings.onChange = function(value) {
        var value = angular.copy(selectize.items);
        if (settings.maxItems == 1) {
          value = value[0]
        }
        modelCtrl.$setViewValue( value );
        $timeout(function(){scope.$apply()});
        if (scope.config.onChange) {
          scope.config.onChange.apply(this, arguments);
        }
      };

      settings.onOptionAdd = function(value, data) {

        // if( scope.options.indexOf(data) === -1 ) {
        //   scope.options.push(data);
        //
        //   if (scope.config.onOptionAdd) {
        //     scope.config.onOptionAdd.apply(this, arguments);
        //   }
        // }
      };

      settings.onInitialize = function() {
        selectize = element[0].selectize;

        setSelectizeOptions(scope.options);

        //provides a way to access the selectize element from an
        //angular controller
        if (scope.config.onInitialize) {
          scope.config.onInitialize(selectize);
        }

        scope.$watchCollection('options', setSelectizeOptions,true);
        scope.$watchCollection('config', setSelectizeConfig);
        scope.$watch('ngModel', setSelectizeValue,true);
        scope.$watch('ngDisabled', toggle);
      };

      modelCtrl.$viewChangeListeners.push(function() {
        setTimeout(function(){scope.$eval(attrs.ngChange)});
      });

      element.selectize(settings);

      element.on('$destroy', function() {
        if (selectize) {
          selectize.destroy();
          element = null;
        }
      });
    }
  };
}]);
