/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */
(function () {
    CKEDITOR.plugins.add('meglmstemplates', {
        requires: 'dialog',
        // jscs:disable maximumLineLength
        lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        // jscs:enable maximumLineLength
        icons: 'meglmstemplates,meglmstemplates-rtl', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%
        init: function (editor) {
            CKEDITOR.dialog.add('meglmstemplates', CKEDITOR.getUrl(this.path + 'dialogs/templates.js'));

            editor.addCommand('meglmstemplates', new CKEDITOR.dialogCommand('meglmstemplates'));

            editor.ui.addButton && editor.ui.addButton('Meglmstemplates', {
                label: editor.lang.templates.button,
                command: 'meglmstemplates',
                toolbar: 'doctools,10'
            });
        }
    });

    var templates = {},
        loadedTemplatesFiles = {},
        htmltemplates = {},
        globalobject = {};
    CKEDITOR.templateData = 0

    CKEDITOR.addTemplates = function (name, definition) {
        templates[name] = definition;
        CKEDITOR.templateData = 1;
    };

    CKEDITOR.removeTemplates = function (name, id) {
        var tmp = [];
        for (var i = 0; i < templates[name].templates.length; i++) {
            if (parseInt(templates[name].templates[i].id) !== id) {
                tmp.push(templates[name].templates[i]);
            }
        }
        templates[name].templates = tmp;
        //loadtemplatesnow(globalobject);
    };

    CKEDITOR.getTemplates = function (name) {
        return templates[name];
    };

    CKEDITOR.loadTemplates = function (templateFiles, callback) {
        // Holds the templates files to be loaded.
        var toLoad = [];

        // Look for pending template files to get loaded.
        for (var i = 0, count = templateFiles.length; i < count; i++) {
            if (!loadedTemplatesFiles[templateFiles[i]]) {
                toLoad.push(templateFiles[i]);
                loadedTemplatesFiles[templateFiles[i]] = 1;
            }
        }

        if (toLoad.length)
            CKEDITOR.scriptLoader.load(toLoad, callback);
        else
            setTimeout(callback, 0);
    };
})();

/**
 * The templates definition set to use. It accepts a list of names separated by
 * comma. It must match definitions loaded with the {@link #templates_files} setting.
 *
 *		config.templates = 'my_templates';
 *
 * @cfg {String} [templates='default']
 * @member CKEDITOR.config
 */

/**
 * The list of templates definition files to load.
 *
 *		config.templates_files = [
 *			'/editor_templates/site_default.js',
 *			'http://www.example.com/user_templates.js
 *		];
 *
 * @cfg
 * @member CKEDITOR.config
 */

CKEDITOR.config.meglmstemplates_files = [
    CKEDITOR.getUrl('plugins/meglmstemplates/templates/default.js')
];


cke_meglmsGetTemplates();

/**
 * Whether the "Replace actual contents" checkbox is checked by default in the
 * Templates dialog.
 *
 *		config.templates_replaceContent = false;
 *
 * @cfg
 * @member CKEDITOR.config
 */
CKEDITOR.config.templates_replaceContent = true;

function cke_resethtmltemplate() {
    $('.cke_dialog_close_button').css('display', '');
    $('.cke_dialog_close_button2').css('display', 'none');
    $('.cke_dialog_title').html('Select or add templates');
    $('#cke_TemplateTr').fadeOut("slow", function () {
        $('.cke_dialog_contents_body').parent().fadeIn("slow", function () {});
    });
}

function cke_meglms_target_url(name) {
    if (name === 'edithtmltemplates') {
        ext = 'target';
    } else {
        ext = 'id';
    }
    return '../htmltemplate/' + ext + '='
}

function cke_meglmsGetTemplates() {
    if (window.location.href.match(/\/editor\//)){
 

    if (typeof $.get !== "undefined"){
    $.get(cke_meglms_target_url('') + 'gethtmltemplates', function (data, status) {
        htmltemplates = data;
        CKEDITOR.addTemplates('default', htmltemplates);
    })
    }
    }
}

function cke_meglmsUploadTemplate(name) {
    var data = {
        'title': $('#cke_meglms_AddtitleDiv textarea').val(),
        'description': $('#cke_meglms_AdddescriptionDiv textarea').val(),
        'html': $('#cke_meglms_AddcontentDiv textarea').val(),
        'id': $('#cke_meglms_AddcontentID').val()
    }

    $.ajax({
        type: 'POST',
        url: cke_meglms_target_url(name) + name,
        data: JSON.stringify(data),
        success: function (data) {
            console.log(data.status);
            cke_resethtmltemplate();
            cke_meglmsGetTemplates();
        },
        contentType: "application/json",
        dataType: 'json'
    });
}