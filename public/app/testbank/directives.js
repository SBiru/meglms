var ckeditor_sets = {
    simple : {
        toolbar : [
            { name: 'document',items: [ 'Source']},
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript'] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-',  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
            { name: 'styles', items: [ 'Font', 'FontSize' ] },
            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
            { name: 'tools', items : [ 'Maximize'] },
            { name: 'insert', items: [ 'Image', 'Flash', 'Table','Video','audio' ] },
            { name: 'mathjax', items: ['Mathjax'] }
       ],
        filebrowserUploadUrl: '/uploadckeditormedia/'
    },
    basic : {
        toolbar : [
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic',  'TextColor'] },
            { name: 'styles', items: [ 'Font', 'FontSize','Underline' ] },
        ],
        filebrowserUploadUrl: '/uploadckeditormedia/'
    }    
};
angular.module('ck', []).directive('ckEditor', function() {
    return {
        require: '?ngModel',
        link: function(scope, elm, attr, ngModel) {

            var ck = CKEDITOR.replace(elm[0],ckeditor_sets[attr.ckEditor]);

            ck.on( 'paste', function( evt ) {
                var data = evt.data;
                data.dataValue = E3replaceUrl(data.dataValue);
                // Text could be pasted, but you transformed it into HTML so update that.
                data.type = 'html';
            });

            if (!ngModel) return;

            ck.on('pasteState', function() {
                scope.$apply(function() {
                    ngModel.$setViewValue(ck.getData());
                });
            });

            ngModel.$render = function(value) {
                ck.setData(ngModel.$viewValue);
            };
        }
    };
});
