/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview audio plugin
 */

( function() {

	CKEDITOR.plugins.add( 'audio', {
		requires: 'dialog',
		lang: 'en', // %REMOVE_LINE_CORE%
		icons: 'audio', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var pluginName = 'audio';

			// Register the dialog.
			CKEDITOR.dialog.add( pluginName, this.path + 'dialogs/audio.js' );

			var allowed = 'audio[alt,controls]{border-style,border-width,float,height,margin,margin-bottom,margin-left,margin-right,margin-top,width}' + ';source[src]',
				required = 'audio[alt,controls]' + ';source[src]';

			if ( CKEDITOR.dialog.isTabEnabled( editor, pluginName, 'advanced' ) )
				allowed = 'audio[alt,dir,id,lang,longdesc,title,controls]{*}(*)' + ';source[src]';

			// Register the command.
			editor.addCommand( pluginName, new CKEDITOR.dialogCommand( pluginName, {
				allowedContent: allowed,
				requiredContent: required,
				contentTransformations: [
					[ 'audio{width}: sizeToStyle', 'audio[width]: sizeToAttribute' ],
					[ 'audio{float}: alignmentToStyle', 'audio[align]: alignmentToAttribute' ]
				]
			} ) );

			// Register the toolbar button.
			editor.ui.addButton && editor.ui.addButton( 'audio', {
				label: /*editor.lang.common.audio*/ 'audio',
				command: pluginName,
				toolbar: 'insert,100'
			} );

			editor.on( 'doubleclick', function( evt ) {
				var element = evt.data.element;

				if ( element.is( 'audio' ) && !element.data( 'cke-realelement' ) && !element.isReadOnly() )
					evt.data.dialog = 'audio';
			} );

			// If the "menu" plugin is loaded, register the menu items.
			if ( editor.addMenuItems ) {
				editor.addMenuItems( {
					audio: {
						label: editor.lang.audio.menu,
						command: 'audio',
						group: 'audio'
					}
				} );
			}

			// If the "contextmenu" plugin is loaded, register the listeners.
			if ( editor.contextMenu ) {
				editor.contextMenu.addListener( function( element, selection ) {
					if ( getSelectedaudio( editor, element ) )
						return { audio: CKEDITOR.TRISTATE_OFF };
				} );
			}
		},
		afterInit: function( editor ) {
			// Abort when audio2 is to be loaded since both plugins
			// share the same button, command, etc. names (#11222).
			if ( editor.plugins.audio2 )
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
							var audio = getSelectedaudio( editor ),
								align;
							if ( audio ) {
								align = getaudioAlignment( audio );
								if ( align == value ) {
									audio.removeStyle( 'float' );

									// Remove "align" attribute when necessary.
									if ( value == getaudioAlignment( audio ) )
										audio.removeAttribute( 'align' );
								} else
									audio.setStyle( 'float', value );

								evt.cancel();
							}
						} );
					}

					command.on( 'refresh', function( evt ) {
						var audio = getSelectedaudio( editor ),
							align;
						if ( audio ) {
							align = getaudioAlignment( audio );

							this.setState(
							( align == value ) ? CKEDITOR.TRISTATE_ON : ( value == 'right' || value == 'left' ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );

							evt.cancel();
						}
					} );
				}
			}
		}
	} );

	function getSelectedaudio( editor, element ) {
		if ( !element ) {
			var sel = editor.getSelection();
			element = sel.getSelectedElement();
		}

		if ( element && element.is( 'audio' ) && !element.data( 'cke-realelement' ) && !element.isReadOnly() )
			return element;
	}

	function getaudioAlignment( element ) {
		var align = element.getStyle( 'float' );

		if ( align == 'inherit' || align == 'none' )
			align = 0;

		if ( !align )
			align = element.getAttribute( 'align' );

		return align;
	}

} )();

/**
 * Whether to remove links when emptying the link URL field in the audio dialog.
 *
 *		config.audio_removeLinkByEmptyURL = false;
 *
 * @cfg {Boolean} [audio_removeLinkByEmptyURL=true]
 * @member CKEDITOR.config
 */
CKEDITOR.config.audio_removeLinkByEmptyURL = true;

/**
 * Padding text to set off the audio in preview area.
 *
 *		config.audio_previewText = CKEDITOR.tools.repeat( '___ ', 100 );
 *
 * @cfg {String} [audio_previewText='Lorem ipsum dolor...' (placeholder text)]
 * @member CKEDITOR.config
 */
