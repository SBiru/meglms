'use strict';

(function (angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular', 'ckeditor'], function (angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function (angular) {
    var app = angular.module('ngCkeditor', []);
    var $defer, loaded = false;

    app.run(['$q', '$timeout', function ($q, $timeout) {
        $defer = $q.defer();

        if (angular.isUndefined(CKEDITOR)) {
            throw new Error('CKEDITOR not found');
        }
        CKEDITOR.disableAutoInline = true;
        function checkLoaded() {
            if (CKEDITOR.status === 'loaded') {
                loaded = true;
                $defer.resolve();
            } else {
                checkLoaded();
            }
        }

        CKEDITOR.on('loaded', checkLoaded);
        $timeout(checkLoaded, 100);
    }]);

    app.directive('ckeditor', ['$timeout', '$q', function ($timeout, $q) {

        return {
            restrict: 'AC',
            require: ['ngModel'],
            scope: {
                customOptions: '=?',
                disableDoubleBind:'=?',
                allowedContent:'=?',
                loadOnFocus:'=?'
            },
            link: function (scope, element, attrs, ctrls) {
                function CkeditorDirectiveTag() {} //investigating memory leak
                scope.__tag = new CkeditorDirectiveTag();
                var ngModel = ctrls[0];
                var form = ctrls[1] || null;
                var EMPTY_HTML = '<p></p>',
                    isTextarea = element[0].tagName.toLowerCase() === 'textarea',
                    data = [],
                    isReady = false;


                if (!isTextarea) {
                    element.attr('contenteditable', true);
                }

                var onLoad = function () {

                    var options = {
                        toolbar: 'simple',
                        toolbar_full: [ //jshint ignore:line
                            {
                                name: 'basicstyles',
                                items: ['Bold', 'Italic', 'Strike', 'Underline']
                            },
                            {name: 'paragraph', items: ['BulletedList', 'NumberedList', 'Blockquote']},
                            {name: 'editing', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
                            {name: 'links', items: ['Link', 'Unlink', 'Anchor']},
                            {name: 'tools', items: ['SpellChecker', 'Maximize']},
                            '/',
                            {
                                name: 'styles',
                                items: ['Format', 'FontSize', 'TextColor', 'PasteText', 'PasteFromWord', 'RemoveFormat']
                            },
                            {name: 'insert', items: ['Image', 'Table', 'SpecialChar']},
                            {name: 'forms', items: ['Outdent', 'Indent']},
                            {name: 'clipboard', items: ['Undo', 'Redo']},
                            {name: 'document', items: ['PageBreak', 'Source']}
                        ],
                        toolbar_simple : [
                            { name: 'document',items: [ 'Source']},
                            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'SpecialChar', 'Subscript', 'Superscript'] },
                            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-',  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
                            { name: 'styles', items: [ 'Font', 'FontSize' ] },
                            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                            { name: 'tools', items : [ 'Maximize'] },
                            { name: 'insert', items: [ 'Image', 'Flash', 'Table','Video','audio' ] },
                            { name: 'links', items: ['Link', 'Unlink']},
                        ],
                        toolbar_basic : [
                                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic',  'TextColor'] },
                                { name: 'styles', items: [ 'Font', 'FontSize','Underline' ] },
                        ],
                        toolbar_essay : [{
                        name: 'basicstyles',
                        groups: ['basicstyles', 'cleanup'],
                        items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat', 'Smiley']
                            }, {
                                name: 'paragraph',
                                groups: ['list', 'indent', 'blocks', 'align', 'bidi'],
                                items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                            }, {
                                name: 'colors',
                                items: ['TextColor', 'BGColor']
                            }, {
                                name: 'tools',
                                items: ['Maximize']
                            },],
                        filebrowserUploadUrl: '/uploadckeditormedia/',

                        disableNativeSpellChecker: true,
                        uiColor: '#FAFAFA',
                        height: '200px',
                        width: '100%',

                    };
                    if(scope.loadOnFocus){
                        options.startupFocus=true;
                    }
                    options = angular.extend(options, scope.customOptions);

                    var instance = (isTextarea) ? CKEDITOR.replace(element[0], options) : CKEDITOR.inline(element[0], options)
                    element.on('$destroy', function() {
                        destroy(instance);
                    })
                    var configLoaderDef = $q.defer();
                    if(scope.allowedContent)
                        instance.config.allowedContent= true;

                    instance.on( 'paste', function( evt ) {
                        var data = evt.data;
                        data.dataValue = E3replaceUrl(data.dataValue);
                        // Text could be pasted, but you transformed it into HTML so update that.
                        data.type = 'html';
                    });
                    var setModelData = function (setPristine) {

                        var data = instance.getData();
                        if (data === '') {
                            data = null;
                        }
                        $timeout(function () { // for key up event
                            if (setPristine !== true || data !== ngModel.$viewValue) {
                                ngModel.$setViewValue(data);


                            }

                            if (setPristine === true && form) {
                                form.$setPristine();
                            }

                        }, 0);
                    }, onUpdateModelData = function (setPristine) {

                        if (!data.length) {
                            return;
                        }

                        var item = data.pop() || EMPTY_HTML;

                        isReady = false;
                        instance.setData(item, function () {
                            setModelData(setPristine);
                            isReady = true;
                        });
                    };

                    //instance.on('pasteState',   setModelData);
                    instance.on('change', function(setPristine){
                        setModelData(setPristine)
                    });
                    instance.on('blur',function(setPristine){
                        if(scope.loadOnFocus){
                            if(!hasOpenedDialogChildren())
                                 destroy(instance);
                        }else{
                            setModelData(setPristine)
                            element.attr('is-editing', '0');
                        }

                    });
                    function hasOpenedDialogChildren(){
                        var children = angular.element('.cke_editor_'+instance.element.getId()+'_dialog');
                        for(var i=0;i<children.length;i++){
                            var el = children[i]
                            if(el.style.display != 'none'){
                                return true
                            }
                        }
                        return false;
                    }
                    instance.on('focus',function(setPristine){
                        element.attr('is-editing', '1');
                    });
                    //instance.on('key',          setModelData); // for source view

                    instance.on('instanceReady', function () {
                        scope.$broadcast('ckeditor.ready');
                        setTimeout(function(){
                            scope.$apply(function () {
                                onUpdateModelData(true);
                            });
                        })


                        instance.document.on('keyup', setModelData);
                    });
                    instance.on('customConfigLoaded', function () {
                        configLoaderDef.resolve();

                        var attempts = 0;
                        checkIfEditorWasLoaded();
                        function checkIfEditorWasLoaded(){
                            $timeout(function(){
                                if(attempts<15 && instance.status=='unloaded'){
                                    attempts++;
                                    checkIfEditorWasLoaded()
                                }else{
                                    if(instance.status=='unloaded'){
                                        instance.element.setStyle('visibility','visible')
                                        instance.element.setStyle('display','auto')
                                        instance.element.setStyle('width','100%')
                                        instance.element.setStyle('height','125px')
                                    }
                                }
                            },100)
                        }

                    });

                    ngModel.$render = function () {

                        if(element.attr('is-editing')==1 && scope.disableDoubleBind) return;

                        data.push(ngModel.$viewValue);

                        if (isReady) {
                            onUpdateModelData();
                        }
                    };
                    ngModel.$viewChangeListeners.push(function() {
                        scope.$eval(attrs.ngChange);
                    });
                };
                function destroy(instance){
                    if (instance && CKEDITOR.instances[instance.name]) {
                        scope.$destroy();
                        CKEDITOR.instances[instance.name].destroy();

                    }
                }

                if (CKEDITOR.status === 'loaded') {
                    loaded = true;
                }

                if (loaded && !scope.loadOnFocus) {
                    onLoad();
                } else {
                    if(!scope.loadOnFocus)
                        $defer.promise.then(onLoad);
                }
                if(scope.loadOnFocus){
                    element.bind('focus',function () {
                        $defer.promise.then(onLoad);
                    })
                }

            }
        };
    }]);

    return app;
}));