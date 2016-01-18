/* legacy css and plugin to replace removed reference & allow testing on current channel pages */
$('head').append('<link rel="stylesheet" href="/sxm/css/list-module.css" type="text/css" />');
(function($) {
    $.fn.listExpand = function(listOptions) {
        var defaultSettings = {
            minimum: 5,
            collapsedTitle: "Show Full List",
            expandedTitle: "Hide Full List"
        };
        var listOptions = $.extend(defaultSettings, listOptions);
        var $listControl = $('.listControl', this);
        var olul= this.find('ol').length > 0 ? 'ol' : 'ul';
        return this.find(olul).each(function() {
            if($('> *', this).length > listOptions.minimum) {
                var $obj = $(this);
                var $listItems = $('> *', this);
                $listItems.filter(":gt("+(listOptions.minimum-1)+")").hide();
                    $obj.data("status", "collapsed");
                    $listControl.addClass("collapsed");
                // click actions
                $listControl.click(function() {
                    if($obj.data("status") == "collapsed") {
                        $listItems.filter(":hidden").show();
                        $listControl.html(listOptions.expandedTitle);
                        $obj.data("status", "expanded");
                    }
                    else if($obj.data("status") == "expanded") {
                        $listItems.filter(":gt("+(listOptions.minimum-1)+")").hide();
                        $listControl.html(listOptions.collapsedTitle);
                        $obj.data("status", "collapsed");
                    }
                    $(this).toggleClass("collapsed").toggleClass("expanded");
                    return false;
                });
            }
        });
    }
})(jQuery);
(function($){
    $.fn.showMore = function(options) {
        var settings = $.extend( {
          'labelmore' : 'Show More',
          'labelless' : 'Show Less',
          'displaynumber' : 5,
          'showhidespeed' : 250,
          'itemselector' : 'div.shows span.show'
        }, options);
        this.each(function(index) {
            var shown = false;
            var $items = $(settings.itemselector, $(this));
            var $hides;
            if($items.length > settings.displaynumber){
                $hides = $(settings.itemselector, $(this)).slice(settings.displaynumber).hide();
                $showcontrol = $("<div class='showhide'><div class='button'><span>"+settings.labelmore+"</span></div></div>");
                $(this).append($showcontrol);
                if(this.nodeName == "UL" || this.nodeName == "OL"){
                    $showcontrol = $showcontrol.wrap("<li />");
                }       
                $(".button", $showcontrol).bind("click", function(e){
                    var $label = $(this).find("span");                  
                    if(!shown){
                        $hides.show(settings.showhidespeed);
                        $label.text(settings.labelless);
                    }else {
                        $hides.hide(settings.showhidespeed);                    
                        $label.text(settings.labelmore);
                    };
                    shown = !shown;
                });
            }
        });
    }  
})(jQuery);
// Channel Page "On The Air" Module : Nov 2013 : JSA
var SXM = SXM || {};
SXM.Days = {"0":"Sunday", "1":"Monday", "2":"Tuesday", "3":"Wednesday", "4":"Thursday", "5":"Friday", "6":"Saturday"};
SXM.Months = {"1":"January", "2":"February", "3":"March", "4":"April", "5":"May", "6":"June",
                "7":"July", "8":"August", "9":"September", "10":"October", "11":"November", "12":"December"};
SXM.OnTheAir = {
    BlobURL : "/servlet/Satellite?blobcol=urlimage&blobheader=image%2Fgif&blobkey=id&blobtable=ImageAsset&blobwhere=",
    ContentID : "",
    Timestamp: "",
    Timezone : "Eastern",
    Flags : {"Available": false, "HostsRendered" : false},  
    Platforms : {
        sirius : {Code : "SIRIUSDCOM", Label : "Sirius", Value : "sirius"},
        xm : {Code : "XMDCOM", Label : "XM", Value : "xm"},
        siriusxm : {Code : "XMDCOM", Label : "SiriusXM", Value : "siriusxm"}
    },
    init : function(cid, tz, currplatform, platforms){
        Handlebars.registerHelper('format_tab_date', function() {
            var arr = this.groupdate.split(".");
            var year = arr[2];
            var month = (arr[0] - 1);
            var day = arr[1];       
            var d = new Date(year,month,day,0,0,0,0);
            var datestr = SXM.Days[d.getDay()] + "<br /><span>" + SXM.Months[d.getMonth()+1] + " " + d.getDate() + "</span>";
            return new Handlebars.SafeString(
                datestr
            );
        });
        Handlebars.registerHelper('format_broadcast_time', function() {
            if((typeof this.sc != "undefined") && (typeof this.sc.sTimeStr != "undefined") && (typeof this.sc.eTimeStr != "undefined")){
                return new Handlebars.SafeString(
                    SXM.OnTheAir.formatbroadcasttimes(this.sc.sTimeStr, this.sc.eTimeStr)
                );
            }
        });
        Handlebars.registerHelper('format_broadcast_date_time', function() {
            if((typeof this.sc != "undefined") && (typeof this.sc.sTimeStr != "undefined") && (typeof this.sc.eTimeStr != "undefined")){
                return new Handlebars.SafeString(
                    SXM.OnTheAir.formatbroadcastdatetime(this.sc.sTimeStr, this.sc.eTimeStr)
                );
            }
        });
        Handlebars.registerHelper('show_image_url', function() {
            var cid="";
            if((typeof this.pr != "undefined") && (typeof this.pr.logo != "undefined")){
                cid =  this.pr.logo;  // EPG data
            }else if(typeof this.thumbnailimage != "undefined"){
                cid =  this.thumbnailimage; // Ongoing Programs data
            }
            if(cid != ""){
                return new Handlebars.SafeString(
                    SXM.OnTheAir.getshowimageurl(cid)
                );
            }else{
                if(typeof SXM.ChannelLogoURL != "undefined" && SXM.ChannelLogoURL != ""){
                    return new Handlebars.SafeString(
                        SXM.ChannelLogoURL
                    );
                }
            }
        });
        Handlebars.registerHelper('show_on_demand', function() {        
            var od = "0";
            if((typeof this.pr != "undefined") && (typeof this.pr.od != "undefined")){
                od = this.pr.od; // EPG data
            } else if(typeof this.od != "undefined"){
                od = this.od; // Ongoing Programs data
            }
            if(od == "1"){
                
                //var html = "<a target=\"_blank\" href=\"/player\" class=\"od-launch\" title=\"Available On Demand\"><div class=\"on-demand-play-19\"></div><span class=\"hidden\">Available On Demand</span></a>";
                var html = "<div class=\"on-demand-play-19\" title=\"Available On Demand\" style=\"cursor:default;\"></div><span class=\"hidden\">Available On Demand</span>";
                return new Handlebars.SafeString(
                    html
                );
            }   
        });
        Handlebars.registerHelper('format_rebroadcast', function() {        
            if((typeof this.pr != "undefined") && (typeof this.pr.logo != "undefined")){
                var rblabel = "<br /><span class='rebroadcasts'><strong>Rebroadcast:&nbsp;&nbsp;</strong>";
                var rblist = "";
                var rbstring = "";
                if((typeof this.rebroadcasts != "undefined") && (typeof this.rebroadcasts[0] != "undefined")){
                    for(i=0;i<this.rebroadcasts.length;i++){                    
                        rblist += SXM.OnTheAir.formatbroadcastdatetime(this.rebroadcasts[i], true);
                        if(i<(this.rebroadcasts.length-1)){
                            rblist += ",&nbsp;&nbsp;";
                        }
                    }
                }
                if(rblist.length > 0){
                    rbstring = rblabel + rblist + "</span>";
                }
                return new Handlebars.SafeString(
                    rbstring
                );
            }
        });
        Handlebars.registerHelper('decode_body', function() {       
            if((typeof this.body != "undefined")){
                var ubody = unescape(this.body);        
                return new Handlebars.SafeString(
                    ubody
                );  
            }
        });
        Handlebars.registerHelper('decode_daterange', function() {      
            if((typeof this.daterange != "undefined")){
                var ubody = unescape(this.daterange);       
                return new Handlebars.SafeString(
                    ubody
                );  
            }
        });
        Handlebars.registerHelper('weekly_schedule_link', function() {
            if((typeof window.weeklyScheduleLink != "undefined")){
                var wslink = "<a href='"+window.weeklyScheduleLink+"' class='weekly-schedule-link'>View Full Week's Schedule</a>";
                return new Handlebars.SafeString(
                    wslink
                );  
            }
        });
        Handlebars.registerHelper('show_favorite_heart', function() {
            if((typeof this.pgType != "undefined" && this.pgType === "series")){
                var favlink = "<a href='#add' class='channel-favorite' id='fav-" + this.pgid +"' data-fav='" + this.pgid + "'' name='' title='Add to My Favs'><span class='hidden'>Add to My Favs</span></a>&nbsp;";
                return new Handlebars.SafeString(
                    favlink
                );  
            }
        });
        // add trim() for older versions of IE
        if (!String.prototype.trim) {
            String.prototype.trim=function(){return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};
        }
        $("#on-the-air-unavailable").hide();
        $("#on-the-air-content").hide();
        $(".channel-tabs-content").hide();
        $("#on-the-air-loader").show();
        // content id
        if((typeof cid != "undefined") && (cid.length > 0)){
            SXM.OnTheAir.ContentID = cid;
        }else return false;  // no cid, exit.
        // timezone
        if((typeof tz != "undefined") && (tz.length > 0)){
            if(tz.toUpperCase() === "CENTRAL"){
                SXM.OnTheAir.Timezone = "Central";
            }
            else if(tz.toUpperCase() === "MOUNTAIN"){
                SXM.OnTheAir.Timezone = "Mountain";
            }
            else if(tz.toUpperCase() === "PACIFIC"){
                SXM.OnTheAir.Timezone = "Pacific";
            }
        }
        // distribution check
        if((typeof currplatform == "undefined") || (currplatform.length == 0) || (typeof SXM.OnTheAir.Platforms[currplatform] == "undefined")){
            SXM.OnTheAir.Distribution = SXM.OnTheAir.Platforms["sirius"]; // default
        }else{
            if(typeof SXM.ChannelPlatforms[currplatform] == "undefined"){
                SXM.OnTheAir.Flags.Available = false;
            }else{
                SXM.OnTheAir.Distribution = SXM.OnTheAir.Platforms[currplatform]
                SXM.OnTheAir.Flags.Available = SXM.ChannelPlatforms[currplatform];
            }
        }
        if(SXM.OnTheAir.Flags.Available){
            $.ajax({                
                url: "/sxm_date_feed.tzi",
                cache:false,
                success: function(d, s, x){
                  SXM.OnTheAir.get(d);
                },
                error: function(x, s, e){
                  if (s == "parsererror" && x.status == 200 && x.responseText){
                      //SXM.NowPlaying(x.responseText);
                  }else{
                      //SXM.msg.error("Our program guide server is temporarily unavailable.  Please try again later.");
                  } 
                },
                dataType:"text"
            });
        }else{
            SXM.OnTheAir.NowPlaying.init();
            $("#on-the-air-loader").hide();
            $("#on-the-air-unavailable").show();
        }
    },
    get : function(d){
        SXM.OnTheAir.Timestamp = d;
        var epgURL = "/sxmepg/epg.sxmchepginfo.xmc?channelKeys="+SXM.OnTheAir.ContentID+"&distribution="+SXM.OnTheAir.Distribution.Code+"&tzone="+SXM.OnTheAir.Timezone;
        $.ajax({
            url: epgURL,
            type: 'GET',
            dataType: 'json',
            success: SXM.OnTheAir.load,
            error: function(xhr, status, error) {
                //console.log('Error '+xhr);console.log('Error '+status);console.log('Error '+error);
            }
        });
        var inittab = 0;
        $(".ota-tablist ul.tablist li").off("click").on("click", function(e){
            $(".channel-tabs-content").hide();
            $(".ota-tablist ul.tablist li").removeClass("current");
            var activetab = $(this).addClass("current").attr("data-content-id");
            $(".channel-tabs-content[id="+activetab+"]").show();
            e.preventDefault();
            return false;
        });
    },
    load : function(data){
        if(typeof data != "undefined" && data.status != "failed"){          
            SXM.OnTheAir.ShowsSchedule.init(data);
            SXM.OnTheAir.NowPlaying.init();
            SXM.OnTheAir.NowPlaying.PDT.init();
            SXM.OnTheAir.Hosts.init();
            SXM.OnTheAir.Highlights.init(data);
            SXM.OnTheAir.Shows.init(data);
            // jsa - temporary to assign theme colors to tabs
            var $p = $("<p></p>").hide().appendTo("body");
            $p.addClass("theme-color-primary");
            var themebg = $p.css("background-color");
            $p.remove();
            if(themebg.length > 0){
                $("<style type='text/css'> .tablist li.current a, .tablist li a:active{ background-color:"+themebg+" !important;} .tablist{border-bottom: 3px "+themebg+" solid !important}</style>").appendTo("head");
            }
            // end temp
            $("#on-the-air-loader").hide();
            $("#on-the-air-content").show();
            $(".ota-tablist ul.tablist li").removeClass("current").each(function(index) {
                if($(this).is(':visible')){                     
                    var activetab = $(this).addClass("current").attr("data-content-id");
                    $(".channel-tabs-content[id="+activetab+"]").show();
                    return false;
                }
            });
            // set up PDT interval
            var pdtseconds = 30; // how many seconds to wait before PDT updates
            var pdtmaxupdates = 250; // how many PDT updates before stopping. set to 0 to disable updates.
            var pdtupdatecount = 0; // initial
            function updatePDT(){               
                if(pdtupdatecount >= pdtmaxupdates){
                    stopPDT();
                    return;
                }
                pdtupdatecount++;
                SXM.OnTheAir.NowPlaying.PDT.init();
            }
            function stopPDT() { // call to stop PDT updates
              clearInterval(pdtinterval);
            }           
            var pdtinterval = setInterval(updatePDT, pdtseconds * 1000);            
        }
    },
    notavailable : function(){      
        $("#shows-schedules-content").html("<span class='no-schedule-info'>Sorry, no schedule information available.</span>");
        SXM.OnTheAir.NowPlaying.EPG.clear();
    },
    formatbroadcasttime : function(datestr){
        if (typeof datestr == "undefined"){return ""};
        var d = new Date(datestr.replace(/[.]/g, "/").substring(0, 16));
        var hh = d.getHours();
        var m = d.getMinutes();
        var dd = "am";
        var h = hh;
        if (h >= 12) {
            h = hh-12;
            dd = "pm";
        }
        if (h == 0) {
            h = 12;
        }
        m = m<10?"0"+m:m;
        var replacement = h+":"+m;
        replacement += " "+dd;      
        return replacement;
    },
    formatbroadcasttimes : function(start, end){
        var startstr = start.replace(/[.]/g, "/").substring(0, 10);
        var endstr = end.replace(/[.]/g, "/").substring(0, 10);         
        if(startstr != endstr){
            var starttime = SXM.OnTheAir.formatbroadcastdatetime(start, false);
            var endtime = SXM.OnTheAir.formatbroadcastdatetime(end, false);
        }else{
            var starttime = SXM.OnTheAir.formatbroadcasttime(start);
            var endtime = SXM.OnTheAir.formatbroadcasttime(end);
        }
        if(starttime === "" && endtime === "") return "";
        return starttime + " - " + endtime;
    },
    formatbroadcastdatetime : function(datestr, includetz){
        var arr = datestr.substring(0, 10).split(".");
        var year = arr[2];
        var month = (arr[0] - 1);
        var day = arr[1];       
        var d = new Date(year,month,day,0,0,0,0);
        var tzstring = "";
        if(includetz){
            tzstring = " " + SXM.OnTheAir.Timezone.substring(0, 1) + "T";
        }
        var rbdatestr = SXM.Days[d.getDay()].substring(0, 3) + " " + SXM.Months[d.getMonth()+1].substring(0, 3) + " " + d.getDate() + " " + SXM.OnTheAir.formatbroadcasttime(datestr) + tzstring;
        return rbdatestr;
    },
    getshowimageurl : function(imagecid){
        var imageurl = "";          
        if((typeof imagecid == "undefined") || imagecid === ""){
            imageurl = SXM.ChannelLogo76;
        }else{
            imageurl = SXM.OnTheAir.BlobURL+imagecid+"&ssbinary=true";
        }
        return imageurl;
    },
    connectTooltip : function($container, selector){       
        if($container.length > 0){
            var containerLeft = $container.offset().left;
            $(selector, $container).each(function() {
                
                //chakra
                var obj = $(this);
                var left = -2;
                var posLeft = obj.offset().left - containerLeft;
                if(posLeft > 860) {
                    left = -60;
                }
                obj.tooltip({
                     position: {
                         my: "center bottom-20",
                         at: "center top",
                         using: function( position, feedback ) {
                         $( this ).css( position );
                         $( "<div>" )
                         .addClass( "arrow" )
                         .addClass( feedback.vertical )
                         .addClass( feedback.horizontal )
                         .appendTo( this );
                         }
                         }
                    
                
                });
            
            
            
            
            });
        }
    },
    ShowsSchedule : {
        init : function(data){
            if((typeof data != "undefined") && 
                (typeof data.chEpgInfo != "undefined") && 
                (typeof data.chEpgInfo.dayChSchedules != "undefined") &&
                (data.chEpgInfo.dayChSchedules.length > 0)
                ){
                var source   = $("#shows-schedules-template").html();
                var template = Handlebars.compile(source);
                $("#shows-schedules-content").html(template(data));
                $("div#show-schedules div.module-content").eq(0).css({"display":"block","visibility":"visible"}); // show first tab
                $(".showday-tabs li").eq(0).addClass("theme-color-primary current");
                SXM.OnTheAir.ShowsSchedule.showallsetup();

                $("a.showstab").off("click").on("click", function(e){
                    var datestr = $(this).attr("data-epg-showsdate");
                    $("div#show-schedules div.module-content").css({"display":"none","visibility":"hidden"}); 
                    $("div#show-schedules div.module-content[data-epg-showsdate='"+datestr+"']").css({"display":"block","visibility":"visible"});
                    $(".showday-tabs li").removeClass("theme-color-primary current");
                    $(this).parent().addClass("theme-color-primary current");
                    $("div#show-schedules div.module-content div.hides").hide();                
                    e.stopPropagation();
                    return false;
                });
                $(".showday-tabs li").on("click", function(e){              
                    $("a", $(this)).trigger("click");
                    e.stopPropagation();
                    return false;
                });
                if(typeof SXM.favorites.addShow === "function"){
                    $("a.channel-favorite").off("click").on("click", function(){ //1121
                        $this = $(this);
                        var showId = $this.attr("data-fav");
                        if((""+showId).length > 0){ //IE hack : cast to string
                            if($this.hasClass("channel-favorite-active")){
                                SXM.favorites.removeShow(showId);
                                $("a[data-fav='"+showId+"']").removeClass("channel-favorite-active").html("<span class='hidden'>Add to My Favs *</span>");
                                $("a[data-fav='"+showId+"']").prop('title', 'Add to My Favs');
                            }else{                              
                                SXM.favorites.addShow(showId);
                                $("a[data-fav='"+showId+"']").addClass("channel-favorite-active").html("<span class='hidden'>Remove from My Favs *</span>");
                                $("a[data-fav='"+showId+"']").prop('title', 'Remove from My Favs');
                            }
                        }
                    });
                }
                $("li[data-content-id=shows-schedules-content]").show();
                if(typeof data.chEpgInfo.nowplaying.episode[0] != "undefined"){
                    SXM.OnTheAir.NowPlaying.EPG.init(data.chEpgInfo.nowplaying.episode);
                }
                SXM.OnTheAir.connectTooltip($("#show-schedules"),"a.channel-favorite,a.od-launch");
            }else{
                SXM.OnTheAir.notavailable();
            }
        },
        showstodisplay : 5,
        showalllabel : "Show All Shows",
        showlesslabel : "Show Fewer Shows",
        showallsetup : function(){ // set up "show all shows" functionality
            var options = {
                'labelmore' : 'Show All Shows',
                'labelless' : 'Show Fewer Shows',
                'itemselector' : 'div.shows div.show'}
            $("div#show-schedules div.module-content").showMore(options);
        }
    },
    Highlights : {
        init : function(data){
            if((typeof data != "undefined") && (typeof data.chEpgInfo != "undefined") && (typeof data.chEpgInfo.chhighlights != "undefined") && (typeof data.chEpgInfo.chhighlights.episode != "undefined")){
                if(data.chEpgInfo.chhighlights.episode.length > 0){
                    var source   = $("#highlights-template").html();
                    var template = Handlebars.compile(source);
                    $("#highlights-content").html(template(data));
                    SXM.OnTheAir.Highlights.showallsetup();
                    $("li[data-content-id=highlights-content]").show();
                }
            }
        },
        showallsetup : function(){ // set up "show all highlights" functionality
            var options = {
                'labelmore' : 'Show All Highlights',
                'labelless' : 'Show Fewer Highlights',
                'itemselector' : '.highlights div.show'}
            $("div#highlights-list div.module-content").showMore(options);
        }
    },
    Hosts : {
        init : function(){
            if((!SXM.OnTheAir.Flags.HostsRendered) && ($("#hosts-content").text().trim().length > 0)){
                $("li[data-content-id=hosts-content]").show();
                SXM.OnTheAir.Hosts.showallsetup();
                SXM.OnTheAir.Flags.HostsRendered = true;
            }
        },
        showallsetup : function(){ // set up "show all hosts" functionality
            var options = {
                'labelmore' : 'Show All Hosts',
                'labelless' : 'Show Fewer Hosts',
                'itemselector' : 'li'}
            $("div#hosts-content div.module-content ul.streamjockeys").showMore(options);
        }
    },
    NowPlaying : {
        init : function(){
            $("#on-the-air div.onair-timezone-platform a.onair-timezone").text(SXM.OnTheAir.Timezone);
            $("#on-the-air div.onair-timezone-platform a.onair-platform").text(SXM.OnTheAir.Distribution.Label);
            $("#SXM-tooltip").off("click", "a.tooltip-platform").on("click", "a.tooltip-platform", function(e){
                e.preventDefault();
                if($(this).hasClass("tooltip-link-inactive")){return false;}
                var dist = $(this).text();
                if((typeof dist != "undefined") && (dist.length > 0)){                  
                    var selectedplatform = "sirius"; //default
                    if(dist.toUpperCase() === "XM"){                        
                        selectedplatform = "xm"
                    }
                    else if(dist.toUpperCase() === "SIRIUSXM"){                     
                        selectedplatform = "siriusxm"
                    }
                    $(".tooltip-platform").removeClass("tooltip-link-inactive");
                    $(this).addClass("tooltip-link-inactive");
                    SXM.ChannelCurrentPlatform = selectedplatform;
                    SXM.OnTheAir.init(SXM.OnTheAir.ContentID, SXM.OnTheAir.Timezone, SXM.ChannelCurrentPlatform, SXM.ChannelPlatforms); // reload data
                    if(typeof SXM.favorites.setPlatform == "function"){ // set cookie
                        SXM.favorites.setPlatform(selectedplatform);
                    }
                }
                return false;
            });
            $("#SXM-tooltip").off("click", "a.tooltip-timezone").on("click", "a.tooltip-timezone", function(e){
                e.preventDefault();
                if($(this).hasClass("tooltip-link-inactive")){return false;}
                var tz = $(this).text();
                if((typeof tz != "undefined") && (tz.length > 0)){
                    if(tz.toUpperCase() === "ET"){
                        SXM.OnTheAir.Timezone = "Eastern";
                    }
                    else if(tz.toUpperCase() === "CT"){
                        SXM.OnTheAir.Timezone = "Central";
                    }
                    else if(tz.toUpperCase() === "MT"){
                        SXM.OnTheAir.Timezone = "Mountain";
                    }
                    else if(tz.toUpperCase() === "PT"){
                        SXM.OnTheAir.Timezone = "Pacific";
                    }
                    $(".tooltip-timezone").removeClass("tooltip-link-inactive");
                    $(this).addClass("tooltip-link-inactive");
                    SXM.OnTheAir.init(SXM.OnTheAir.ContentID, SXM.OnTheAir.Timezone, SXM.ChannelCurrentPlatform, SXM.ChannelPlatforms); // reload data
                    if(typeof SXM.favorites.setTimezone == "function"){ // set cookie
                        SXM.favorites.setTimezone(SXM.OnTheAir.Timezone.substring(0, 1));
                    }
                }
                return false;
            });     
            $("#tooltip-100").bind("mouseover", function(){ // reset tz state in popup
                $(".tooltip-timezone").removeClass("tooltip-link-inactive");            
                var $a;
                if(SXM.OnTheAir.Timezone == "Eastern"){
                    $a = $(".tooltip-timezone:contains('ET')");
                }
                else if(SXM.OnTheAir.Timezone == "Central"){
                    $a = $(".tooltip-timezone:contains('CT')");
                }
                else if(SXM.OnTheAir.Timezone == "Mountain"){
                    $a = $(".tooltip-timezone:contains('MT')");
                }
                else if(SXM.OnTheAir.Timezone == "Pacific"){
                    $a = $(".tooltip-timezone:contains('PT')");
                }
                if(typeof $a != "undefined" && $a.length > 0){
                    $a.addClass("tooltip-link-inactive");
                }
            });
            $("#tooltip-200").bind("mouseover", function(){ // reset platform state in popup            
                $(".tooltip-platform").removeClass("tooltip-link-inactive");            
                var $a;
                if(SXM.OnTheAir.Distribution.Label == "Sirius"){
                    $a = $(".tooltip-platform").filter(function(index) { return $(this).text() === "Sirius"; });
                }
                else if(SXM.OnTheAir.Distribution.Label == "XM"){
                    $a = $(".tooltip-platform").filter(function(index) { return $(this).text() === "XM"; });
                }
                else if(SXM.OnTheAir.Distribution.Label == "SiriusXM"){
                    $a = $(".tooltip-platform").filter(function(index) { return $(this).text() === "SiriusXM"; });
                }
                if(typeof $a != "undefined" && $a.length > 0){
                    $a.addClass("tooltip-link-inactive");
                }
            });
            if(typeof SXM.favorites.loadShows === "function"){ // light up favs
                SXM.favorites.loadShows();
                for(p in SXM.favorites.series){
                    if (SXM.favorites.series.hasOwnProperty(p)) {                           
                        $("a[data-fav='"+SXM.favorites.series[p]+"']").addClass("channel-favorite-active").html("<span class='hidden'>Remove from My Favs</span>");
                        //chakra  todo:
                        $("a[data-fav='"+SXM.favorites.series[p]+"']").prop('title', 'Remove from My Favs');
                    }
                };
            }
        },
        PDT : {
            init : function(){ // get datestamp
                if(typeof SXM.OnTheAirNow != "undefined" && SXM.OnTheAirNow.toLowerCase() == "yes" && SXM.OnTheAir.Flags.Available == true){                    
                    $.ajax({
                        url:"/sxm_date_feed.tzi",
                        cache:false,
                        success: function(d, s, x){
                          SXM.OnTheAir.NowPlaying.PDT.load(d);
                        },
                        error: function(x, s, e){
                          if (s == "parsererror" && x.status == 200 && x.responseText){
                              //SXM.NowPlaying(x.responseText);
                          }else{
                              //SXM.msg.error("Our program guide server is temporarily unavailable.  Please try again later.");
                          } 
                        },
                        dataType:"text"
                    });
                } else {
                    $("#onair-show").css("width", "100%");
                    $("#onair-show .description").css("width", "605px");
                }
            },
            load : function(d){
                SXM.OnTheAir.Timestamp = d;
                var padurl = "/metadata/pdt/en-us/json/channels/" + SXM.OnTheAir.ContentID + "/timestamp/";
                var t = d.split(",");
                var currentDate = t[0];
                var hr = parseInt(currentDate.substring(8, 10), 10);
                var yy = parseInt(currentDate.substring(4, 8), 10);
                var dd = parseInt(currentDate.substring(0, 2), 10);
                var sec = parseInt(currentDate.substring(12, 14), 10);
                var mm = parseInt(currentDate.substring(2, 4), 10);
                var mi = parseInt(currentDate.substring(10, 12), 10);
                var lbtzone = t[1];
                var lbdate = new Date(yy + "/" + mm + "/" + dd);
                var dow = SXM.Days[lbdate.getDay()];
                var month = SXM.Months[mm];
                var dateStr = dow + ", " + dd + " " + month + " " + yy + " " + hr + ":" + mi + ":" + sec + " " + lbtzone;
                lbdate = new Date(dateStr);
                var utcMM = lbdate.getUTCMonth() < 9 ? ("0" + (lbdate.getUTCMonth() + 1)) : (lbdate.getUTCMonth() + 1);
                var utcDD = lbdate.getUTCDate() < 10 ? "0" + lbdate.getUTCDate() : lbdate.getUTCDate();
                var utcHR = lbdate.getUTCHours() < 10 ? "0" + lbdate.getUTCHours() : lbdate.getUTCHours();
                var utcMI = lbdate.getUTCMinutes() < 10 ? "0" + lbdate.getUTCMinutes() : lbdate.getUTCMinutes();
                var utcdateFormat = utcMM + "-" + utcDD + "-" + utcHR + ":" + utcMI + ":00";
                padurl += utcdateFormat;
                $.ajax({
                    url: padurl,
                    cache: true,
                    dataType: "json",
                    type: "GET",
                    success: SXM.OnTheAir.NowPlaying.PDT.showpdt
                });
            },
            showpdt : function(data){ // get album art              
                if(typeof data != "undefined"){
                    var albumarturl = "";
                    if((typeof data.channelMetadataResponse != "undefined") && (typeof data.channelMetadataResponse.metaData != "undefined") && (typeof data.channelMetadataResponse.metaData.currentEvent != "undefined")){
                        var ce = data.channelMetadataResponse.metaData.currentEvent;
                        if(typeof ce != "undefined"){
                            if((typeof ce.song != "undefined") && (typeof ce.song.creativeArts != "undefined")){
                                var a = ce.song.creativeArts;
                                if((typeof a != "undefined") && (a.length > 1)){
                                    for(i=0;i<(a.length-1);i++){
                                        if((typeof a[i].size != "undefined") && (a[i].size === "THUMBNAIL")){
                                            if((typeof ce.baseUrl != "undefined") && (typeof a[i] != "undefined")){
                                                albumarturl = ce.baseUrl + a[i].url;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if(albumarturl != ""){
                                $("#onair-pdt img").attr("src", albumarturl);
                            }
                            if((typeof ce.artists != "undefined") && (typeof ce.artists.name != "undefined")){
                                $("#onair-pdt p.onair-pdt-artist").text(ce.artists.name);
                            }
                            if((typeof ce.song != "undefined") && (typeof ce.song.name != "undefined")){
                                $("#onair-pdt p.onair-pdt-song").text(ce.song.name);
                            }
                            $("#onair-pdt").show();
                        }
                    }
                }
            },
            parseServerTime : function(s){
              s = s.split(",");
              var d = s[0];
              var dd = parseInt(d.substring(0,2),10);
              var mm = parseInt(d.substring(2,4),10)-1;
              var yy = parseInt(d.substring(4,8),10);
              var hr = parseInt(d.substring(8,10),10);
              var mi = parseInt(d.substring(10,12),10);
              var ss = parseInt(d.substring(12),10);
              var st = new Date(yy,mm,dd,hr,mi,ss,00); //server time
              var z = s[1];
              return {time:st, tz:z};
            }
        },
        EPG : {
            init : function(episode){               
                var t = SXM.OnTheAir.Timestamp.split(",");
                var currentDate = t[0];
                var hr = parseInt(currentDate.substring(8, 10), 10);
                var yy = parseInt(currentDate.substring(4, 8), 10);
                var dd = parseInt(currentDate.substring(0, 2), 10);
                var sec = parseInt(currentDate.substring(12, 14), 10);
                var mm = parseInt(currentDate.substring(2, 4), 10);
                var mi = parseInt(currentDate.substring(10, 12), 10);
                var lbtzone = t[1];
                var lbdate = new Date(yy + "/" + mm + "/" + dd);
                var dow = SXM.Days[lbdate.getDay()];
                var month = SXM.Months[mm];
                var dateStr = dow + ", " + dd + " " + month + " " + yy + " " + hr + ":" + mi + ":" + sec + " " + lbtzone;
                lbdate = new Date(dateStr);
                var utcYYYY = lbdate.getUTCFullYear();
                var utcMM = lbdate.getUTCMonth();
                var utcDD = lbdate.getUTCDate();
                var utcHR = lbdate.getUTCHours();
                var utcMI = lbdate.getUTCMinutes();             
                var utclbdate = new Date(utcYYYY,utcMM,utcDD,utcHR,utcMI,0,0);
                if(typeof episode != "undefined" && episode.length === 2 && typeof episode[0].sc != "undefined" && typeof episode[0].sc.sTimeStrUTC != "undefined"){
                    var arr = episode[1].sc.sTimeStrUTC.split(".");
                    var year = arr[2].substring(0,4);
                    var month = (arr[0] - 1);
                    var day = arr[1];
                    var hour = arr[2].substring(5,7);
                    var min = arr[2].substring(8,10);
                    var d = new Date(year,month,day,hour,min,0,0);
                    var nowplayingshow = null;                  
                    if(utclbdate.getTime() >= d.getTime()){
                        nowplayingshow = episode[1];
                    } else {
                        nowplayingshow = episode[0]
                    }
                    SXM.OnTheAir.NowPlaying.EPG.show(nowplayingshow);
                }
            },
            show : function(show){
                if(typeof show != "undefined"){
                    $("#onair-show span.title").text(show.pr.pName);
                    $("#onair-show span.time").text(SXM.OnTheAir.formatbroadcasttimes(show.sc.sTimeStr, show.sc.eTimeStr));
                    $("#onair-show span.description").html(show.pr.shortDesc);
                    $("#onair-show div.shows-thumb").css("background", "url("+SXM.OnTheAir.getshowimageurl(show.pr.logo)+")");
                    if(typeof show.pgType != "undefined" && show.pgType === "series"){ 
                        $("#onair-show a.channel-favorite").attr("data-fav", show.pgid);                        
                    } else {
                        $("#onair-show a.channel-favorite").hide(); // fav for series only
                    }                   
                    if(show.pr.od == "1"){
                        var pname = ":";
                        if(show.pr.pName != "undefined"){
                            pname = show.pr.pName + ":";
                        }
                        //var html = "<a target=\"_blank\" href=\"/player\" class=\"od-launch\" data-tracking-lid=\""+pname+"\" title=\"Available On Demand\"><div class=\"on-demand-play-19\"></div><span class=\"hidden\">Available On Demand</span></a>";
                        var html = "<div class=\"on-demand-play-19\" title=\"Available On Demand\" style=\"cursor: default;\"></div><span class=\"hidden\">Available On Demand</span>";
                        $("#onair-show div.shows-thumb").html(html);                        
                    }                   
                    SXM.OnTheAir.connectTooltip($("#onair-show"),"a.channel-favorite,a.od-launch");                 
                    $("#onair-show").show();
                }
            },
            clear : function(){
                $("#onair-show span.title").text("");
                $("#onair-show span.time").text("");
                $("#onair-show span.description").text("");
                $("#onair-show div.shows-thumb").css("background", "none");
                $("#onair-show").hide();
            }
        }
    },
    Shows : {
        init : function(data){      
            if((typeof ogp != "undefined") && (typeof ogp.contentid != "undefined") && (typeof ogp.shows != "undefined") && ($(ogp.shows).length > 0) && (typeof data !=" undefined") && (typeof data.chEpgInfo !=" undefined") && (typeof data.chEpgInfo.pg !=" undefined")  && (data.chEpgInfo.pg.length > 0)){
                if(ogp.contentid == SXM.OnTheAir.ContentID){
                    var ogpobj = {shows:[]};                    
                    $(ogp.shows).each(function(index) {
                        var cridmatch = false;                      
                        var show = this;                        
                        var nocrid=((typeof show.crid === "undefined") || (show.crid === ""))?true:false;                       
                        $(data.chEpgInfo.pg).each(function(index) {                         
                            if((typeof this.crid !== "undefined") || (this.crid !== "")){
                                if(this.crid === show.crid){
                                    cridmatch = true;
                                    if(show.alwaysdisplay !== "yes"){
                                        show.body = this.desc;
                                        show.thumbnailimage = this.logo;
                                        show.title = this.name;
                                        show.od = this.od;
                                    }
                                    return false;
                                }
                            }
                        });                     
                        if(cridmatch || (show.alwaysdisplay === "yes")){                        
                            ogpobj.shows.push(show);
                        }
                    });
                    if(ogpobj.shows.length > 0){
                        var source   = $("#shows-template").html();
                        var template = Handlebars.compile(source);
                        $("#shows-content").html(template(ogpobj));
                        SXM.OnTheAir.Shows.showallsetup();
                        $("li[data-content-id=shows-content]").show();                  
                    }                   
                    SXM.OnTheAir.connectTooltip($("#shows"),"a.od-launch");
                }
            }
        },
        showallsetup : function(){ // set up "show all shows" functionality
            var options = {
                'labelmore' : 'Show All Shows',
                'labelless' : 'Show Fewer Shows',
                'itemselector' : 'ul.shows li'}
            $("div#shows div.module-content").showMore(options);
        }
    }
}
$(document).ready(function () {
    SXM.OnTheAir.init(SXM.ChannelContentID, SXM.ChannelTimezone, SXM.ChannelCurrentPlatform, SXM.ChannelPlatforms);
});