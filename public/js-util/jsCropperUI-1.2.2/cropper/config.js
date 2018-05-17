// setup the callback function
		function onEndCrop( coords, dimensions ) {
			if (typeof coords.x1 !== 'undefined'){
			if ($( 'x1' ) !== null){
			$( 'x1' ).value = coords.x1;
			$( 'y1' ).value = coords.y1;
			$( 'x2' ).value = coords.x2;
			$( 'y2' ).value = coords.y2;
			$( 'matchedImagewidth' ).value = dimensions.width;
			$( 'matchedImageheight' ).value = dimensions.height;
			}
			}
		}
		

			function matchedImage() { 
				new Cropper.Img( 
					'matchedImage',
					{
					//minWidth: 50, 
					//minHeight: 25,
						//onloadCoords:[0,0,width,height],
						//ratioDim: { x: 1, y: 1 },
						displayOnInit: true, 
						onEndCrop: onEndCrop,
					}
				);
			}

			function SetmatchedImage(width,height,top,left) { 
				new Cropper.Img( 
					'matchedImage',
					{
						minWidth: width, 
						minHeight: height,
						maxWidth:width,
						maxHeight:height,
						//onloadCoords:[0,0,width,height],
						ratioDim: { x: width, y: height },
						displayOnInit: true, 
						onEndCrop: onEndCrop,
					}
				);
			}