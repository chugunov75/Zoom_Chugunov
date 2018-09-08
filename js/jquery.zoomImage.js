(function($){
	jQuery.fn.zoomImage=function(options){
/*
	Настраиваемые параметры:
		---scale - кратность увеличения; должен быть больше 1; значение по-умолчанию 4;
		---innerZoom - параметр, определяющий где будет размещено увеличенное изображение: при innerZoom==true - там же где и исходное, 
		иначе - рядом с ним; значение по-умолчанию true;
		---shadow - параметр, определяющий будет ли использоваться перекрывающий слой над исходным изображением;
		значение по-умолчанию true (будет использоваться); при innerZoom==true игнорируется;
		---cssWidth - параметр, определяющий будет ли использоваться заданная в стилях ширина для 
		дополнительного элемента с увеличенным изображением;
		значение по-умолчанию false (в этом случае ширина для дополнительного элемента 
		будет задана как наибольшее из значений ширины и высоты исходного изображения); при innerZoom==true игнорируется;
*/
		options=$.extend({
			scale: 4,
			innerZoom: true,
			shadow: true,
			cssWidth: false,
		},options);

		/*контейнер с изображением, подлежащим увеличению*/
		var zoommedImageContainer=null; 
		/*курсор-увеличитель; в режиме innerZoom невидим*/
		var zoomCursor=null; 
		
		var shadowPresents=options.shadow; 
		/*перекрывающий слой над исходным изображением*/
		var shadow=null; 
		
		var scale=options.scale<1? 1 : options.scale; 
		
		var inner=options.innerZoom;
		/*увеличенное изображение*/
		var bigImg=null;
/*переменные для хранения значений ширины границы и отступа с соответствующих сторон родительского контейнера*/
		var parentClientLeft=0;
		var parentClientTop=0;

		
/*---функции initZoomInner и initZoomOuter создают дополнительные элементы, необходимые для просмотра увеличенного изображения в соответствующем режиме*/
		function initZoomInner(){

			bigImg=$('<img src="" alt="" class="zoom-big-image">').appendTo(zoommedImageContainer).css('position', 'absolute');

			bigImg.prop('src',zoommedImageContainer.data('image-src'));

			zoomCursor=$('<div class="zoom-cursor"></div>').appendTo(zoommedImageContainer);

			zoomCursor.css({
				'width':(zoommedImageContainer.width()/scale)+'px',
				'height':(zoommedImageContainer.height()/scale)+'px',
				'border':'none',
			});

			bigImg.width(bigImg.parent().width()*scale);
			bigImg.height(bigImg.parent().height()*scale);
		}

		function initZoomOuter(){
			if(shadowPresents){
				shadow=$('<div class="zoom-shadow"></div>').appendTo(zoommedImageContainer);
			}
			
			zoomCursor=$('<div class="zoom-cursor"></div>').appendTo(zoommedImageContainer);
			zoommedImageContainer.wrap('<div></div>');
			zoommedImageContainer.parent().css('position','relative');
			// zoommedImageContainer.parent().width(zoommedImageContainer.outerWidth());


			bigImg=$('<div class="zoom-big-image-container"><img src="" alt=""></div>').appendTo(zoommedImageContainer.parent()).children('img');
			bigImg.prop('src',zoommedImageContainer.data('image-src'));

			if(!options.cssWidth){
				var size=zoommedImageContainer.width()>zoommedImageContainer.height()?(zoommedImageContainer.width()):(zoommedImageContainer.height());
				bigImg.parent().width(size);
			}
			
			
			bigImg.parent().height(bigImg.parent().width());			
			bigImg.width(zoommedImageContainer.width()*scale);
			bigImg.height(zoommedImageContainer.height()*scale);

			zoomCursor.css({
				'width':(bigImg.parent().width()/scale)+'px',
				'height':(bigImg.parent().height()/scale)+'px',
			});
			if(shadowPresents){
				zoomCursor.css({
					'background':'url("'+zoommedImageContainer.children('img').attr('src')+'") no-repeat',
					'background-size':zoommedImageContainer.width()+'px '+zoommedImageContainer.height()+'px',
					'background-origin': 'border-box',
				});
			}

		}
/*в переменную move записывается анонимная функция, принимающая объект события и управляющая перемещением всех необходимых элементов
в зависимости от режима увеличения*/
		var move=null;

		if(!inner && shadowPresents){
			move=function(e){
				moveZoom(e);
				zoomImg();
				moveZoomBackground();
			};
		}
		else{
			move=function(e){
				moveZoom(e);
				zoomImg();
			};
		}
/*mouseMove, mouseEnter и mouseLeave - обработчики соответствующих событий; 
mouseEnter создает дополнительные элементы, необходимые для просмотра увеличенного изображения, а
mouseLeave уничтожает их*/
		function mouseMove(e){
			if(zoommedImageContainer){
				move(e);
			}
		}
		function mouseEnter(e){

			if(!zoommedImageContainer){
				zoommedImageContainer=$(this);

				if(inner){
					initZoomInner();
				}
				else{
					initZoomOuter();
					setZoomImg();
				}

				parentClientLeft=Math.ceil((zoommedImageContainer.outerWidth()-zoommedImageContainer.width())/2);

				parentClientTop=Math.ceil((zoommedImageContainer.outerHeight()-zoommedImageContainer.height())/2);

				move(e);	
			}
		}

		function mouseLeave(e){
			if(zoommedImageContainer){
				zoomCursor.remove();
				zoomCursor=null;
				if(shadow){
					shadow.remove();
					shadow=null;
				}
				if(!inner){
					zoommedImageContainer.unwrap();
					bigImg.parent().remove();
				}
				zoommedImageContainer=null;
				bigImg.remove();
				bigImg=null;

			}
		}
/*функция, перемещающая курсор; принимает объект события в качестве параметра*/
		function moveZoom(e){
			var nextX=e.pageX-Math.floor(zoomCursor.outerWidth()/2);
			var nextY=e.pageY-Math.floor(zoomCursor.outerHeight()/2);

			// zoomCursor.offset({left: e.pageX-zoomCursor.outerWidth()/2, top:  e.pageY-zoomCursor.outerHeight()/2});

			if(nextX<=zoommedImageContainer.offset().left+parentClientLeft){
				zoomCursor.offset(function(index,value){
					return {
						left: zoommedImageContainer.offset().left+parentClientLeft,
						top: value.top,
					};
				});
			}
			else if(nextX>=zoommedImageContainer.offset().left-parentClientLeft+zoommedImageContainer.outerWidth()-zoomCursor.outerWidth()){
				zoomCursor.offset(function(index,value){
					return {
						left: zoommedImageContainer.offset().left-parentClientLeft+zoommedImageContainer.outerWidth()-zoomCursor.outerWidth(),
						top: value.top,
					};
				});
			}
			else{
				zoomCursor.offset(function(index,value){
					return {
						left: nextX,
						top: value.top,
					};
				});
			}
			if(nextY<=zoommedImageContainer.offset().top+parentClientTop){
				zoomCursor.offset(function(index,value){
					return {
						left: value.left,
						top: zoommedImageContainer.offset().top+parentClientTop,
					};
				});
			}
			else if(nextY>=zoommedImageContainer.offset().top+zoommedImageContainer.outerHeight()-parentClientTop-zoomCursor.outerHeight()){

				zoomCursor.offset(function(index,value){
					return {
						left: value.left,
						top: zoommedImageContainer.offset().top+zoommedImageContainer.outerHeight()-parentClientTop-zoomCursor.outerHeight(),
					};
				});
				
			}
			else{
				zoomCursor.offset(function(index,value){
					return {
						left: value.left,
						top: nextY,
					};
				});
			}
			
		}
/*функция, перемещающая фоновое изображение курсора; применяется при использовании слоя, перекрывающего исходное изображение*/
		function moveZoomBackground(){
			zoomCursor.css({'background-position-x':Math.floor((zoommedImageContainer.offset().left+parentClientLeft-zoomCursor.offset().left-(zoomCursor.outerWidth()-zoomCursor.width())/2))+'px ',
				'background-position-y':Math.floor((zoommedImageContainer.offset().top+parentClientTop-zoomCursor.offset().top-(zoomCursor.outerHeight()-zoomCursor.height())/2))+'px'});
		}
/*функция, перемещающая увеличенное изображение*/
		function zoomImg(){
			var posX=(zoommedImageContainer.offset().left+parentClientLeft-zoomCursor.offset().left)/zoommedImageContainer.width();
			var posY=(zoommedImageContainer.offset().top+parentClientTop-zoomCursor.offset().top)/zoommedImageContainer.height();

			bigImg.offset(function(index,value){

				return {
					left: bigImg.parent().offset().left+(bigImg.parent().outerWidth()-bigImg.parent().width())/2+posX*bigImg.width(),
					top: bigImg.parent().offset().top+(bigImg.parent().outerHeight()-bigImg.parent().height())/2+posY*bigImg.height(),
				};
			});
		}
/*функция, подбирающая местоположение увеличенного изображения, если последнее располагается рядом с исходным */
		function setZoomImg(){

			var img=bigImg.parent();
			var windowWidth=$(window).width();
			var windowHeight=$(window).height();
			var clientLeft=zoommedImageContainer.offset().left-$(document).scrollLeft();
			var clientTop=zoommedImageContainer.offset().top-$(document).scrollTop();
			
			if(windowWidth-clientLeft-zoommedImageContainer.outerWidth()>=img.outerWidth()){
				if(windowHeight-clientTop>=img.outerHeight()){
					bigImg.parent().offset(function(i,value){
						return {
							left: (zoommedImageContainer.offset().left+ zoommedImageContainer.outerWidth()  +2),
							top: (zoommedImageContainer.offset().top),
						};
					});
				}
				else{
					bigImg.parent().offset(function(i,value){
						return {
							left: (zoommedImageContainer.offset().left+ zoommedImageContainer.outerWidth()  +2),
							top: (windowHeight+$(document).scrollTop()-img.outerWidth())
						};
					});
				}
			}
			else if(clientLeft>=img.outerWidth()){
				if(windowHeight-clientTop>=img.outerHeight()){
					bigImg.parent().offset(function(i,value){
						return {
							left: (zoommedImageContainer.offset().left- img.outerWidth()  -2),
							top: (zoommedImageContainer.offset().top)
						};
					});
				}
				else{
					bigImg.parent().offset(function(i,value){
						return {
							left: (zoommedImageContainer.offset().left- img.outerWidth()  -2),
							top: (windowHeight+$(document).scrollTop()-img.outerWidth())
						};
					});
				}
				
			}
			else if(windowHeight-clientTop-zoommedImageContainer.outerHeight()>=img.outerHeight()){
				bigImg.parent().offset(function(i,value){
					return {
						left: (zoommedImageContainer.offset().left-(img.outerWidth()-zoommedImageContainer.outerWidth())/2),
						top: (zoommedImageContainer.offset().top + zoommedImageContainer.outerHeight()+2)
					};
				});
			}
			else{
				bigImg.parent().offset(function(i,value){
					return {
						left: (zoommedImageContainer.offset().left-(img.outerWidth()-zoommedImageContainer.outerWidth())/2),
						top: (zoommedImageContainer.offset().top - img.outerHeight()-2)
					};
				});
			}
			
		}
/*функция, устанавливающая необходимые обработчики на каждый элемент выборки*/
		var make=function(){
			$(this).on({
					'mouseenter': mouseEnter,
					'mousemove': mouseMove,
					'mouseleave':mouseLeave,
				});			
		};

		return this.each(make);
	};
})(jQuery);