/*!
* panelGroup 1.0-beta3
*
* Written by Nathan Shubert-Harbison for Domain7 (www.domain7.com) with major
* contributions (like MAJOR) from Reuben Moes.
* 
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
*/

(function($) {

	var pg = {
		defaults: {
			type: "auto", // options: tabs, accordion, auto (reads data attribute)
			defaultType: 'tabs',
			selectors: {
				item: '.item',
				header: '.item-header',
				content: '.item-content'
			},
			flexTabNav: true,
			tabNavClasses: '',
			tabItemsClasses: '',
			accordionSpeed: 300,
			openTabTrigger: 'click',
			openAccordionTrigger: 'click',
			firstAccordionOpen: true,
			onlyKeepOneOpen: true
		},
		//settings: false,
		typeOptions: ['tab', 'accordion'],
		typeDefault: 'tab',
		keycodes: {
			left: 37,
			up: 38,
			right: 39,
			down: 40
		},

		init: function(that, options) {

			var settings = $.extend({}, pg.defaults, options );
			$(that).data('panelGroup', settings);

			// Cache the original element. This is for switching to a different group type.
			//NOTE: this approach is going to remove any binding.
			settings.originalHTML = $(that).clone().html();

			// Do the proper operation depending on grouping type
			switch ( settings.type ) {

				case 'tabs':
					pg.makeTabs($(that));
					break;

				case 'accordion':
					pg.makeAccordion($(that));
					break;

				case 'auto':

					// Get the group type set in the group-type data attribute
					var type = $(that).data('group-type');

					// If the type set isn't valid use the default
					if ( pg.typeOptions.indexOf(type) == '-1' ) {
						type = 'tabs';
					}

					switch ( type ) {
						case 'tabs':
							pg.makeTabs($(that));
							break;
						case 'accordion':
							pg.makeAccordion($(that));
							break;
						default:
							break;
					}

					break;

				default:
					break;

			} // switch settings.type

		}, // init

		makeTabs: function(that) {

			// Create the markup neccesary for tabs

				// Header and items containers
				var settings = $(that).data('panelGroup'),
				    nav = $('<ul class="tab-nav" role="tablist">'),
					navWrapper = $('<div class="tab-nav-wrapper">'),
					navTitle = $(that).data('tab-nav-title'),
				    navItems = [],
				    navItemsWidth,
				    items,
				    tabindex,
				    ariaSelected,
				    ariaHidden,
				    tabHeaderText,
				    tabID,
				    panelID,
				    randomNumber = Math.floor(Math.random() * 100000000),
				    content = $('<div class="tab-items">').addClass(settings.tabItemsClasses);

				//Update the current state
				$(that).data('groupType', 'tabs');

				navWrapper.addClass(settings.tabNavClasses);
				if(navTitle){
					navWrapper.prepend('<h4 class="tab-nav-title">'+navTitle+'</h4>');
				}

				navWrapper.append(nav);

				that.addClass('tabs');

				// Iterate through each item and build the headers
				that.find(settings.selectors.item).each(function(index) {

					// First one is tabindex and focused
					tabindex = index == 0 ? '0' : '-1';
					ariaSelected = index == 0 ? 'true' : 'false';
					ariaHidden = index == 0 ? 'false' : 'true';

					// Create an ID for the tab. This is needed for aria-controls
					tabHeaderText = $(this).find(settings.selectors.header).text();
					panelID = "panelGroup_panel-" + randomNumber + "-" + tabHeaderText.replace(/[^\w\s]/gi, '').replace(/[\s]/gi, '_').toLowerCase();
					tabID = "panelGroup_tab-" + randomNumber + "-" + tabHeaderText.replace(/[^\w\s]/gi, '').replace(/[\s]/gi, '_').toLowerCase();

					// Header
					navItems.push('<li><a href="#" data-tab-index="' + index + '" role="tab" tabindex="' + tabindex + '" aria-selected="' + ariaSelected + '" aria-controls="' + panelID + '" id="' + tabID + '"><span>' + tabHeaderText + '</span></a></li>');
					$(this).find(settings.selectors.header).addClass('sr-only print-only');

					// Content
					content.append($(this).attr({
						'data-tab-index': index,
						'role': 'tabpanel',
						'id': panelID,
						'aria-hidden': ariaHidden,
						'aria-labeledby': tabID
					}));

				});

				// Append header and content items
				nav.append(navItems);
				that.append(nav.parent()).append(content);

				// Calculate nav items widths
				if(settings.flexTabNav){
					nav.find(' > li').css('width', 100 / navItems.length + "%");
				}

				//Add count class
				nav.addClass('has-'+navItems.length);

			// The functionality of tabs

				// Cache items, headers
				items = that.find('.tab-items');

				// Hide all but the first
				items.find(settings.selectors.item).not('[data-tab-index=0]').hide();
				nav.find('a').first().addClass('active');

				// Click handlers
				nav.find('a').on(settings.openTabTrigger, function(event) {

					if ( ! $(this).is('.active') ) {

						that.trigger('tabstart');

						// Get item to show
						var toShow = $(this).data('tab-index');

						// Show item, hide others
						items.find(settings.selectors.item).not('[data-tab-index=' + toShow + ']').hide().attr('aria-hidden', 'true');
						items.find(settings.selectors.item+'[data-tab-index=' + toShow + ']').show().attr('aria-hidden', 'false');

						// Toggle active class
						nav.find('.active').removeClass('active').attr({
							'tabindex': '-1',
							'aria-selected': 'false'
						});
						$(this).addClass('active').attr({
							'tabindex': '0',
							'aria-selected': 'true'
						});

						that.trigger('tabchange');

					} // ! active

					event.preventDefault();
									
				}).on('focus', function() {$(this).click()}) // a.click
					.on('keydown', function(e){

						switch (e.keyCode) {
							case pg.keycodes.left:
							case pg.keycodes.up:
								$(this).parent('li').prev('li').find('*[role=tab]').focus();
								event.preventDefault();
								break;
							case pg.keycodes.down:
							case pg.keycodes.right:
								$(this).parent('li').next('li').find('*[role=tab]').focus();
								event.preventDefault();
								break;
						}

					});

		}, // makeTabs

		makeAccordion: function(that) {
			var settings = that.data('panelGroup'),
			    items = that.find(settings.selectors.item),
			    activeItem,
			    animating = false,
			    accordionstartTriggered = false,
			    headers,
			    tabID,
			    panelID,
			    tabindex,
			    ariaExpanded = 'false',
			    ariaSelected = 'false',
			    ariaHidden = 'true',
			    randomNumber = Math.floor(Math.random() * 100000000);

			that.addClass('accordion').attr({
				'role': 'tablist',
				'aria-multiselectable': 'true'
			});
			//Update the current state
			$(that).data('groupType', 'accordion');

			// Headers
			headers = items.find(settings.selectors.header);
			headers.wrapInner('<a href="#"></a>');
			that.addClass('accordion');

			// Panels
			panels = items.find(settings.selectors.content);

			// Itterate through each item and add some attributes for accessibility
			items.each(function(index){

				// Create an ID for the tab. This is needed for aria-controls
				tabHeaderText = $(this).find(settings.selectors.header).text();
				panelID = "panelGroup_panel-" + randomNumber + "-" + tabHeaderText.replace(/[^\w\s]/gi, '').replace(/[\s]/gi, '_').toLowerCase();
				tabID = "panelGroup_tab-" + randomNumber + "-" + tabHeaderText.replace(/[^\w\s]/gi, '').replace(/[\s]/gi, '_').toLowerCase();

				// Headers
				$(this).find(settings.selectors.header).children('a').attr({
					'role': 'tab',
					'id': tabID,
					'aria-controls': panelID,
					'tabindex': index == 0 ? '0' : '-1',
					'aria-expanded': ariaExpanded,
					'aria-selected': ariaSelected
				});

				// Panels
				panels.attr({
					'role': 'tabpanel',
					'aria-labeledby': tabID,
					'id': panelID
				});

			}); // items.each

			// Check if first accordion item is open or not
			if ( settings.firstAccordionOpen ) {

				// Hide items
				that.find(settings.selectors.item + ":gt(0)").find(settings.selectors.content).hide().attr('aria-hidden', 'true');

				// Active classes
				activeItem = items.first()
									.addClass('active')
									.find(settings.selectors.content)
									.attr('aria-hidden', 'false')
									.end()
									.find(settings.selectors.header)
									.children('a')
									.attr('aria-expanded', 'true');

			} else {

				// Hide items
				that.find(settings.selectors.item).find(settings.selectors.content).hide();

			}


			// The click and toggle situation
			headers.children('a').on(settings.openAccordionTrigger, function(event) {

				if ( !accordionstartTriggered ) {
					that.trigger('accordionstart');
					accordionstartTriggered = true;
				}

				// Check if an animation is happening right now
				if ( animating ) {

					return false;

				} else {

					var t = $(this),
					    parent = that.find(settings.selectors.item).has(t),
					    content = parent.find(settings.selectors.content);

					// Expand or collapse depending on if you clicked an active item or not
					if ( parent.is('.active') ) {

						// Don't close if it is just a focus event
						if( event.type == 'focus' ) {
							return;
						}

						// Close the active item
						temp = that;
							animating = true;
							content.slideUp(settings.accordionSpeed, function(that){
								parent.removeClass('active')
										.find(settings.selectors.header)
										.children('a')
										.attr('aria-expanded', 'false');
								parent.find(settings.selectors.content)
										.attr('aria-hidden', 'true');
								animating = false;
								$(temp).trigger('accordionchange');
								accordionstartTriggered = false;
						});

					} else {

						// Close the items we don't want
						temp = that;
						if ( settings.onlyKeepOneOpen ) {
							if ( !accordionstartTriggered ) {
								that.trigger('accordionstart');
								accordionstartTriggered = true;
							}
							activeItem = $(this).parents(settings.selectors.item.replace(/>/,'').trim()).siblings('.active');
							activeItem.find(settings.selectors.content).slideUp(settings.accordionSpeed, function(){
								activeItem.removeClass('active')
											.find(settings.selectors.header)
											.children('a')
											.attr('aria-expanded', 'false')
											.end()
											.find(settings.selectors.content)
											.attr('aria-hidden', 'true');
								temp.trigger('accordionchange');
								accordionstartTriggered = false;
							});
						}

						// Open appropriate item
						parent.addClass('active');

						animating = true;
						content.slideDown(settings.accordionSpeed, function(){
							animating = false;
							temp.trigger('accordionstart');
							accordionstartTriggered = false;
							$(this).attr('aria-hidden', 'false')
									 .parents('.item')
									 .find(settings.selectors.header)
									 .children('a')
									 .attr('aria-expanded', 'true');
							temp.trigger('accordionchange');
						});

					} // else

					event.preventDefault();

				} // else if animating

			}).on('focus', function(){
				$(this).parents('.panel-group')
							 .find('*[tabindex=0]')
							 .attr({
							 	'tabindex': '-1',
							 	'aria-selected': 'false'
							 });
				$(this).attr({
					'tabindex': '0',
					'aria-selected': 'true'
				});
			}).on('keydown', function(e){
				switch (e.keyCode) {
					case pg.keycodes.left:
					case pg.keycodes.up:
						$(this).parents(settings.selectors.item.replace('> ','').trim()).prevAll(settings.selectors.item.replace('> ', '').trim()).eq(0).find('*[role=tab]').focus();
						e.preventDefault();
						break;
					case pg.keycodes.down:
					case pg.keycodes.right:
						$(this).parents(settings.selectors.item.replace('> ','').trim()).nextAll(settings.selectors.item.replace('> ', '').trim()).eq(0).find('*[role=tab]').focus();
						event.preventDefault();
						break;
				}

			});

		}, // makeAccordions

		methods: {

			tabsToAccordions: function(that) {

				var settings = $(that).data('panelGroup');

				// Check if we're dealing with tabs, if so, accordion time!
				if ( $(that).data('groupType') == 'tabs' ) {

					// Goodbye Tabs
					pg.methods.destroyTabs(that);

					// Hello Accordion
					pg.makeAccordion($(that));

					// Set whether we've turned tabs into accordions
					$(that).data('tabsToAccordion', 'true');
				
				} // if groupType == tabs

			}, // tabsToAccordions

			tabsBackToTabs: function(that) {
				
				var settings = $(that).data('panelGroup');

				if ( $(that).data('groupType') == 'accordion' && $(that).data('tabsToAccordion') ) {

					// Goodbye Accordion
					pg.methods.destroyAccordion(that);

					// Hello Tabs
					pg.makeTabs($(that));

					// Set whether we've turned tabs into accordions
					$(that).data('tabsToAccordion', 'false');
				
				} // if tabsToAccordion

			}, // tabsBackToTabs

			destroyTabs: function(that) {

				var settings = $(that).data('panelGroup');

				//NOTE: might be better to toggle .active class instead of show() hide()
				$(that).removeClass('tabs');
				$(that).find('.tab-nav-wrapper').remove();
				$(that).find('.tab-items').children().first().unwrap();
				$(that).find(settings.selectors.header).removeClass('sr-only').show();
				$(that).find(settings.selectors.item).removeAttr('data-tab-index').removeClass('active').show();

			}, //destroyTabs

			destroyAccordion: function(that) {

				var settings = $(that).data('panelGroup');

				$(that).removeClass('accordion');
				$(that).find(settings.selectors.header).show();
				$(that).find(settings.selectors.header).find('a').contents().unwrap();//Removes the <a> tag
				$(that).find(settings.selectors.item).removeClass('active').show();
				$(that).find(settings.selectors.content).show();

			} //destroyAccordion

		} // methods


	}; // pg

	$.fn.panelGroup = function(options) {

			// Check if we're instantiating plugin with options or calling a method. Normal stuff first.
			if ( !pg.methods[options] ) {

				// Return main method
				return this.each(function(index) {
					pg.init(this, options);
				});

			} else {

				return this.each(function(index) {
					pg.methods[options].apply(this, Array.prototype.slice.call($(this)));
				});
			}

	}; // panelGroup

}(jQuery));