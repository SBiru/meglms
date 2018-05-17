/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Video plugin
 */

( function() {

	CKEDITOR.plugins.add( 'video', {
		requires: 'dialog',
		lang: 'en', // %REMOVE_LINE_CORE%
		icons: 'video', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var pluginName = 'video';

			// Register the dialog.
			CKEDITOR.dialog.add( pluginName, this.path + 'dialogs/video.js' );

			var allowed = 'video[alt,controls]{border-style,border-width,float,height,margin,margin-bottom,margin-left,margin-right,margin-top,width}' + ';source[src]',
				required = 'video[alt,controls]' + ';source[src]';

			if ( CKEDITOR.dialog.isTabEnabled( editor, pluginName, 'advanced' ) )
				allowed = 'video[alt,dir,id,lang,longdesc,title,controls]{*}(*)' + ';source[src]';

			// Register the command.
			editor.addCommand( pluginName, new CKEDITOR.dialogCommand( pluginName, {
				allowedContent: allowed,
				requiredContent: required,
				contentTransformations: [
					[ 'video{width}: sizeToStyle', 'video[width]: sizeToAttribute' ],
					[ 'video{float}: alignmentToStyle', 'video[align]: alignmentToAttribute' ]
				]
			} ) );

			// Register the toolbar button.
			editor.ui.addButton && editor.ui.addButton( 'Video', {
				label: /*editor.lang.common.video*/ 'Video',
				command: pluginName,
				toolbar: 'insert,100'
			} );

			editor.on( 'doubleclick', function( evt ) {
				var element = evt.data.element;

				if ( element.is( 'video' ) && !element.data( 'cke-realelement' ) && !element.isReadOnly() )
					evt.data.dialog = 'video';
			} );

			// If the "menu" plugin is loaded, register the menu items.
			if ( editor.addMenuItems ) {
				editor.addMenuItems( {
					video: {
						label: editor.lang.video.menu,
						command: 'video',
						group: 'video'
					}
				} );
			}

			// If the "contextmenu" plugin is loaded, register the listeners.
			if ( editor.contextMenu ) {
				editor.contextMenu.addListener( function( element, selection ) {
					if ( getSelectedVideo( editor, element ) )
						return { video: CKEDITOR.TRISTATE_OFF };
				} );
			}
		},
		afterInit: function( editor ) {
			// Abort when Video2 is to be loaded since both plugins
			// share the same button, command, etc. names (#11222).
			if ( editor.plugins.video2 )
				return;

			// Customize the behavior of the alignment commands. (#7430)
			setupAlignCommand( 'left' );
			setupAlignCommand( 'right' );
			setupAlignCommand( 'center' );
			setupAlignCommand( 'block' );

			function setupAlignCommand( value ) {
				var command = editor.getCommand( 'justify' + value );
				if ( command ) {
					if ( value == 'left' || value == 'right' ) {
						command.on( 'exec', function( evt ) {
							var video = getSelectedVideo( editor ),
								align;
							if ( video ) {
								align = getVideoAlignment( video );
								if ( align == value ) {
									video.removeStyle( 'float' );

									// Remove "align" attribute when necessary.
									if ( value == getVideoAlignment( video ) )
										video.removeAttribute( 'align' );
								} else
									video.setStyle( 'float', value );

								evt.cancel();
							}
						} );
					}

					command.on( 'refresh', function( evt ) {
						var video = getSelectedVideo( editor ),
							align;
						if ( video ) {
							align = getVideoAlignment( video );

							this.setState(
							( align == value ) ? CKEDITOR.TRISTATE_ON : ( value == 'right' || value == 'left' ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );

							evt.cancel();
						}
					} );
				}
			}
		}
	} );

	function getSelectedVideo( editor, element ) {
		if ( !element ) {
			var sel = editor.getSelection();
			element = sel.getSelectedElement();
		}

		if ( element && element.is( 'video' ) && !element.data( 'cke-realelement' ) && !element.isReadOnly() )
			return element;
	}

	function getVideoAlignment( element ) {
		var align = element.getStyle( 'float' );

		if ( align == 'inherit' || align == 'none' )
			align = 0;

		if ( !align )
			align = element.getAttribute( 'align' );

		return align;
	}

} )();

/**
 * Whether to remove links when emptying the link URL field in the video dialog.
 *
 *		config.video_removeLinkByEmptyURL = false;
 *
 * @cfg {Boolean} [video_removeLinkByEmptyURL=true]
 * @member CKEDITOR.config
 */
CKEDITOR.config.video_removeLinkByEmptyURL = true;

/**
 * Padding text to set off the video in preview area.
 *
 *		config.video_previewText = CKEDITOR.tools.repeat( '___ ', 100 );
 *
 * @cfg {String} [video_previewText='Lorem ipsum dolor...' (placeholder text)]
 * @member CKEDITOR.config
 */
