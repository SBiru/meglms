/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The "div" plugin. It wraps the selected block level elements with a 'div' element with specified styles and attributes.
 *
 */

( function() {
	CKEDITOR.plugins.add( 'scottsdiv', {
		requires: 'dialog',
		lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		icons: 'CreateScottsDiv', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			if ( editor.blockless )
				return;

			var lang = editor.lang.scottsdiv,
				allowed = 'scottsdiv(*)';

			if ( CKEDITOR.dialog.isTabEnabled( editor, 'editdiv', 'advanced' ) )
				allowed += ';scottsdiv[dir,id,lang,title]{*}';

			editor.addCommand( 'CreateScottsDiv', new CKEDITOR.dialogCommand( 'CreateScottsDiv', {
				allowedContent: allowed,
				requiredContent: 'scottsdiv',
				contextSensitive: true,
				refresh: function( editor, path ) {
					var context = editor.config.div_wrapTable ? path.root : path.blockLimit;
					this.setState( 'scottsdiv' in context.getDtd() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );
				}
			} ) );

			editor.addCommand( 'editdiv', new CKEDITOR.dialogCommand( 'editdiv', { requiredContent: 'scottsdiv' } ) );
			editor.addCommand( 'removediv', {
				requiredContent: 'scottsdiv',
				exec: function( editor ) {
					var selection = editor.getSelection(),
						ranges = selection && selection.getRanges(),
						range,
						bookmarks = selection.createBookmarks(),
						walker,
						toRemove = [];

					function findDiv( node ) {
						var scottsdiv = CKEDITOR.plugins.scottsdiv.getSurroundDiv( editor, node );
						if ( scottsdiv && !scottsdiv.data( 'cke-scottsdiv-added' ) ) {
							toRemove.push( scottsdiv );
							scottsdiv.data( 'cke-scottsdiv-added' );
						}
					}

					for ( var i = 0; i < ranges.length; i++ ) {
						range = ranges[ i ];
						if ( range.collapsed )
							findDiv( selection.getStartElement() );
						else {
							walker = new CKEDITOR.dom.walker( range );
							walker.evaluator = findDiv;
							walker.lastForward();
						}
					}

					for ( i = 0; i < toRemove.length; i++ )
						toRemove[ i ].remove( true );

					selection.selectBookmarks( bookmarks );
				}
			} );

			editor.ui.addButton && editor.ui.addButton( 'CreateScottsDiv', {
				label: "Scott Great Div Creator",
				command: 'CreateScottsDiv',
				toolbar: 'insert,11'
			} );

			if ( editor.addMenuItems ) {
				editor.addMenuItems( {
					editdiv: {
						label: lang.edit,
						command: 'editdiv',
						group: 'scottsdiv',
						order: 1
					},

					removediv: {
						label: lang.remove,
						command: 'removediv',
						group: 'scottsdiv',
						order: 5
					}
				} );

				if ( editor.contextMenu ) {
					editor.contextMenu.addListener( function( element ) {
						if ( !element || element.isReadOnly() )
							return null;


						if ( CKEDITOR.plugins.scottsdiv.getSurroundDiv( editor ) ) {
							return {
								editdiv: CKEDITOR.TRISTATE_OFF,
								removediv: CKEDITOR.TRISTATE_OFF
							};
						}

						return null;
					} );
				}
			}

			CKEDITOR.dialog.add( 'CreateScottsDiv', this.path + 'dialogs/div.js' );
			CKEDITOR.dialog.add( 'editdiv', this.path + 'dialogs/div.js' );
		}
	} );

	CKEDITOR.plugins.scottsdiv = {
		getSurroundDiv: function( editor, start ) {
			var path = editor.elementPath( start );
			return editor.elementPath( path.blockLimit ).contains( function( node ) {
				// Avoid read-only (i.e. contenteditable="false") divs (#11083).
				return node.is( 'scottsdiv' ) && !node.isReadOnly();
			}, 1 );
		}
	};
} )();
