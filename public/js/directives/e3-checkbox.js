var createStyleSheet = function() {
    // Create the <style> tag
    var style = document.createElement("style");

    // Add a media (and/or media query) here if you'd like!
    // style.setAttribute("media", "screen")
    // style.setAttribute("media", "only screen and (max-width : 1024px)")

    // WebKit hack :(
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style;
};
function setCSSRule(sheet, selector, rules, index) {
    if(typeof rules === 'object'){
        var rules = _.map(rules,function(val,key){
            return key + ': ' + val;
        }).join(';');
    }
    sheet.innerHTML = selector  + '{' + rules + '}'

}
var checkboxId = 0;
angular.module('app')

    .directive('e3Checkbox',
    [
        function () {
            return {
                require: "?ngModel",
                scope:{
                    ngDisabled:'=?',

                },
                restrict: 'A',
                template: "<input id='{{id}}' type='checkbox' data-ng-click='onClick($event)' data-ng-disabled='ngDisabled' ng-model='value' ng-change='onChange()' class='e3-checkbox'><label for='{{id}}' class='e3-checkbox-label'></label>",

                link:function (scope, element, attrs,ngModel) {
                    if (!ngModel) return;
                    scope.id = attrs.id?attrs.id:guid()
                    scope.onChange = function(){
                        ngModel.$setViewValue(scope.value);
                        if(attrs.ngChange){
                            scope.$parent.$eval(attrs.ngChange)
                        }
                    };
                    scope.onClick=function($event){
                        if(attrs.ngClick){
                            $event.stopPropagation();
                            scope.$parent.$eval(attrs.ngClick)

                        }
                    }
                    ngModel.$render = function(){
                        scope.value = ngModel.$modelValue;
                    };

                    function guid() {
                        function s4() {
                            return Math.floor((1 + Math.random()) * 0x10000)
                                .toString(16)
                                .substring(1);
                        }
                        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                            s4() + '-' + s4() + s4() + s4();
                    }

                }
            }
        }
    ]
).directive('e3Radio',
    [
        function () {
            return {
                require: "?ngModel",
                scope:{
                    ngDisabled:'=?',
                    label:'=?',
                    name:'@',
                    size:'=?',
                    boxStyle:'=?',
                    value:'=?',
                    type:'@',
                    ngChecked:'=?'
                },
                restrict: 'E',
                template: "<div id='e3-radio-{{id}}' class=\"e3-radio-container\" data-ng-disabled='ngDisabled' > <span ng-bind-html='$root.trustAsHtml(label)'></span>" +
                "  <input  type='{{type}}'  name=\"{{name}}\" value='{{value}}' ng-model='model' ng-change='onChange()' data-ng-disabled='ngDisabled'>\n" +
                "  <span class=\"e3-checkmark\" data-ng-click='onClick($event)'></span>\n" +
                "</div>",

                link:function (scope, element, attrs,ngModel) {
                    var self,container,checkbox,size;

                    scope.id = attrs.id?attrs.id:++checkboxId;

                    self = {};
                    container = element.find('.e3-radio-container');
                    checkbox = element.find('.e3-checkmark');
                    self.sheet = createStyleSheet( );
                    scope.boxStyle = scope.boxStyle || 'circle';

                    scope.$watch('size',changeSize);
                    scope.$watch('boxStyle',changeSize);
                    scope.$watch('ngChecked',function(checked){
                        if(scope.type == 'checkbox' && checked !== undefined)
                        {
                            scope.model = checked
                            update();
                            changeSize();
                        }
                    });
                    scope.ready = scope.$watch(function(){
                        return container.height()
                    },function(height){
                        if(height>0){
                            scope.ready();
                            changeSize();
                        }
                    })
                    if (!ngModel) return;

                    changeSize();
                    scope.onChange = update;
                    function update(){
                        ngModel.$setViewValue(scope.model);
                        if(attrs.ngChange){
                            setTimeout(function(){
                                scope.$parent.$eval(attrs.ngChange)
                            })

                        }
                    }
                    scope.onClick=function($event){
                        scope.model = scope.type==='radio'?scope.value:!scope.model;
                        update()
                        if(attrs.ngClick){
                            $event.stopPropagation();
                            scope.$parent.$eval(attrs.ngClick)
                        }
                    }
                    ngModel.$render = function(){
                        scope.model = ngModel.$modelValue;
                    };


                    function changeSize(){
                        if(scope.size && scope.size.slice && scope.size.slice(-2) === 'px')
                            size  = scope.size.replace('px','');
                        size = parseInt(size || 12);
                        var newSize = size;
                        var fontSize,paddingLeft;


                        fontSize= newSize + 'px';
                        paddingLeft= newSize + 8 + 'px';

                        container.css({'font-size':fontSize,'padding-left':paddingLeft});

                        scope.boxStyle==='circle'?sizeForCircle(newSize):sizeForBox(newSize);
                        setTimeout(function(){
                            var checkboxSize, containerSize;
                            checkboxSize = checkbox.height();
                            containerSize = container.height();
                            checkbox.css({top:(containerSize - checkboxSize)/2 + 'px'});
                        })
                    }
                    function sizeForCircle(newSize){
                        var boxSize,checkSize,position;
                        boxSize = newSize + 'px';
                        checkSize = newSize/2 + 'px';
                        position = (newSize - newSize/2) / 2 + 'px'


                        checkbox.css({'width':boxSize,'height':boxSize,'border-radius':scope.boxStyle==='circle'?'50%':'initial'});
                        checkbox.removeClass('check')


                        setCSSRule(self.sheet,'#e3-radio-' + scope.id + ' .e3-checkmark:after', {'border-radius':scope.boxStyle==='circle'?'50%':'initial',top:position,left:position,width:checkSize,height:checkSize},0);

                    }
                    function sizeForBox(newSize){

                        var checkThickness,boxSize,width,height,left,top;
                        checkThickness = Math.max(1,Math.floor(newSize/10));
                        boxSize = newSize + 'px';
                        width = newSize/4;
                        height = newSize/2;
                        // left = (newSize - Math.sqrt(Math.pow(width,2) + Math.pow(height,2))) / 2 + 'px';
                        left = newSize/3 + 'px';
                        top = (newSize/4) + 'px';
                        width+='px';
                        height+='px';


                        checkbox.css({'width':boxSize,'height':boxSize,'border-radius':scope.boxStyle==='circle'?'50%':'initial'});
                        checkbox.addClass('check')


                        setCSSRule(self.sheet,'#e3-radio-' + scope.id + ' .e3-checkmark:after', {
                            'border-radius':scope.boxStyle==='circle'?'50%':'initial',
                            top:top,
                            left:left,
                            width:width,
                            height:height,
                            'border-width':'0 ' + checkThickness + 'px ' + checkThickness + 'px 0',
                            background:'initial'
                        });

                    }
                }
            }
        }
    ]
);

