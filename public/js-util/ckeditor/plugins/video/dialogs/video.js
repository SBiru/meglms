/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var videoDialog = function( editor, dialogType ) {
		var videoUrl = '';
		var selectedFiles;
		return {
			title: editor.lang.video[ dialogType == 'video' ? 'title' : 'titleButton' ],
			minWidth: 420,
			minHeight: 360,
			onOk: function() {


			},
			onShow: function(){
				this.getContentElement('Upload','uploadButton').getElement().hide();
			},
			contents: [
				{
					id: 'Upload',
					hidden: false,
					filebrowser: 'uploadButton',
					label: editor.lang.video.upload,
					elements: [
						{
							type: 'file',
							id: 'upload',
							onChange: function(){
								var el = this.getInputElement();
								if(el){
									selectedFiles = el.$.files;
								}
							},
							/*action:'uploadimage.php',*/
							label: editor.lang.video.btnUpload,
							style: 'height:40px',
							size: 38
						},{
							type: 'fileButton',
							id: 'uploadButton',
							hidden:true,
							filebrowser: 'info:txtUrl',
							label: editor.lang.video.btnUpload,
							'for': [ 'Upload', 'upload' ]
						}]
				},
				{
					id: 'info',
					label: editor.lang.video.infoTab,
					hidden: true,
					accessKey: 'I',
					elements: [{
							type: 'vbox',
							padding: 0,
							children: [{
									type: 'hbox',
									widths: [ '280px', '110px' ],
									align: 'right',
									children: [{
										id: 'txtUrl',
										type: 'text',
										label: editor.lang.common.url,
										required: true,
										onChange: function() {
											videoUrl = this.getValue();
											editor.insertElement(CKEDITOR.dom.element.createFromHtml( '<video width="320" height="240" controls><source src="' + videoUrl + '" type="video/mp4">Your browser does not support the HTML5 video tag.</video>', editor.document ));
											this.getDialog().hide();
										},
										setup: function( type, element ) {

										},
										commit: function( type, element ) {

										},
										validate: CKEDITOR.dialog.validate.notEmpty( editor.lang.video.urlMissing )
									}]
							}]
					}]
				}],
			buttons: [

				CKEDITOR.dialog.cancelButton,

				{
					id: 'custonOk',
					type: 'button',
					label: 'Ok',
					title: 'Send file to server',
					accessKey: 'C',
					'class': 'cke_dialog_ui_button_ok',
					disabled: false,
					onClick: function()
					{
						this.getDialog().getContentElement('Upload','uploadButton').getElement().$.click();
					}
				}
			]
		};
	};

	CKEDITOR.dialog.add( 'video', function( editor ) {
		return videoDialog( editor, 'video' );
	} );
	
} )();
