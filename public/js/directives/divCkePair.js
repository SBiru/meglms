angular.module('app')
    .directive("divCkePair", function () {
        return {
            link: function (scope, element, attributes) {
                CKEDITOR.config.allowedContent = true;
                CKEDITOR.config.disableNativeSpellChecker = false;

                element.on("focus",function() {
                    var ck = CKEDITOR.replace(this, {
                        toolbar: [
                            { name: 'Meglmstemplates', items: ['Meglmstemplates'] },
                            { name: 'mathjax', items: ['Mathjax'] },
                            { name: 'document', items: ['Source'] },
                            { name: 'basicstyles', groups: ['basicstyles', 'cleanup'], items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat', 'Smiley'] },
                            { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'], items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'CreateDiv', 'JustifyBlock'] },
                            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                            { name: 'colors', items: ['TextColor', 'BGColor'] },
                            { name: 'tools', items: ['Maximize'] },
                            { name: 'insert', items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'SpecialChar', 'PageBreak', 'Iframe', 'Video', 'audio'] },
                            { name: 'links', items: ['Link', 'Unlink'] }

                        ],
                        filebrowserUploadUrl: '/uploadckeditormedia/',
                        extraPlugins: 'mathjax',
                        startupFocus: true
                    });
                    ck.on( 'paste', function( evt ) {
                        var data = evt.data;

                        data.dataValue = E3replaceUrl(data.dataValue);
                        data.type = 'html';
                    });
                    var that = this;
                    ck.on("blur",function() {
                        //For dialog windows(image, video, audio) reload the ckeditor.
                        var dialogWindow = CKEDITOR.dialog.getCurrent();
                        if(dialogWindow) {
                            console.log(element.context.nextSibling);
                            dialogWindow.on('hide',function() {
                               //to reload the ckeditor after the 'hide' event of dialogWindow
                               setTimeout(function () {
                                    if(ck.getCommand('maximize').state  == 1)   //if the ckeditor is maximized
                                    {
                                        var parent = dialogWindow.getParentEditor();
                                        parent.focus();
                                    }else {
                                        var ckcontent = ck.getData().replace(/\n/g, '');
                                        that.innerHTML = ckcontent;
                                        $(that).change();
                                        ck.destroy();
                                        element.focus();
                                    }
                               }, 100);
                            });
                        }
                        //For other then dialog windows(image, video, audio)
                        else {
                            var ckcontent = ck.getData().replace(/\n/g, '');
                            that.innerHTML = ckcontent;
                            $(that).change();
                            ck.destroy();
                        }
                    });
                });
            }
        }
    });