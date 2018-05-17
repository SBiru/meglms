angular.module('app')
    .directive("fileread", function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var prev;
                    if(attributes.useSpinner) {
                        prev = $(this).prev();
                        prev.html('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>');
                    }

                    var form_data = new FormData();
                    form_data.append('file',changeEvent.target.files[0]);
                    form_data.append('altFolder','coursecontent');

                    /*
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    }
                    reader.readAsDataURL(changeEvent.target.files[0]);
                    */

                    var target = attributes.fileread;
                    var action;
                    if(target.indexOf("img") > -1) {
                        action = "image";
                    }

                    $.ajax({
                        url:"/upload/"+action,
                        method:"POST",
                        contentType: false,
                        processData: false,
                        data: form_data
                    }).done(function(data) {
                        scope.$apply(function () {
                            scope.fileread = data.destination_file;
                        });
                        if(attributes.useSpinner) {
                            prev.html('click to add an image');
                        }
                    });
                });
            }
        }
    });