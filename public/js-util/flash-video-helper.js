var videoFlushed = false;
var camChecked = true;
//setTimeout(checkWebcam)

function checkWebcam(){
	if(camChecked) return;
	navigator.noCamAvailable = true
	$("#webcamChecker").webcam({
		swffile: "/public/flash/jscam.swf",
		onLoad: function(){
			if(webcam.getCameraList().length == 0){
				navigator.noCa
				mAvailable = true
			}else{
				delete navigator.noCamAvailable
			}
			$("#webcamChecker").remove();

		}
	})
	camChecked = true;
}


function hasFlashEnabled() {
    var hasFlash = false;
    try {
        var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
  
        if (fo) {
            hasFlash = true;
        }
    } catch (e) {
        if (navigator.mimeTypes
            && navigator.mimeTypes['application/x-shockwave-flash'] != undefined
            && navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
            hasFlash = true;
        }
    }

    return hasFlash;
}


function isFlashEnabled()
{
    var hasFlash = false;
    try
    {
        var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        if(fo) hasFlash = true;
    }
    catch(e)
    {
        if(navigator.mimeTypes ["application/x-shockwave-flash"] != undefined) hasFlash = true;
    }
    return hasFlash;
}

function openMegCapture(newvideofile,author,level,thepageid,thepagetitle,responsetoid,textonly,thegroup,thelevel1id,theuserid,siteid,courseid,pageid) {
	$newvideofile=newvideofile;
	$flvfile=newvideofile+".flv";
	$thumb=newvideofile+".jpg";
	$author=author;
	$level=level;
	$siteid = siteid;
	$courseid = courseid;
	$thepageid=thepageid;
	$thepagetitle=thepagetitle;
	$responsetoid=responsetoid;
	$textonly=textonly;
	$thegroup=thegroup;
	$thelevel1id=thelevel1id;
	$theuserid=theuserid;
              
	if ($textonly<1) {
		$html = "<div id='meg_capture_tab1' onclick='view_container(1,2)' class='meg_capture_tab_active'>Record</div><div id='meg_capture_tab2' onclick='view_container(2,2)' class='meg_capture_tab_inactive'>Upload</div><br><br><div id='meg_capture_container1' class='meg_capture_container_active'>";
		$html += "<div style='width:auto; height:auto;'><div id='webcamarea'><object classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' width='380px' height='280px'><param name='movie' value='meg-red-flexible.swf?videofile="+$newvideofile+"&rtmpserver=rtmp://ec2-54-186-123-190.us-west-2.compute.amazonaws.com/vod' /><!--[if !IE]>--><object id='bob' type='application/x-shockwave-flash' data='meg-red-flexible.swf?videofile="+$newvideofile+"&rtmpserver=rtmp://ec2-54-186-123-190.us-west-2.compute.amazonaws.com/vod' width='340px' height='280px'><!--<![endif]--><table style='margin-top:10px'><tr><td width='20px'></td><td><p>Flash object is not working on your browser. If your using a mobile device, click on upload to record your video. If not, then flash has not been set up correctly.</p></td><td width='20px'></td></tr></table><!--[if !IE]>--></object><!--<![endif]--></object></div><br><div id='buttonsarea' align=center><img src='./img/recordbttn.png' id='button' onclick='callAS(bob,$newvideofile)'> &nbsp;&nbsp; <img id='submitted' src='./img/submitbttn.png' onclick='clicksubmit(\""+$newvideofile+"\",\""+$author+"\",\""+$level+"\",\""+$thepageid+"\",\""+$thepagetitle+"\",\""+$responsetoid+"\",\""+$textonly+"\",\""+$thegroup+"\",\""+$thelevel1id+"\",\""+$theuserid+"\",\""+$siteid+"\",\""+$courseid+"\",\""+$thepageid+"\")'/></div><div id='bottompart'> <p align=center>If necessary, add a text comment below. <br>Click submit when you are finished.</p></div></div>";
		$html += "<br><div id='commentsarea' align=center><textarea name='comments' id='comments' cols='35' rows='3'></textarea></div><br></div>";       
		data = $html;

		data+="<div id='meg_capture_container2' class='meg_capture_container_inactive'>";
		data+="<form id='uploadform' method='POST' enctype='multipart/form-data' action='megwrite-generic.php' target='iframe-upload'>";
		data+="<input type=hidden name=author value='"+$author+"'>";
		data+="<input type=hidden name=discid value='"+$thepageid+"'>";
		data+="<input type=hidden name=disctitle value='"+$thepagetitle+"'>";
		data+="<input type=hidden name=level value='"+$level+"'>";
		data+="<input type=hidden name=responsetoid value='"+$responsetoid+"'>";
		data+="<input type=hidden name=comment value='no'>";
		data+="<input type=hidden name=postid value='"+$newvideofile+"'>";
		data+="<input type=hidden name=file value='"+$flvfile+"'>";
		data+="<input type=hidden name=thumbnail value='"+$thumb+"'>";
		data+="<input type=hidden name=group value='"+$thegroup+"'>";
		data+="<input type=hidden name=level1id value='"+$thelevel1id+"'>";
		data+="<input type=hidden name=textonly value='"+$textonly+"'>";
		data+="<input type=hidden name=userid value='"+$theuserid+"'>";
		data+="<input type=hidden name=siteid value='"+$siteid+"'>";
		data+="<input type=hidden name=courseid value='"+$courseid+"'>";
		data+="<input type=hidden name=pageid value='"+$thepageid+"'>";
		data+="<input type=hidden name=uploaded value='yes'>";
		data+="<br><input id='fileupload' type='file' name='myfile'><br><br>Additional Comments if needed: <br><textarea id=note name=note cols=53 style='width:calc(100% - 6px); height:100px'></textarea><br><br><div id='uploadsubmit' style='display:inline-block'><img src='./img/submit-button.png' onclick='plswait()'></div></form>";
		data += "</div>";
	} else {
		$commentshtml = "<div align='center' style='padding:10px;'><textarea name='comments' id='comments' rows='10' style='width: 90%;'></textarea></div>";       
	}
  
	$uploadbutton="<div id='uploadbttn' align='center' style='font: 14px/16px Georgia,\"Times New Roman\",Times,serif;'>Click to upload a video instead of using webcam.<br><img style='margin-top:5px;' src='./img/uploadbttn.png' onclick='upload($author,$thepageid,$thepagetitle,$level,$responsetoid,$newvideofile,$flvfile,$thumb,$thegroup,$thelevel1id,$textonly,$thesubunit,$theuserid)'></div><br>";
	$submitbutton="<div id='submit' align='center'><img id='submitted' src='./img/submit-button.png' onclick='clicksubmit(\""+$newvideofile+"\",\""+$author+"\",\""+$level+"\",\""+$thepageid+"\",\""+$thepagetitle+"\",\""+$responsetoid+"\",\""+$textonly+"\",\""+$thegroup+"\",\""+$thelevel1id+"\",\""+$theuserid+"\",\""+$siteid+"\",\""+$courseid+"\",\""+$thepageid+"\")'/></div>";
         
	if ($textonly < 1) {
		modal.open({content:data, width: 350});
	} else {
		modal.open({content: $commentshtml + $submitbutton});
	}
  
	console.log("testing:" + $author);
  	//e.preventDefault(); 
}

function view_container(int1,int2) {
	for(i=1;i<=int2;i++) {
		document.getElementById('meg_capture_tab'+i).className ='meg_capture_tab_inactive';
	}
  
	document.getElementById('meg_capture_tab'+int1).className = 'meg_capture_tab_active';

	for(j=1;j<=int2;j++) {
		document.getElementById('meg_capture_container'+j).className = 'meg_capture_container_inactive';
	}
	
	document.getElementById('meg_capture_container'+int1).className = 'meg_capture_container_active';
}

var isOpera = !!window.opera || navigator.userAgent.indexOf('Opera') >= 0;
// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
// At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome;                          // Chrome 1+
var isIE = /*@cc_on!@*/false;      

// At least IE6

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};
  
if (isMobile.iOS()) {
  //document.getElementById('collapsearea').onclick = "togglecollapseipad()";
}


function getPosts(discid,userid,istext,isprivate,author,siteid,courseid,pageid){
	$siteid = siteid;
	$courseid = courseid;
	$pageid = pageid;
	$discid = discid;
	$userid = userid;
	$istext = istext;
	$isprivate = isprivate;
	$author = author;
	$.get("meg-generic.php",{discid: $discid, userid: $userid, istext: $istext, isprivate: $isprivate, author: $author, siteid: $siteid, courseid: $courseid, pageid: $pageid })
	.done(function(data) {
		result = jQuery.parseJSON(data);
		document.getElementById('megbox').innerHTML = result.content;
		document.getElementById('time').value = result.mostrecent;
	});
}

//EI capture control
function callWebRTCAS(postid){
	var recorder = window.recorders[postid];
	if(recorder){
        var buttonElement=document.getElementById('button');
        if(buttonElement.src.match("record") || buttonElement.src.match("redo")){
            videoFlushed = false;
        	$('#button + .fa').show()
            recorder.start().then(function(){
                $('#button + .fa').hide();
                buttonElement.src="/public/img/stopbttn.png";
            },function(){
                $('#button + .fa').hide();
                toastr.error('Could not start recording. Please check your connection and make sure you have allowed' +
					' camera access.');
			});
		}

        else if(buttonElement.src.match("stop")){
            $('#button + .fa').show()
            var scope = angular.element(document.getElementById("button")).scope();
            scope.showSubmit = false;
            scope.showSaving = true;
            recorder.stop().then(function(){
                $('#button + .fa').hide();
                buttonElement.src="/public/img/playbttn.png";
            },function(){
                $('#button + .fa').hide();
                scope.showSaving = false;
                buttonElement.src="/public/img/redobttn.png";
                toastr.error('Could not process the video. Please, try again');
            });
		}else if (buttonElement.src.match("play"))
        {
            $('#button + .fa').show();
            recorder.playback().then(function(){
                $('#button + .fa').hide();
                buttonElement.src="/public/img/redobttn.png";
			});

        }

	}
}

function callAS(id,postid)
{
	if(id.length){
		for(var i = 0;i<id.length;i++){
			if(id[i].data.indexOf(postid)>=0){
				id = id[i];
			}
		}
	}
	id=id.bob?id.bob:id;
element=document.getElementById('button');
if (element.src.match("record"))
  {
  element.src="/public/img/stopbttn.png";
  id.recordstart();
  videoFlushed = false;
  }
else if (element.src.match("stop"))
  {
  element.src="/public/img/playbttn.png";
  id.recordstop();
  var scope = angular.element(document.getElementById("button")).scope();
  scope.showSubmit = false;
  scope.showSaving = true;
  scope.$apply();

  }
else if (element.src.match("play"))
{
element.src="/public/img/redobttn.png";
id.playback(postid);
}
else {
element.src="/public/img/stopbttn.png";
id.redo();
id.recordstart();
videoFlushed = false;

var scope = angular.element(document.getElementById("button")).scope();
scope.showSubmit = false;
scope.showSaving = false;
scope.$apply();
}
}

function markVideoAsFlushed() {
	//console.log('video flushed');
	videoFlushed = true;
	var element = angular.element('#videoButton');
	if(!element.length){
		element = angular.element('#videoWidget');
	}
	var scope = element.length?element.scope():angular.element(document.getElementById("button")).scope();
	setTimeout(function(){
		scope.showSubmit = true;
		scope.showSaving = false;
		scope.$apply();
	})

}

//modal code

var modal = (function(){
	var 
	method = {},
	$overlay,
	$modal,
	$content,
	$close;

	//open modal relative to feedback
	method.relative = function () {
		var top, left;

		var s = window.client.Y;
		
		top = s;
		left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2;

		$modal.css({
			top:top + $(window).scrollTop(), 
			left:left + $(window).scrollLeft()
		});

	

	};

	// Center the modal in the viewport
	method.center = function () {
		var top, left;

		top = Math.max($(window).height() - $modal.outerHeight(), 0) / 3 ;
		left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2;

		$modal.css({
			top:top + $(window).scrollTop(), 
			left:left + $(window).scrollLeft()
		});
	};

	// Open the modal
	method.open = function (settings) {
		$content.empty().append(settings.content);
		$modal.css({
			width: settings.width || 'auto',
			height: settings.height || 'auto'
		});
               
		method.center();
		
		$(window).bind('resize.modal', method.center);
		
		function getCookie(c_name)
{
var c_value = document.cookie;
var rem = "remember";
var c_start = c_value.indexOf(" " + rem + "=");
if (c_start == -1)
{
c_start = c_value.indexOf(rem + "=");
}
if (c_start == -1)
{
c_value = null;
}
else
{
c_start = c_value.indexOf("=", c_start) + 1;
var c_end = c_value.indexOf(";", c_start);
if (c_end == -1)
{
c_end = c_value.length;
}
c_value = unescape(c_value.substring(c_start,c_end));
}
return c_value;
}

		var remember=getCookie("remember");
		
		element=document.getElementById('modal');
              
		$modal.show();
		//$overlay.show();
	};

	// Close the modal
	method.close = function () {
		$modal.hide();
		$overlay.hide();
		$content.empty();
		$(window).unbind('resize.modal');
	};

	// Generate the HTML and add it to the document
	$overlay = $('<div id="overlay"></div>');
      
	$modal = $('<div id="modal" class="modal"></div>');
	$content = $('<div id="content"></div>');
	$close = $('<a id="close" href="#">close</a>');
       $dragarea = $('<div onmousedown="setdrag()" onmouseup="unsetdrag()" style="cursor:move; height:30px; width:30px; background-image: url(\'./img/dragicon.png\'); position:absolute; top:-15px; left:-15px;"></div>');
	


	$modal.hide();
	$overlay.hide();
	$modal.append($content, $close);
       //if(isMobile.any()){ }
       //else {
       $modal.append($dragarea);
       //}

	$(document).ready(function(){
		$('body').append($overlay, $modal);						
	});

	$close.click(function(e){
		e.preventDefault();
		method.close();
	});

	return method;
}());

function openModal() {
		modal.open({content: $htmltext + $commentshtml + $submitbutton });
		e.preventDefault(); 
		}

function deleted(idtodelete) {
	$.post("megGendelete.php", { idtodelete: idtodelete } )
	.done(function(data) {
		location.reload();
	});
	}

//on-site editing feature

//press crtl-alt-e to bring up edit box
function detectspecialkeys(e){
 var evtobj=window.event? event : e
 var unicode=e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
 var key = String.fromCharCode(unicode)
 if (evtobj.ctrlKey && evtobj.altKey && unicode==69) {
//get title and html of page from megGenPages
  $.get("getHTML.php",{siteid : document.getElementById('siteid').value, courseid : document.getElementById('courseid').value, pageid : document.getElementById('pageid').value })
  .done(function(data) {
   $content = data;
   modal.open({content : $content});
  });
 }
}
//document.onkeydown=detectspecialkeys

function savechanges() {
 $.get("saveHTML.php",{siteid : document.getElementById('siteid').value, courseid : document.getElementById('courseid').value, pageid : document.getElementById('pageid').value, newtitle : document.getElementById('pagetitle').value, newhtml : document.getElementById('pagehtml').value })
 .done(function(data) {
  //alert(data);
  modal.close();
 });
}

function submitvid(newvideofile,author,level,thepageid,thepagetitle,responsetoid,textonly,thegroup,thelevel1id,theuserid,siteid,courseid,pageid) {

              element = document.getElementById('button');
		element2 = document.getElementById('submit');
		if(element){
		if(element.src.match("stop")) {
		if(element2.innerHTML.match("stop")){  }
		else { element2.innerHTML += "<br>Please click stop before submitting"; }
		var indicate = setInterval(function(){
		if(element.style.border.match("dashed")) { element.style.border = "" }
		else { element.style.border = "2px dashed rgba(255,0,0,.5)"; }
		},50);
		setTimeout(function(){clearInterval(indicate);element.style.border = "2px dashed rgba(255,0,0,.5)";},350);
		}
		else {
		$newvideofile = newvideofile;
		$author = author;
		$level = level;
              $siteid = siteid;
		$courseid = courseid;
		$pageid = pageid;
		$thepageid = thepageid;
		$thepagetitle = thepagetitle;
		$responsetoid = responsetoid;
		$textonly = textonly;
		$thegroup = thegroup;
		$thelevel1id = thelevel1id;
		$theuserid = theuserid;


      		$mycomments=document.getElementById("comments").value;
 		$sometext=$author+$mycomments;
		$thumb=$newvideofile+".jpg";
		$flvfile=$newvideofile+".flv";
		$newpostid=$newvideofile;
              if ($textonly>0) 
              {
                $thumb="";
		  $flvfile="";
              }

		  $.post("megwrite-generic.php", { siteid: $siteid, courseid: $courseid, pageid: $pageid, author: $author, discid: $thepageid, disctitle: $thepagetitle, level: $level, responsetoid: $responsetoid, comment: $mycomments, postid: $newpostid, file: $flvfile, thumbnail: $thumb, group: $thegroup, level1id: $thelevel1id, textonly: $textonly, userid: $theuserid  } )
		  .done(function(data) {
                if(data.indexOf('1') > -1)
                {
  		    setTimeout("1000");
		    modal.close();    
                  location.reload();                  
                }
                if(data.indexOf('2') > -1)
                {
                  alert("You must record a video before submitting");
                }
	});
	}
}
}

function submittext(newvideofile,author,level,thepageid,thepagetitle,responsetoid,textonly,thegroup,thelevel1id,theuserid,siteid,courseid,pageid){


		$newvideofile = newvideofile;
		$author = author;
		$level = level;
              $siteid = siteid;
		$courseid = courseid;
		$pageid = pageid;
		$thepageid = thepageid;
		$thepagetitle = thepagetitle;
		$responsetoid = responsetoid;
		$textonly = textonly;
		$thegroup = thegroup;
		$thelevel1id = thelevel1id;
		$theuserid = theuserid;


      		$mycomments=document.getElementById("comments").value;
 		$sometext=$author+$mycomments;
		$thumb=$newvideofile+".jpg";
		$flvfile=$newvideofile+".flv";
		$newpostid=$newvideofile;
              if ($textonly>0) 
              {
                $thumb="";
		  $flvfile="";
              }  

		  $.post("megwrite-generic.php", { siteid: $siteid, courseid: $courseid, pageid: $pageid, author: $author, discid: $thepageid, disctitle: $thepagetitle, level: $level, responsetoid: $responsetoid, comment: $mycomments, postid: $newpostid, file: $flvfile, thumbnail: $thumb, group: $thegroup, level1id: $thelevel1id, textonly: $textonly, userid: $theuserid  } )
		  .done(function(data) {
                if(data.indexOf('1') > -1)
                {
  		    setTimeout("1000");
		    modal.close();    
                  location.reload();               
                }
                if(data.indexOf('2') > -1)
                {
                  alert("You must record a video before submitting");
                }
	});
	}


function clicksubmit(newvideofile,author,level,thepageid,thepagetitle,responsetoid,textonly,thegroup,thelevel1id,theuserid,siteid,courseid,pageid)
	{
		$newvideofile = newvideofile;
		$author = author;
		$level = level;
              $siteid = siteid;
		$courseid = courseid;
		$pageid = pageid;
		$thepageid = thepageid;
		$thepagetitle = thepagetitle;
		$responsetoid = responsetoid;
		$textonly = textonly;
		$thegroup = thegroup;
		$thelevel1id = thelevel1id;
		$theuserid = theuserid;

              if($textonly > 0){
      		 submittext($newvideofile,$author,$level,$thepageid,$thepagetitle,$responsetoid,$textonly,$thegroup,$thelevel1id,$theuserid,$siteid,$courseid,$pageid);	
		}
		else {
		submitvid($newvideofile,$author,$level,$thepageid,$thepagetitle,$responsetoid,$textonly,$thegroup,$thelevel1id,$theuserid,$siteid,$courseid,$pageid);	
		}
	}


$drag = "";
var movearray = [];
var id = "modal";

function setdrag() {
$drag = 1;
var divs = document.getElementsByTagName( 'div' );
for(var i=0; i<divs.length; i++){
divs[i].style.MozUserSelect = "-moz-none";
divs[i].style.WebkitUserSelect = "none";
divs[i].style.KhtmlUserSelect = "none";
divs[i].style.MsUserSelect = "none";
divs[i].style.userSelect = "none";
}
}

function unsetdrag() {
$drag = 0;
movearray = [];
var divs = document.getElementsByTagName( 'div' );
for(var i=0; i<divs.length; i++){
divs[i].style.MozUserSelect = "";
divs[i].style.WebkitUserSelect = "";
divs[i].style.KhtmlUserSelect = "";
divs[i].style.MsUserSelect = "";
divs[i].style.userSelect = "";
}
}

$(document).ready(function(){ 

$(document).on('mousemove',function(e){
if ($drag == 1) {
var element = document.getElementById("modal");
$modalY = element.style.top.slice(0, -2);
$modalX = element.style.left.slice(0,-2);


$orientY = e.pageY - $modalY;
$orientX = e.pageX - $modalX;

if (movearray.length < 2) {
movearray.push($orientX);
movearray.push($orientY);
}


element.style.left = parseInt(e.pageX) - movearray[0] + 'px';
element.style.top = parseInt(e.pageY) - movearray[1] + 'px';
}



//$x = e.pageX;
//$y = e.pageY;
element=document.getElementById('modal');

});

});

function setIframeHeight(iframe) {
    if (iframe) {
        var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
        if (iframeWin.document.body) {
            iframe.height = iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight;
        }
    }
  else {
   console.log("did not find iframe");
  }
};

function playaudio() {
  $myword=document.getElementById("translatebox").value;
  $playhtml="<object data='http://audio1.spanishdict.com/audio?lang=es&speed=25&text="+$myword+"'</iframe>";              
  modal.open({content: $playhtml });
  e.preventDefault(); 

}

function openVideoPlayer(videoid,comment,rotate) {
$videoid = videoid;
$comment = "";
if(comment){
$comment = "<br><div style='padding:5px; width:410px; font-size:14px;'><br>\""+comment+"\"</div>";
}
$vidfile = "./postsGen/" + $videoid;
if(rotate > 0) {
$vidfile = "./rotated_vids/" + $videoid;
}
$vidsource = "flv/" + $videoid;
$player = "http://elearn.mtc.byu.edu/meg/player.swf";
$vidfilemp4=$vidfile.replace(".flv",".mp4");
$vidplaymobile="<video width='420' height='344' controls><source type='video/mp4' src='"+$vidfilemp4+"'></source></video>";
$vidplay = "<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' width='420' height='344'><!--[if !IE]>--><object type='application/x-shockwave-flash' data='"+$player+"' width='420' height='344'><!--<![endif]--><param name='movie' value='"+$player+"' /><param name='wmode' value='transparent' /><param name='bgcolor' value='#FFFFFF' /><param name='quality' value='high' /><param name='allowFullScreen' value='true' /><param name='allowscriptaccess' value='always' /><a href='http://www.adobe.com/go/getflash'><img src='http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif' alt='Get Adobe Flash player' /></a><param name='flashvars' value='vdo="+$vidfile+"&amp;autoplay=true' /><!--[if !IE]>--></object><!--<![endif]--></object>";
$content = $vidplaymobile + $comment;
modal.open({content: $content });
e.preventDefault();
}

function viewComment(comment) {

$content = "<div style='font-size:20px; padding:10px; min-height:100px; min-width:200px;'>\""+comment+"\"</div>";
modal.open({content:$content});

}

function rotate_video(videoid,rotate) {
$content = "<p>Processing... Please wait. The page will refresh when the video has been rotated.</p>";
modal.open({content:$content});
$.get("rotate_video.php",{videoid:videoid,rotate:rotate})
.done(function(data) {
alert(data);
location.reload();

});

}

function openVideoPlayerSmall(videoid,comment) {
$videoid = videoid;
$comment = "";
if(comment){
$comment = "<br><p style='padding:5px'>Comment:<br>"+comment+"</p>";
}

$vidfile = "./postsGen/" + $videoid;
$vidfilemp4=$vidfile.replace(".flv",".mp4");
$vidplaymobile="<video width='230' height='165' controls autoplay><source type='video/mp4' src='"+$vidfilemp4+"'></source></video>";
//$vidplay = "<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' width='230' height='175'><!--[if !IE]>--><object type='application/x-shockwave-flash' data='"+$player+"' width='230' height='175'><!--<![endif]--><param name='movie' value='"+$player+"' /><param name='wmode' value='transparent' /><param name='bgcolor' value='#FFFFFF' /><param name='quality' value='high' /><param name='allowFullScreen' value='true' /><param name='allowscriptaccess' value='always' /><a href='http://www.adobe.com/go/getflash'><img src='http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif' alt='Get Adobe Flash player' /></a><param name='flashvars' value='vdo="+$vidfile+"&amp;autoplay=true' /><!--[if !IE]>--></object><!--<![endif]--></object>";
$content = $vidplaymobile + $comment;
modal.open({content: $content });
e.preventDefault();
}


function openTextResponse(info,comment) {
$comment = "<p>"+info+"<br><br>"+comment+"</p>";
modal.open({content: $comment });
}

function delete1(idtodelete) {
$idtodelete=idtodelete;
$content = "<div><br><br>Are you sure you want to delete this video?</div><br><br><button type='button' onclick='modal.close()'>Cancel</button><button type='button' onclick='deleted(\""+$idtodelete+"\");modal.close();reload();'>Confirm</button>";
modal.open({content: $content });
//alert($idtodelete);
}
	
function delete2(idtodelete) {
$idtodelete=idtodelete;
$content = "<div><br><br>Are you sure you want to delete this video?</div><br><br><button type='button' onclick='modal.close()'>Cancel</button><button type='button' onclick='deleted(\""+$idtodelete+"\");modal.close();reload();'>Confirm</button>";
modal.open({content: $content });
}

function delete3(idtodelete) {
$idtodelete=idtodelete;
$content = "<div><br><br>Are you sure you want to delete this video?</div><br><br><button type='button' onclick='modal.close()'>Cancel</button><button type='button' onclick='deleted(\""+$idtodelete+"\");modal.close();reload();'>Confirm</button>";
modal.open({content: $content });
//alert($idtodelete);
}

function upload(author,thepageid,thepagetitle,level,responsetoid,newpostid,flvfile,thumb,thegroup,thelevel1id,textonly,theuserid,siteid,courseid,pageid) {
$author=author;
$siteid = siteid;
$courseid = courseid;
$pageid = pageid;
$thepageid=thepageid;
$thepagetitle=thepagetitle;
$level=level;
$responsetoid=responsetoid;
$newpostid=newpostid;
$flvfile=flvfile;
$thumb=thumb;
$thegroup=thegroup;
$thegroup="1";
$thelevel1id=thelevel1id;
$textonly=textonly;
$theuserid=theuserid;

data="<form id='uploadform' method='POST' enctype='multipart/form-data' action='megwrite-generic.php' target='iframe-upload'>";
data+="<input type=hidden name=author value='"+$author+"'>";
data+="<input type=hidden name=discid value='"+$thepageid+"'>";
data+="<input type=hidden name=disctitle value='"+$thepagetitle+"'>";
data+="<input type=hidden name=level value='"+$level+"'>";
data+="<input type=hidden name=responsetoid value='"+$responsetoid+"'>";
data+="<input type=hidden name=comment value='no'>";
data+="<input type=hidden name=postid value='"+$newpostid+"'>";
data+="<input type=hidden name=file value='"+$flvfile+"'>";
data+="<input type=hidden name=thumbnail value='"+$thumb+"'>";
data+="<input type=hidden name=group value='"+$thegroup+"'>";
data+="<input type=hidden name=level1id value='"+$thelevel1id+"'>";
data+="<input type=hidden name=textonly value='"+$textonly+"'>";
data+="<input type=hidden name=userid value='"+$theuserid+"'>";
data+="<input type=hidden name=siteid value='"+$siteid+"'>";
data+="<input type=hidden name=courseid value='"+$courseid+"'>";
data+="<input type=hidden name=pageid value='"+$pageid+"'>";
data+="<input type=hidden name=uploaded value='yes'>";
data+="<br><input id='fileupload' type='file' name='myfile'><br><br>Additional Comments if needed: <br><textarea id=note name=note cols=53 style='width:calc(100% - 6px); height:100px'></textarea><br><br><div id='uploadsubmit' style='display:inline-block'><img src='./img/submit-button.png' onclick='plswait()'></div></form>";
document.getElementById('webcamarea').innerHTML = data;
document.getElementById('buttonsarea').innerHTML = "";
document.getElementById('bottompart').innerHTML = "";
document.getElementById('commentsarea').innerHTML = "";
document.getElementById('uploadbttn').innerHTML = "";
}

function plswait() {
if(document.getElementById('fileupload').value != "") {
document.getElementById('uploadsubmit').innerHTML = "<img src='./img/submit-button.png'><br><div style='display:inline-block; font-size:15px; margin-left:3px;'>Uploading... Please Wait.</div>";
document.getElementById("uploadform").submit();
var uploadalert = window.frames['iframe-upload'].document.body.innerHTML
var uploadprogress = setInterval(function(){
 var uploadalert = window.frames['iframe-upload'].document.body.innerHTML
 if(uploadalert != "") {
  document.getElementById('uploadsubmit').innerHTML = document.getElementById('uploadsubmit').innerHTML.replace("Uploading... Please Wait.",uploadalert);
  if(uploadalert.match("omplete")){
  modal.close();
  window.location.href = window.location.href.split("#")[0];
  }
  clearInterval(uploadprogress);
 }
},250);
}
else { 
alert("No File Has Been Selected");
}
}

function togglecomment(id,id2,level) {
element = document.getElementById(id);
element2 = document.getElementById(id2);
if(element2.innerHTML.indexOf('view') != -1){
element2.innerHTML = "<span style='cursor:pointer'><u>hide</u></span><div id='level"+level+"comments'>"+element.value+"</div>";
}
else{
element2.innerHTML = "<span style='cursor:pointer'><u>view comment</u></span><div style='display:none' id='level"+level+"comments'></div>";
}
}
