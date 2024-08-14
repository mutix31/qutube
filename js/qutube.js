<!--

var timer;  // timer used for mouseover previews
var vidqual="large";
var reddit_url;
var currentType='';
var currentRequestOptions;
var nextPageToken, prevPageToken;

if (!window.console) console = {};
console.log = console.log || function(){};

// loading the youtube API v3
 function googleApiClientReady(){
                gapi.client.setApiKey('AIzaSyAzY7noObHLIYwpx1Z3pkub-1PMCTrHbHM');
                gapi.client.load('youtube', 'v3', function() {console.log('ready');loadDefault();});
        }

// gets the video info from Youtube, using the id. shows it under the the video
function fetchInfo(id) {
	var request = gapi.client.youtube.videos.list({
		id: id,
		part: 'snippet'
	});
	request.execute(function(response) {
		data = response.result.items[0].snippet;
		showinfo(data);
	});
}
function showinfo(data) {
	var s='';var title;
	try{
		title=stripNums(data.title);
		if (!title) title=data.title;
		s='<div><a title="Other recordings or parts" href="javascript:makeRequest(\'search\',\''+addslashes(title)+'\')">'+data.title+'</a>';
		s = s+' &middot; <a style="color:gray;display:inline-block" title="Other videos from this user" href="javascript:makeRequest(\'userid\',\''+data.channelId+'\')">By: '+data.channelTitle+'</a></div>';
		document.getElementById("vidtitle").innerHTML=s;
	} catch(err) {}
}

// makes the preview image. maybe add another parameter to specify the class?
function previewImg(id,title) {
	var s='';
	var imgsrc="http://i.ytimg.com/vi/"+id+"/default.jpg";
	s = s + '<div class="preview"><a atitle="'+addslashes(title)+'" href="javascript:cueVideo(\''+id+'\',\''+addslashes(title)+'\',false)">';
	s = s + '<img class="previewpic" alt="'+title+'" src="'+imgsrc+'" //onmouseout="mouseOutImage(this,\''+id+'\')" onmouseover="mousOverImage(this,\''+id+'\',1)">';
	s = s + '</a>';
	s = s + '</div>';
	return s;
}

// Retrieve the next page of videos in the playlist.
function nextPage() {
console.log(nextPageToken);
  insertVideos('ul1', 'token', nextPageToken);
}

// Retrieve the previous page of videos in the playlist.
function previousPage() {
  insertVideos('ul1', 'token', prevPageToken);
}

// formats the data results and add each to the displayed list
function listVideos(json,divid,type) {
	var len=0;
	clearList('ul1');
	len=json.items.length;
	if (len==0) {$("#ul1").html("<li>Found nothing.</li>");return};
			
	nextPageToken = json.nextPageToken;
    var nextVis = nextPageToken ? 'visible' : 'hidden';
    $('#next').css('visibility', nextVis);
    prevPageToken = json.prevPageToken;
    var prevVis = prevPageToken ? 'visible' : 'hidden';
    $('#prev').css('visibility', prevVis);
	
	var entry;
	var videoid;
	var title;
	var s = '';
	for (var i = 0; i < len; i++) {
		try {
			s='';
			if (type=="reddit") {
				entry=json.data.children[i].data;
				var u=entry.url;
				if (u.search("youtube.com") != -1 && u.search("v=") != -1) {
					videoid=u.substr(u.search("v=")+2, 11);
					s = s + previewImg(videoid,entry.title) + '<br/>'+entry.title;
				} else {
					throw("not youtube");
				}
			} else {  // youtube feed
					entry=json.items[i];
					
					if (type=='file'){
						videoid = entry.id;
						title = entry.title;
					} else if (json.kind=="youtube#searchListResponse") {
						videoid = entry.id.videoId;
						title = entry.snippet.title;
					} else if (json.kind=="youtube#playlistItemListResponse") {  // playlist
						videoid = entry.snippet.resourceId.videoId;
						title = entry.snippet.title;
					} else {
						alert("unrecognized data");
						throw("unrecognized data");
					}
					
					//s = ""+videoid;
					 s = s + previewImg(videoid, title) + '<span class="caption">'+title;
					// if (type != "file") {
						// s = s + '<br /><p class="details">By: '+entry.snippet.channelTitle;
						// s = s + '</p></span>';
						
						// //s = s + '<br />'+entry.viewCount + ' views - ' + Math.round(entry.likeCount/entry.ratingCount*100) + '% likes</p></span>';
					// }
			} 		
			appendOptionLast(s, '$'+videoid, title, divid);

		} catch (err) {} // if there is an error just skip the video
	}

	jumptop();
	//if (document.getElementById('ul1').className == 'textlist') showDetails(1);
 }

var l = 1;

// get playlist id
function getChannelInfo(user, type) {
	var requestOptions = {
		part: 'contentDetails'
	}
	if (type == 'userid') {
		requestOptions.id = user;
	} else if (type == 'user' || type == 'favorites'){
		requestOptions.forUsername = user;
	} else {
		console.log("unknown channel type");
	}
	
	var request = gapi.client.youtube.channels.list(requestOptions);
	request.execute(function(response) {
		result = response.result.items[0].contentDetails.relatedPlaylists;
		console.log(JSON.stringify(result));
		if (type=='favorites') {
			insertVideos('ul1', type, result.favorites);
		} else if (type=='user' || type=='userid') {
			insertVideos('ul1', type, result.uploads);
		}
	});
}


// Get list of videos from Youtube
function insertVideos(div,type,q) {
	
	var requestOptions = {
		part: 'snippet',
		maxResults: 18
	}
	if (type=='search') {
		requestOptions.q = q;
		requestOptions.type = "video";
	} else if (type=='favorites' || type=='user' || type=='userid') {
		requestOptions.playlistId = q;
	} else if (type=='token') {
		// re-run the query with page token
		requestOptions = currentRequestOptions;
		requestOptions.pageToken = q;
		type = currentType;
	} else if (type=='related') {
		requestOptions.relatedToVideoId = q;
	} else {
		console.log('unrecognized type');
		return;
	}
	
	currentRequestOptions = requestOptions;
	currentType = type;
	var request;
	
	if (type=='favorites' || type=='user' || type=='userid') {	// playlist
		request = gapi.client.youtube.playlistItems.list(requestOptions);
	} else {									// search
		request = gapi.client.youtube.search.list(requestOptions);
	}
  
	request.execute(function(response) {
		listVideos(response.result, div, type);
	});
}


// appends a list item to the end (or beginning if front is set) of a list
function appendOptionLast(text,id,title,ul,front){
	try{
		if(text && id && ul){
			
			var list = document.getElementById(ul);
			var newNode = document.createElement("li");
			newNode.setAttribute('id',id);
			newNode.setAttribute('atitle',title);
			newNode.innerHTML = ""+text;
			
			if (front==1) {
				list.insertBefore(newNode,list.firstChild);
				
			} else {
				list.appendChild(newNode);
				
			}
			
		}
	}
	catch(err){}
 }
 
 function clearList(ul){
 	var list = document.getElementById(ul);
	while (list.firstChild) 
	 {
	    list.removeChild(list.firstChild);
	 }		
} 


// calls various search functions
function makeRequest(type,sstring){
	var querystr;
	clearList('ul1');
	
	if (type=="init") {
		type = "search";
	} else {
		// hide the about box
		$("#about").hide();
	}
	
	if (sstring) {
		querystr=sstring;
	} else {
		// the javascript API functions will take care of the encoding of spaces etc
		querystr=document.getElementById('searchinput').value;
	};
	
	console.log(type + " : " + querystr);
	
	if (type=='favorites' || type=='user' || type=='userid') {
		getChannelInfo(querystr, type);
	} else {
		insertVideos('ul1',type, querystr);
	}
	
} 

// === handles thumbnail animations ===
var imname;

// change preview thumbnail
 function mousOverImage(name,id,nr){
	if(name) imname = name;
	if (id){
		imname.src = "http://img.youtube.com/vi/"+id+"/"+nr+".jpg";
		nr++;
		if(nr > 3)
			nr = 1;
		timer =  setTimeout("mousOverImage(false,'"+id+"',"+nr+");",1000);
	}
 }
 function mouseOutImage(name,id){
 	if(name)
		imname = name;
	if (id) imname.src="http://i.ytimg.com/vi/"+id+"/default.jpg";
	if(timer)
		clearTimeout(timer);
 }
 
 
// === various utility functions ===
var normalplayer = false;
var currentid = 0;
var size = 1;

// scroll to top of page
function jumptop(){
  if((obj = document.getElementById('top')) && obj != null){
	  window.scrollTo(0, obj.offsetTop);
  }
}
function addslashes(str) {
	str=str.replace(/\'/g,'\\\'');
	str=str.replace(/\"/g,'');
	return str;
}
function stripslashes(str) {
	str=str.replace(/\\'/g,'\'');
	return str;
}
  
// Youtube player event functions
function onYouTubePlayerReady(event) {
	normalplayer = event.target;
}
  
function onPlayerQualityChange(event) {
	// only change quality if user specified it
    if (normalplayer.getPlayerState() == 1 || normalplayer.getPlayerState() == 2) {
		//document.getElementById("qualid").innerHTML = q;
		console.log("Quality " + event.data);
		vidqual = event.data;
	}
}

function onPlayerStateChange(event) {
	console.log("Event " + event.data);
   if (event.data==YT.PlayerState.ENDED)  {
     getNextPlaylist();
   }
}

// add video to playlist 
function cueVideo(id,title,clearer){
	var ul = document.getElementById("ul3");	
	if (ul) {
		try {cueVid(id,title,false); } catch(err){}
	} else {
		playVideo(id);
	}
} 
 
 function playVideo(id,title,div,blurb){
 	//alert("playing");
 	//if (movedOut) {movedOut=false;return;}
	if (blurb) {
		document.getElementById("vidtitle").innerHTML=blurb;
	} else {
		fetchInfo(id);
	}
	hilight(id,div);
	currentid = id;
	if (normalplayer) normalplayer.loadVideoById(id,0,vidqual);
} 

function showDetails(show) {
	var symb=$('#det');
	if (show!=1 && document.getElementById('ul1').className == 'textlist') {
		document.getElementById('ul1').className = 'playlist';
		//$('.details').css('display', 'none');
		symb.attr('innerHTML','&#8862; <span style="display:inline;color:gray">&equiv;</span>');
	} else {
		document.getElementById('ul1').className = 'textlist';
		//$('.details').css('display', 'inline');
		symb.attr('innerHTML','<span style="display:inline;color:gray">&#8862;</span> &equiv;');		
	}
}

// extract search parameters from URL encoding
function extractURL() {
	var url = document.URL;
	var t=url.substring(url.indexOf("?")+1);

	if (url.indexOf("?")==-1) {
	} else {
		var s = t.split('=');
		//alert(s[0] + " " + s[1]);
		if (s[1]) {
			$('#searchinput').val(decodeURI(s[1]));
			makeRequest(s[0]);
			return true;
		}
	}
	return false;
}
// sets the @ link to the URL for bookmarking
function encodeURL(type,q) {
	var url = document.URL;
	var p = url.indexOf("?");
	if (p == -1) p = url.length;
	url = url.substring(0,p);
	var i = document.getElementById("urlcode");
	i.href = url + "?" + type + '=' + q;
}
// check if the video has multiple segments
function stripNums(s) {
	var parts=0;
	var newstr = "";
	var st = s.split(' ');
	for (var i=0;i<st.length;i++) {
		if (st[i].search("[0-9]") >=0 && st[i].length <6) {
			parts++;
		} else {
			newstr = newstr + st[i] + " ";
		}
	}
	if (parts>0) return(newstr);
}

//loads when page is ready
function loadDefault() {
	var type=document.getElementById("defaulttype").value;
	
	if (!extractURL()) {
		//if (type==undefined) makeRequest('mostviewed');
		//makeRequest(type);
		makeRequest('init','conor oberst');
		//makeRequest('playlist','PLEKC-j1FKvYVUL6ziHQahrez4RWYdAm2W');
	}
}

/*
 * jQuery resize event - v1.1 - 3/14/2010
 * http://benalman.com/projects/jquery-resize-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=250;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);

function isUrl(s) {
	var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
	return regexp.test(s);
}
function redditbutton(url) {
var write_string="<iframe src=\"http://www.reddit.com/static/button/button1.html?width=120&url=";
  if (window.reddit_url)  { 
      write_string += encodeURIComponent(reddit_url); 
  }
  else { 
      write_string += encodeURIComponent(window.location.href);
  }
  if (window.reddit_title) {
       write_string += '&title=' + encodeURIComponent(window.reddit_title);
  }
  if (window.reddit_target) {
       write_string += '&sr=' + encodeURIComponent(window.reddit_target);
  }
  if (window.reddit_css) {
      write_string += '&css=' + encodeURIComponent(window.reddit_css);
  }
  if (window.reddit_bgcolor) {
      write_string += '&bgcolor=' + encodeURIComponent(window.reddit_bgcolor); 
  }
  if (window.reddit_bordercolor) {
      write_string += '&bordercolor=' + encodeURIComponent(window.reddit_bordercolor); 
  }
  if (window.reddit_newwindow) { 
      write_string += '&newwindow=' + encodeURIComponent(window.reddit_newwindow);}
  write_string += "\" height=\"22\" width=\"120\" scrolling='no' frameborder='0'></iframe>";
  return write_string;
}


// resizes the lists to fit inside window
function resizetofit() {
	var offset1=$("#wrapper").offset();
	var t=4;
	if ($(window).height() > 500) t=25;
	$("#wrapper").height( $(window).height()-offset1.top-t);
	offset1=$("#ul1").offset();
	$("#ul1").height($("#wrapper").height()-offset1.top);
	offset1=$("#ul3").offset();
	try{$("#ul3").height($("#wrapper").height()-offset1.top);} catch(err){}
	
	var newleft = $("#wrapper").offset().left + $("#wrapper").width();
	$("#about").offset({ top: 74, left: newleft+8 });
}

 $(document).ready(function() {
   //loadDefault();
   resizetofit();
   //$("#previewplayer").resize(function() {resizetofit();});
   $(window).resize(function() {resizetofit();});
   $("#input").focus();
 });

 // file loading and saving functions
function clickLoad() {
	input = document.getElementById('fileinput');
	input.click();
}

function loadFile() {
	var input, file, fr;

	if (typeof window.FileReader !== 'function') {
	  alert("Please update your browser to use file functionality.");
	  return;
	}

	input = document.getElementById('fileinput');
	if (!input) {
	  alert("Couldn't find the fileinput element.");
	}
	else if (!input.files) {
	  alert("This browser doesn't seem to support the `files` property of file inputs.");
	}
	else if (!input.files[0]) {
	  alert("Please select a file before clicking 'Load'");
	}
	else {
	  file = input.files[0];
	  fr = new FileReader();
	  fr.onload = receivedText;
	  fr.readAsText(file);
	}

	function receivedText(e) {
	  lines = e.target.result;
	  var fileJSON = JSON.parse(lines); 
	  //alert(newArr.data.items[0].title);
	  listVideos(fileJSON.data, "ul1", "file");
	}
}

 
 
 //-->
