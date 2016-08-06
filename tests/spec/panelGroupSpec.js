(function($) {

    /**
     * Helper functions for tests
     *
     */
    function pgTestIsAccordion(element) {

        // Check if the markup got the correct instantiated class from the plugin 
        var hasAccordionClass = element.hasClass('accordion');

        // Check if the markup has been put in the right order for accordions
        var contentFollowsHeader = element.find('.item.active')
                                          .find('.item-header')
                                          .next('div')
                                          .hasClass('item-content');

        return hasAccordionClass && contentFollowsHeader;


    }

    function pgTestIsTabs(element) {

        // Check if the markup got the correct instantiated class from the plugin 
        var hasAccordionClass = element.hasClass('tabs');

        // Check if the markup has been put in the right order for tabs
        var headersAreGrouped = element.find('.item-header.active')
                                       .parent('li')
                                       .next('li')
                                       .find('a')
                                       .hasClass('item-header');

        return hasAccordionClass && headersAreGrouped;

    }

    /**
     * Actual Jasmine tests
     *
     */
    describe( 'panelGroup', function() {

        // Setup dummy instantiation of plugin
        var dummyMarkup = '<div class="panel-group"><div class="item"><h4 class="item-header">Item 1</h4><div class="item-content"><p>Content 1</p></div></div><div class="item"><h4 class="item-header">Item 2</h4><div class="item-content"><p>Content 2</p></div></div><div class="item"><h4 class="item-header">Item 3</h4><p>Content 3</p></div></div>';

        afterEach(function() {

            // Remove dummy markup. We can't instantiate the plugin in beforeEach
            // though since I want to test instantiating it in different ways
            $('.panel-group').remove();

        });

        describe( 'plugin instantiation', function() {

            afterEach(function() {

                // Remove dummy markup. We can't instantiate the plugin in beforeEach
                // though since I want to test instantiating it in different ways
                $('.panel-group').remove();

            });

            it( 'should be chainable', function() {

                // Instantiate jQuery plugin
                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup().addClass('test-chainability');

                expect(panelGroupElement.hasClass('test-chainability')).toBeTruthy();

            });

            it( 'can be instantiated with a data attribute to become an accordion', function() {

                // Add a data attribute to control panelGroup type and instantiate
                var markup = $(dummyMarkup).attr('data-group-type', 'accordion');
                $('body').append(markup);
                var panelGroupElement = $('.panel-group').panelGroup();

                expect(pgTestIsAccordion(panelGroupElement)).toBe(true);

            });

            it( 'can be instantiated with a data attribute to become a tab group', function() {

                // Add a data attribute to control panelGroup type and instantiate
                var markup = $(dummyMarkup).attr('data-group-type', 'tabs');
                $('body').append(markup);
                var panelGroupElement = $('.panel-group').panelGroup();

                expect(pgTestIsTabs(panelGroupElement)).toBe(true);

            });

            it( 'a default group type is used when instantiated without a data attribute', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                expect(pgTestIsTabs(panelGroupElement)).toBe(true);

            });

            it( 'headers recieve `tab` aria role', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                var headerRole = panelGroupElement.find('.item-header')
                                                  .first()
                                                  .attr('role');

                expect(headerRole).toBe('tab');

            });

            it( 'content recieves `tabpanel` aria role', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                var headerRole = panelGroupElement.find('.item-content')
                                                  .first()
                                                  .parent('div')
                                                  .attr('role');

                expect(headerRole).toBe('tabpanel');

            });

            it( 'headers recieve `aria-controls` attribute', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                var headerRole = panelGroupElement.find('.item-header')
                                                .first()
                                                .attr('aria-controls');

                expect(headerRole).toBeTruthy();

            });

            it( 'content recieves `aria-labeledby` attribute', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                var headerRole = panelGroupElement.find('.item-content')
                                                  .first()
                                                  .parent('div')
                                                  .attr('aria-labeledby');

                expect(headerRole).toBeTruthy();

            });

            it( 'active header recieves truthy `aria-selected` value', function() {

                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                var headerRole = panelGroupElement.find('.item-header.active')
                                                  .first()
                                                  .attr('aria-selected');

                expect(headerRole).toBeTruthy();

            });


        }); // describe instantiation

        describe( 'plugin operation', function() {

            afterEach(function() {

                $('.panel-group').remove();

            });

            it( 'tabs can be turned into an accordion using `tabsToAccordions` method', function() {

                // Instantiate plugin
                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                // Turn tabs into accordions
                panelGroupElement.panelGroup('tabsToAccordions');

                expect(pgTestIsAccordion(panelGroupElement)).toBe(true);

            });

            it( 'tabs can be turned back into tabs after having been turned into an accordion', function() {

                // Instantiate plugin
                $('body').append(dummyMarkup);
                var panelGroupElement = $('.panel-group').panelGroup();

                // Turn tabs into accordions
                panelGroupElement.panelGroup('tabsToAccordions');

                // Turn the group back into a tab group
                panelGroupElement.panelGroup('tabsBackToTabs');

                expect(pgTestIsTabs(panelGroupElement)).toBe(true);

            });

            describe( 'can switch between tabs', function() {

                beforeEach(function() {

                    // Instantiate plugin
                    $('body').append(dummyMarkup);
                    this.panelGroupElement = $('.panel-group').panelGroup();

                });

                afterEach(function() {

                    $('.panel-group').remove();

                });

                it( 'clicking inactive item-header opens corresponding item-content', function() {

                    this.panelGroupElement.find('a.item-header').eq(1).click();
                    var newItemVisible = this.panelGroupElement.find('.item-content').eq(1).is(':visible');

                    expect(newItemVisible).toBe(true);

                });

                it( 'clicking inactive item-header sets appropriate tabindex', function() {

                    // Make sure initial values are corrent
                    var initialTabindex = this.panelGroupElement.find('a.item-header').eq(0).attr('tabindex'),
                        initialInactiveItemTabindex = this.panelGroupElement.find('a.item-header').eq(1).attr('tabindex'),
                        corectInitialValues = initialTabindex == '0' && initialInactiveItemTabindex == '-1';

                    // Switch tabs
                    this.panelGroupElement.find('a.item-header').eq(1).click();

                    // Check new tabindex values
                    var initialTabindexNewValue = this.panelGroupElement.find('a.item-header').eq(0).attr('tabindex'),
                        newActiveItemTabindex = this.panelGroupElement.find('a.item-header').eq(1).attr('tabindex'),
                        corectInitialValues = initialTabindexNewValue == '-1' && newActiveItemTabindex == '0';

                    expect(corectInitialValues && corectInitialValues).toBe(true);

                });

            });

        });

    }); // describe panelGroup

})(jQuery);
