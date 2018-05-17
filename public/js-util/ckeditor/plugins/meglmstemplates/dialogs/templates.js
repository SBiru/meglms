/*
Developed and Modified by Golabs for English 3
*/
var runhtmltemplate = function () {

    CKEDITOR.dialog.add('meglmstemplates', function (editor) {

        // Constructs the HTML view of the specified templates data.
        function renderTemplatesList(container, templatesDefinitions) {
            // clear loading wait text.
            container.setHtml('');
            //container.append(createAddButton());

            for (var i = 0, totalDefs = templatesDefinitions.length; i < totalDefs; i++) {
                var definition = CKEDITOR.getTemplates(templatesDefinitions[i]),
                    //imagesPath = definition.imagesPath,
                    //templates = definition.templates,
                    count = definition.templates.length;

                for (var j = 0; j < count; j++) {
                    var template = definition.templates[j],
                        item = createTemplateItem(template, '');
                    item.setAttribute('aria-posinset', j + 1);
                    item.setAttribute('aria-setsize', count);
                    container.append(item);
                }
            }
        }

        function createTemplateItem(template, imagesPath) {
            var child = {}
            var item = CKEDITOR.dom.element.createFromHtml('<div class="cke_meglms_contentDiv" tabIndex="-1" role="option" >' +
                '<div class="cke_tpl_item"></div>' +
                '<div class="cke_tpl_prev">' +
                '<button type="button" class="btn btn-success btn-sm cke_buttonsMeglms" title="Insert ' + template.title + '"><span style="color:white" class="glyphicon glyphicon-collapse-down" aria-hidden="true"></span></button>' +
                '<button type="button" class="btn btn-warning btn-sm cke_buttonsMeglms" title="Preview ' + template.title + '"><span style="color:white" class="glyphicon glyphicon-new-window" aria-hidden="true"></span></button>' +
                '<button type="button" class="btn btn-sm btn-primary cke_buttonsMeglms" title="Edit ' + template.title + '"><span style="color:white" class="glyphicon glyphicon-edit" aria-hidden="true"></span></button>' +
                '<button type="button" class="btn btn-danger btn-sm cke_buttonsMeglms" title="Remove ' + template.title + '"><span style="color:white" class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>' +
                '</div>' +
                '</div>');

            // Build the inner HTML of our new item DIV.
            var html = '<table style="width:100%;" class="cke_tpl_preview" role="presentation"><tr>';
            /*    
            if (template.image && imagesPath) {
                html += '<td class="cke_tpl_preview_img"><img src="' +
                    CKEDITOR.getUrl(imagesPath + template.image) + '"' +
                    (CKEDITOR.env.ie6Compat ? ' onload="this.width=this.width"' : '') + ' alt="" title=""></td>';
            }
            */
            html += '<td style="white-space:normal;"><span class="cke_tpl_title">' + template.title + '</span><br/>';

            if (template.description)
                html += '<span>' + template.description + '</span>';

            html += '</td></tr></table>';

            item.getFirst().setHtml(html);

            child = item.getChild(1)

            //Insert    
            child.getChild(0).on('click', function () {
                insertTemplate(template.html);
            });

            //Preview    
            child.getChild(1).on('click', function () {
                viewTemplate(template.html, template.title);
            });

            //Edit    
            child.getChild(2).on('click', function () {
                AddEditTemplate(template);
            });

            //Delete
            child.getChild(3).on('click', function () {
                if (confirm("Confirm Deletion of " + template.title)) {
                     $('.cke_tpl_list').parent().fadeOut("slow", function () {});
                    removeTemplate(template.id);
                }
            });

            return item;
        }

        // Insert the specified template content into editor.
        // @param {Number} index
        function insertTemplate(html) {
            var dialog = CKEDITOR.dialog.getCurrent(),
                isReplace = dialog.getValueOf('selectTpl', 'chkInsertOpt');

            if (isReplace) {
                editor.fire('saveSnapshot');
                // Everything should happen after the document is loaded (#4073).
                editor.setData(html, function () {
                    dialog.hide();

                    // Place the cursor at the first editable place.
                    var range = editor.createRange();
                    range.moveToElementEditStart(editor.editable());
                    range.select();
                    setTimeout(function () {
                        editor.fire('saveSnapshot');
                    }, 0);

                });
            } else {
                editor.insertHtml(html);
                dialog.hide();
            }
        }

        function viewTemplate(html, title) {
            $('#cke_TemplateTr').css('display', 'none');
            $('.cke_htmltemplateContent').html(html);
            $('.cke_dialog_contents_body').parent().fadeOut("slow", function () {
                $('#cke_TemplateTr').fadeIn("slow", function () {
                    $('.cke_dialog_close_button').css('display', 'none');
                    $('.cke_dialog_close_button2').css('display', '');
                    $('.cke_dialog_title').html(title + ' Preview');
                });
            });
        }

        function addTemplateHtml(template) {

            if (typeof template !== "object") {
                template = {
                    'description': '',
                    'html': '',
                    'id': '',
                    'orgid': '',
                    'title': '',
                    'buttonText': 'Add',
                    'buttonTarget': 'addhtmltemplate'
                }
            } else {
                template.buttonTarget = 'edithtmltemplate';
                template.buttonText = 'Update';
            }

            var item = '<div id="cke_meglms_AddtitleDiv" class="cke_meglms_AddtitleDiv"><textarea  placeholder="Add Title">' + template.title + '</textarea></div>' +
                '<div id="cke_meglms_AdddescriptionDiv"class="cke_meglms_AdddescriptionDiv"><textarea  placeholder="Add Description">' + template.description + '</textarea></div>' +
                '<div id="cke_meglms_AddcontentDiv"class="cke_meglms_AddcontentDiv"><textarea placeholder="Add html">' + template.html + '</textarea><input type="hidden" name="cke_meglms_AddcontentID" id="cke_meglms_AddcontentID" value="' + template.id + '"></div>' +
                '<div style="width:100%;width:100%;text-align: center;margin-top: 2%"><button class="btn btn-primary" type="button" onclick="cke_meglmsUploadTemplate(\'' + template.buttonTarget + '\')">' + template.buttonText + ' Template.</button></div>';
            return item;
        }

        function AddEditTemplate(template) {
            $('#cke_TemplateTr').css('display', 'none');
            var tmpHtml = addTemplateHtml(template)
            $('.cke_htmltemplateContent').html(tmpHtml);
            $('.cke_dialog_contents_body').parent().fadeOut("slow", function () {
                $('#cke_TemplateTr').fadeIn("slow", function () {
                    $('.cke_dialog_close_button').css('display', 'none');
                    $('.cke_dialog_close_button2').css('display', '');
                    $('.cke_dialog_title').html('Add details and paste new template.');
                });
            });
        }

        var loadtemplatesnow = function (that) {
            globalobject = that;
            var templatesListField = that.getContentElement('selectTpl', 'templatesList');
            listContainer = templatesListField.getElement();

            CKEDITOR.loadTemplates(config.meglmstemplates_files, function () {
                var templates = (config.templates || 'default').split(',');

                if (templates.length) {
                    renderTemplatesList(listContainer, templates);
                    templatesListField.focus();
                } else {
                    listContainer.setHtml('<div class="cke_tpl_empty">' +
                        '<span>' + lang.emptyListMsg + '</span>' +
                        '</div>');
                }
            });

            that._.element.on('keydown', keyNavigation);

            //Creating our hidden tr for previews.........
            var height = $('.cke_dialog_contents_body').css('height');
            var width = $('.cke_dialog_contents_body').css('width');
            $('.cke_dialog_contents_body').parent().before('<tr id="cke_TemplateTr" style="display:none"><td style="height:' + height + ';width:' + width + ';">' +
                '<div class="cke_htmltemplateContent">' +
                +
                '</div>' +
                '</td></tr>');

            $('.cke_dialog_close_button').parent().before('<a onclick="cke_resethtmltemplate()" class="cke_dialog_close_button2" title="Close" role="button" style="-webkit-user-select: none;display:none;right:5px;top:4px"></a>');

        }

        function keyNavigation(evt) {
            var target = evt.data.getTarget(),
                onList = listContainer.equals(target);

            // Keyboard navigation for template list.
            if (onList || listContainer.contains(target)) {
                var keystroke = evt.data.getKeystroke(),
                    items = listContainer.getElementsByTag('a'),
                    focusItem;

                if (items) {
                    // Focus not yet onto list items?
                    if (onList)
                        focusItem = items.getItem(0);
                    else {
                        switch (keystroke) {
                        case 40: // ARROW-DOWN
                            focusItem = target.getNext();
                            break;

                        case 38: // ARROW-UP
                            focusItem = target.getPrevious();
                            break;

                        case 13: // ENTER
                        case 32: // SPACE
                            target.fire('click');
                        }
                    }

                    if (focusItem) {
                        focusItem.focus();
                        evt.data.preventDefault();
                    }
                }
            }
        }

        function removeTemplate(id) {
            cke_meglmsDeleteTemplate(id);
        }

        function cke_meglmsDeleteTemplate(id) {
            $.get(cke_meglms_target_url('') + 'deletehtmltemplates/' + id, function (id, status) {
                cke_resethtmltemplate();
                cke_meglmsGetTemplates();
            })
        }

        function checkforchange() {
                if (CKEDITOR.templateData === 1) {
                    loadtemplatesnow(globalobject);
                    CKEDITOR.templateData = 0;
                     $('.cke_tpl_list').parent().fadeIn("slow", function () {});
                }
            }
            // Load skin at first.
        var plugin = CKEDITOR.plugins.get('meglmstemplates');
        CKEDITOR.document.appendStyleSheet(CKEDITOR.getUrl(plugin.path + 'dialogs/templates.css'));

        var listContainer;

        var templateListLabelId = 'cke_tpl_list_label_' + CKEDITOR.tools.getNextNumber(),
            lang = editor.lang.templates,
            config = editor.config,
            innerHeight = parseInt(parseInt($('body').css('height')) * .8),
            innerWidth = parseInt(window.innerWidth * .95);
        return {
            title: editor.lang.templates.title,

            minWidth: CKEDITOR.env.ie ? innerWidth : innerWidth,
            minHeight: innerHeight,

            contents: [{
                id: 'selectTpl',
                label: lang.title,
                elements: [{
                    type: 'vbox',
                    padding: 5,
                    children: [{
                            id: 'selectTplText',
                            type: 'html',
                            html: '<span>' +
                                lang.selectPromptMsg +
                                '</span>'
                        }, {
                            type: 'button',
                            id: 'buttonId',
                            label: 'Add Template',
                            title: 'Add Template',
                            onClick: function () {
                                // this = CKEDITOR.ui.dialog.button
                                AddEditTemplate('');
                            }
                        },

                        {
                            id: 'templatesList',
                            type: 'html',
                            focus: true,
                            html: '<div class="cke_tpl_list" tabIndex="-1" role="listbox" aria-labelledby="' + templateListLabelId + '">' +
                                '<div class="cke_tpl_loading"><span></span></div>' +
                                '</div>' +
                                '<span class="cke_voice_label" id="' + templateListLabelId + '">' + lang.options + '</span>'
                        },

                        {
                            id: 'chkInsertOpt',
                            type: 'checkbox',
                            label: lang.insertOption,
                            'default': config.templates_replaceContent
                        }
                    ]
                }]
            }],

            buttons: [],

            onShow: function () {
                loadtemplatesnow(this);
                CKEDITOR.eventTimer = setInterval(function () {
                    checkforchange()
                }, 1000);
            },

            onHide: function () {
                clearTimeout(CKEDITOR.eventTimer);
                this._.element.removeListener('keydown', keyNavigation);
                $('#cke_TemplateTr').css('display', 'none');
                $('.cke_dialog_contents_body').parent().css('display', '');
                $('.cke_dialog_title').html('Select or add templates');
            }
        };

    });
};
runhtmltemplate();