angular.module('app')

.directive('e3Datepicker2',
    [
        function () {
            return {
                require: "?ngModel",
                scope: {
                    ngDisabled: '=?',
                    options:'=?'
                },
                restrict: 'A',
                template:'<div class="input-group date">\n' +
                '  <input type="text" ng-model="value" class="form-control"><span class="input-group-btn"><button class="btn btn-default"><i class="glyphicon glyphicon-calendar"></i></button></span>\n' +
                '</div> ',
                link:function(scope,el,attr,ngModel){
                    E3DatepickerController(scope,el,attr,ngModel)
                }
            }
        }
    ]
);
var id = 0;
var E3DatepickerController = function(scope,el,attr,ngModel){
    var _id = id++;
    var opts = _.extend({
            autoclose:true,
            offsetTop:51,
            momentformat:'MM/DD/YYYY'
        },
        scope.options
    )
    el.find('.datepicker-container').addClass(_id+'');
    var datepickerEl = el.find('.input-group.date').datepicker2(opts);
    var datepicker = datepickerEl.data('datepicker')
    window.datepicker= datepicker

    datepickerEl.on('changeDate',function(evt){
        ngModel.$setViewValue(moment(evt.date).format(opts.momentformat));
    })
    // scope.$watch(
    //     function(){
    //         return ngModel.$modelValue;
    //     }, update, true);
    function update(data, oldValue,force){
        if(data)
        {
            var date = moment(data);
            if(force === true || (date.isValid() && date.toISOString() !== moment(oldValue).toISOString() && datepicker.element.find('input').val().match(/\d\d\/\d\d\/\d\d\d\d/))){

                scope.value = data;
                datepicker.setDate()
            }

        }
    }
    var init = scope.$parent.$eval(attr.ngModel)
    init && update(init,null,true)

}