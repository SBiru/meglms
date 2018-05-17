/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var audioDialog = function( editor, dialogType ) {
		var audioUrl = '';
		return {
			title: editor.lang.audio[ dialogType == 'audio' ? 'title' : 'titleButton' ],
			minWidth: 420,
			minHeight: 360,
			onOk: function() {
				editor.insertElement(CKEDITOR.dom.element.createFromHtml( '<audio controls><source src="' + audioUrl + '" type="audio/mp4">Your browser does not support the HTML5 audio tag.</audio>', editor.document ));
				this.hide()
			},
			onShow: function(){
				this.getContentElement('Upload','uploadButton').getElement().hide();
			},
			contents: [{
					id: 'Upload',
					hidden: false,
					filebrowser: 'uploadButton',
					label: editor.lang.audio.upload,
					elements: [
						{
						type: 'file',
						id: 'upload',
						action:'uploadimage.php',
						label: editor.lang.audio.btnUpload,
						style: 'height:40px',
						size: 38
					},{
						type: 'fileButton',
						id: 'uploadButton',
						filebrowser: 'info:txtUrl',
						label: editor.lang.audio.btnUpload,
						'for': [ 'Upload', 'upload' ]
					}]
				},{
				id: 'info',
				label: editor.lang.audio.infoTab,
				accessKey: 'I',
				hidden:true,
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
								audioUrl = this.getValue();
								this.getDialog().fire('ok');
							},
							setup: function( type, element ) {

							},
							commit: function( type, element ) {

							},
							validate: CKEDITOR.dialog.validate.notEmpty( editor.lang.audio.urlMissing )
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

	CKEDITOR.dialog.add( 'audio', function( editor ) {
		return audioDialog( editor, 'audio' );
	} );
	
} )();
