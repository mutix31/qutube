var movedOut=false;

//drag and drop
$(function() {
	$("#ul3").disableSelection();
	// drag out to delete from playlist
	$("#ul3").sortable({
		containment: 'document',
		helper:'original',
		distance: 4,
		tolerance: "pointer",
		out: function(event,ui) {
			ui.helper.addClass("deleting");
			movedOut=true;
		},
		over: function(event,ui) {
			ui.helper.removeClass("deleting");
			movedOut=false;
		},
		sort: function(event,ui) {
			$("ul.playlistBottom li span").addClass("hidden");
		},
		beforeStop: function(event,ui) {
			$("ul.playlistBottom li span").removeClass("hidden");
			//if (movedOut) {ui.item.remove()}
		},
		stop: function(event,ui) {
			if (movedOut) {
				ui.item.remove();
				$("#ul3").sortable('refresh');
				
				//alert("Item removed");
			};
		}
	});

});

// add video to the playlist
function cueVid(id,title,cueOnly){
	var ul = document.getElementById("ul3");
	var items = ul.getElementsByTagName("li");
	id=id.replace('$','');   // a hack to make sure there is no duplicates in the lists
	
	var found = $("#ul3").find("#"+id);
	if (found.length > 0) {
		if (!cueOnly && !movedOut) playVideo(id,stripslashes(found.attr("atitle")));
	} else {
		var s='<img src="triangle_orange.png" class="icon">';
		s=s+'<a class="pltitle" atitle="'+addslashes(title)+'" href="javascript:playVideo(\''+id +'\')">'+title+'</a>';
		s=s+'<span class="smallprev"><img src="http://i.ytimg.com/vi/'+id+'/default.jpg"></span>';
		
		appendOptionLast(s,id ,title,'ul3');
		if (items.length==1 && (normalplayer.getPlayerState()==-1 || normalplayer.getPlayerState()==5)) getNextPlaylist();
	}
	
}

// saves the playlist
function saveToFile() {
	var filename = prompt("Saving to filename:", "qutubePlaylist.json");
	if (filename != null) {
		var listObj = $("#ul3").children();
		var listJSON = { "data": {
							"items": []
							}
						};
		
		listObj.each(function(i, li) {
			var li = $(li);
			listJSON.data.items[i] = {};
			listJSON.data.items[i].id = li.attr("id");
			listJSON.data.items[i].title = li.text();
		});
	
		var text = JSON.stringify(listJSON);

		var blob = new Blob([text], {type: "text/json;charset=utf-8"});
		saveAs(blob, filename);
	}
	return false;
}

function hilight(id,div){
	if (div==undefined) div="ul3";
	var s="[id$='"+id+"']"
	try {
	var item=$('#'+div+' li'+s).first();
	var list=$('#'+div);
	$("#"+div+" li").removeClass("pltitle");
	item.addClass("pltitle");
	var top = item.offset().top - list.offset().top;
	if (top < 0 || top > (list.height()-item.height())) {
		list.scrollTop(top+list.scrollTop()-item.height());}
	} catch(err) {}
}

// play the next video on the playlist
function getNextPlaylist(){
	var found = $("#ul3").find("#"+currentid);
	if (found.length > 0) {
		var nextvid=found.next();
		if (nextvid.attr("id")) {
			playVideo(nextvid.attr("id"),stripslashes(nextvid.attr("atitle")));
		} else if (document.getElementById("looper").innerHTML == "Looping") {
				playVideo($("#ul3 li").first().attr("id"),stripslashes($("#ul3 li").first().attr("atitle")));
		}
		return;
	}
	if ($("#ul3 li").length == 1 && normalplayer.getPlayerState()==-1) {
		playVideo($("#ul3 li").first().attr("id"),stripslashes($("#ul3 li").first().attr("atitle")));
	}
}

// queues up all videos into playlist
function playall() {
	$('#ul1 li').each(function(index) {
		try{cueVid($(this).attr("id"),$(this).attr("atitle"),true);} catch(err){}
	});
}

function shufflePlaylist(){
	var ul = document.getElementById("ul3");
	var o = ul.getElementsByTagName("li");
	var s;
	var k=new Array(o.length);
	for (var i=0;i<o.length;i++) k[i]=i;
	k=shuffle(k);
	for (var i=0;i<o.length;i++) {
		s=$("#"+o[k[i]].id).detach();
		$("#ul3").prepend(s);
	}
}
 //+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
shuffle = function(o){ //v1.0
for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
return o;
};

function clearPlaylist(){
	clearList('ul3');
}

function toggleLoop(){
	var loop=$("#looper");
	if (loop.text() == "Loop") {
		loop.text("Looping");
	} else {
		loop.text("Loop");
	}
}