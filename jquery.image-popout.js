(function($) {
	//base function to call and setup everything
	$.fn.imagefan=function(options){
		return this.each(function(){
			if(this._fanned) return; //no need to do this stuff if its already a fan
			else this._fanned = elecount;			
			var params = $.extend({}, $.fn.imagefan.defaults, options); //merge the params
			H[elecount] = {params:params, 
										container:this, 
										oheight:jQ(this).find('li').outerHeight(),
										oleft:0, 
										otop:0,
										oheight:0,
										items:{}, 
										item_count:0,
										slicewidth:0,
										litop:0,
										omaxheight:0,
										active_item:-1};			
			$.imagefan.init(elecount);
			elecount++;
		});
	};

	//the default config vars
	$.fn.imagefan.defaults = {padding:10,borderwidth:2, delay:230, liheight:false};
	//the over riden stuff
	$.imagefan = {
		hash:{}, //the hash used to store all the configs & targets
		init:function(ele){
			var h = H[ele], container=h.container, params=h.params;			
			$.imagefan.preload(container, function(){
				$.imagefan.mark_with_classes(container, h);
				$.imagefan.ele_heights_positions(ele,container, h);				
			});
			$.imagefan.hoveractions(ele,container, h);
		},	
		preload:function(container, after_function){
			jQ(container).find('img').each(function(){
				var pimg = this;
				jQ("<img />").attr("src", jQ(this).attr('src')).load(function(){
					jQ(pimg).addClass('loaded');						
				});
			});
			after_function();
		},
		mark_with_classes:function(container, h){
			var count=0;
			//find all lis, add them to items hash for later usage
			jQ(container).find('li').each(function(){				
				this._fanitem = count;			
				h.items[count] = this; 
				this._fanw = jQ(this).outerWidth();
				this._fant = jQ(this).eq(0).offset().top;
				this._fanh = jQ(this).outerHeight();
				this._fanimh = jQ(this).find('span.image:first').outerHeight();
				jQ(this).addClass('fanned').addClass('fan-'+count);
				jQ(this).find('span.image').css({'height': this._fanimh+'px', 'overflow':'hidden'});				
				count++;
			});			
			h.item_count = count;
		},
		ele_heights_positions:function(ele,container,h){
			var minh=99999,maxh=0;
			//find the min height of the images to keep the images at the same height
			jQ(container).find('img').each(function(){
				if(jQ(this).outerHeight() < minh) minh=jQ(this).outerHeight();
				if(jQ(this).outerHeight() > maxh) maxh=jQ(this).outerHeight();
			}); 			
			if(h.params.liheight){
				minh=h.params.liheight;
				maxh=minh+h.params.padding;
			}
			//container position
			h.oleft = jQ(container).eq(0).offset().left;
			h.otop = jQ(container).eq(0).offset().top;
			h.ow = jQ(container).outerWidth();
			h.litop = maxh-minh;
			maxh+= h.params.padding*2;
			h.oheight = minh;			
			h.omaxheight = maxh;
			$.imagefan.init_move(ele);
		},
		init_move:function(ele){
			var h = H[ele], container=h.container, params=h.params;
			jQ(container).find('.active,.highlight').removeClass('active').removeClass('highlight');
			//fix the container to be absolute positioned inorder to do overflow hidden
			jQ(container).css({'overflow':'hidden','height':h.oheight+'px','position':'absolute', 'left':h.oleft+'px', 'top':h.otop+'px'}).find('li.fanned').css({'height': h.oheight+'px', 'overflow':'hidden'});
			jQ(container).parent().css('height', (h.oheight+params.padding)+'px');
			//containers width
			h.slicewidth = Math.round(jQ(container).outerWidth()/h.item_count);
			//resize the lis and position them
			jQ(container).find('li').each(function(){
				var newlft=(this._fanitem*h.slicewidth);
				this._fanlft=newlft;
				jQ(this).css({'width': h.slicewidth+'px', 'position':'absolute', 'padding':'0px','left':newlft+'px','top':h.litop+'px'},'fast' );
			});
		},
		hoveractions:function(ele, container,h){
			jQ(container).hover(function(){},
			function(){
				h.active_item=-1;
				timer = setTimeout("$.imagefan.init_move("+ele+");",1500);				
			});
			jQ(container).find('li').hover(
				function(){
					clearTimeout(timer);
					if(this._fanitem != h.active_item){
						if(!jQ(this).hasClass('active')) jQ(this).addClass('highlight').find('span.image').css('height', (h.oheight-(h.params.borderwidth*2))+'px');		
						timer = setTimeout("$.imagefan.move("+ele+","+this._fanitem+");", h.params.delay);
					}
				}, 
				function(){clearTimeout(timer);}
			);
			
		},
		move:function(ele, itemnumber){
			clearTimeout(timer);
			var h = H[ele], originalwidth = h.items[itemnumber]._fanw, expanded_height = h.items[itemnumber]._fanh;
			if(itemnumber+1 == h.item_count || itemnumber==0) var moveby = (originalwidth - h.slicewidth);
			else var moveby = (originalwidth - h.slicewidth)/2;
			for(i in h.items){
				if(i != itemnumber){
					var mymove = moveby;
					if(i<itemnumber) mymove = (h.items[i]._fanlft - mymove); //if less than i then we need to move to the left
					else mymove = (h.items[i]._fanlft + mymove)+h.params.padding*2
					jQ(h.container).find('li.fan-'+i).css({'padding':'0px', 'top':h.litop+'px'}).stop().animate({'left':(mymove)+'px', width:h.slicewidth+'px','height':h.oheight+'px'},'fast').removeClass('active');
				}				
				
			}
			jQ(h.container).find('li.fanned, span.image').css('height',h.oheight+'px').removeClass('highlight');
			if(itemnumber==0) var newlft = 0;
			else if(itemnumber+1 == h.item_count) var newlft = (h.ow - (originalwidth+(h.params.padding*2) ));
			else var newlft = h.items[itemnumber]._fanlft - (moveby);
			jQ(h.container).find('li.fan-'+itemnumber).stop().animate({'width':(originalwidth)+'px', left:newlft+'px'},'fast').css('padding','0 '+h.params.padding+'px').addClass('active');
			jQ(h.container).find('li.fan-'+itemnumber +' span.image');
			
			jQ(h.container).css({'height':(expanded_height+(h.params.padding*2))+'px'}).find('li.fan-'+itemnumber).animate({'height':(expanded_height+(h.params.padding*2))+'px', 'top':'0px'},'fast').css('padding', h.params.padding+'px');
			jQ(h.container).find('li.fan-'+itemnumber +' span.image:first').css('height', h.items[itemnumber]._fanimh+'px');
			jQ(h.container).find('.highlight').removeClass('highlight').find('span.image').css('height', (h.oheight)+'px');
			h.active_item = itemnumber;
		}
	};
	var jQ=jQuery, elecount=0, timer=false,H=$.imagefan.hash, elecount=0,ie6=$.browser.msie&&($.browser.version == "6.0");
	
})(jQuery);