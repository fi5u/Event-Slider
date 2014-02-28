/*
 *  jQuery Event Slider - v0.0.0
 *  A responsive CSS slider that can fire multiple custom events.
 *  http://jqueryboilerplate.com
 *
 *  Made by Tommy Fisher
 *  Under MIT License
 */
;(function ( $, window, document, undefined ) {
	// Create the defaults once
	var pluginName = 'eventSlider',
		defaults = {
            auto: true,
            delay: 3000,
            hoverPause: false,
            direction: 'next',
            pager: true,
            firstSlide: 0,
            renderSingle: false,
            eventsPre: [],
            eventsPost: [],
            functionsPre: [],
            transitionDuration: 0,
            onInit: function(){},
            onPreStart: function(){},
            onPreEnd: function(){},
            onPostStart: function(){},
            onPostEnd: function(){}
        };

	function Plugin ( element, options ) {
        /**
         *  The plugin constructor
         */

		this.element = element;
		this.options = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	Plugin.prototype = {
        // Set instance-wide vars
        slider: {}, // Namespace
        slideCount: '', // Number of slides
        hiddenClass: 'slider_hidden', // Class to apply to all non-visible slides
        autoTimer: {}, // Create the timer variable
        timings: [],
        timingsTimeoutPre: [],
        timingsTimeoutPost: [],

		init: function () {
            /**
             *  Set the slider up at runtime
             */

            var $self = $(this.element);

            // Count slides
            this.slideCount = this.setSlideCount();

            // If there's more than one slide or the user wants the slider functionality rendering
            // for one slide then proceed to render it
            if (this.slideCount > 1 || this.options.renderSingle === true) {
                // Add class to plugin
                $self.addClass(pluginName);

                // Set heights of li elements
                this.setLiH();

                // Wrap the slider to allow nav to be inserted
                this.buildWrap();

                // Insert the slider nav into the DOM
                this.buildNav();

                // Insert the pager into the DOM
                this.buildPager();

                // Set the current active pager item
                this.setActivePagerItem(this.options.firstSlide);

                // Detect if the browser supports CSS transforms
                this.detectCss();

                // Bind to window resize event
                this.resize();

                // Bind the hover event
                this.hoverPauseFn();

                // Bind the direction click events
                this.directionClick();

                // Set opacity to zero to all but the first slide
                // Direction param set to false so that post events don't fire
                this.setLiOpacity(0, false);

                this.getTotalDuration();

                // All is ready to start, instantiate the onInit function if exists
                if (this.options.onInit && typeof(this.options.onInit) === 'function') {
                    this.options.onInit();
                }

                if (this.options.auto === true) {
                    // Begin auto slideshow
                    this.start();
                }
            }
		},



        /**
         *  DOM MANIPULATION
         */

        buildWrap: function() {
            /**
             *  Slide needs wrapping so that nav can be positioned over
             */

            $(this.element).wrap('<div class="'+pluginName+'-wrap">');
        },

        buildNav: function() {
            /**
             *  Inject the nav element into the DOM
             */

            $(this.element).closest('.' + pluginName + '-wrap').append('<div class="' + pluginName + '-navbar"><div class="'+pluginName+'-left"></div><div class="'+pluginName+'-right"></div>');
        },

        buildPager: function() {
            /**
             *  If required, build pager
             */

            var selfPagerEl,

                // Set self so that 'this' can be accessed from delegate
                self = this;

            // If pager is required, go ahead and build it
            if (this.options.pager) {

                // Set the HTML for the pager element
                this.slider.pagerEl = $('<div class="' + pluginName + '-pager" />');

                // Add the pager element to the DOM
                $(this.element).closest('.' + pluginName + '-wrap').append(this.slider.pagerEl);

                selfPagerEl = this.slider.pagerEl;

                // Populate the pager
                this.populatePager();

                // Assign the pager click binding
                this.slider.pagerEl.delegate('a', 'click', function() {
                    self.pagerClick(selfPagerEl, this);
                });
            }
        },

        populatePager: function() {
            /**
             *  Add the correct number of items to the pager
             */

            var i,
                pagerItems = '';

            // For each slide add a pager-item element
            for (i = 0; i < this.slideCount; i++) {
                pagerItems += '<a class="' + pluginName + '-pager-item" data-index="' + i + '"></a>';
            }

            // Add the HTML to the DOM
            this.slider.pagerEl.html(pagerItems);
        },

        detectCss: function() {
            /**
             *  If browser doesn't support transform add class to slider
             */

            function detectCSSFeature(featurename){
                var feature = false,
                    domPrefixes = 'Webkit Moz ms O'.split(' '),
                    elm = document.createElement('div'),
                    featurenameCapital = null,
                    i;

                featurename = featurename.toLowerCase();

                if( elm.style[featurename] ) { feature = true; }

                if( feature === false ) {
                    featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
                    for( i = 0; i < domPrefixes.length; i++ ) {
                        if( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
                          feature = true;
                          break;
                        }
                    }
                }
                return feature;
            }

            var hasCssTransformSupport = detectCSSFeature('transform'),
                hasCssTransitionSupport = detectCSSFeature('transition');

            if (!hasCssTransformSupport) {
                $(this.element).addClass(pluginName + '-no-transform');
            }

            if (!hasCssTransitionSupport) {
                $(this.element).addClass(pluginName + '-no-transition');
            }
        },



        /**
         *  SET INSTANCE-WIDE VARIABLES
         */

        setSlideCount: function() {
            /**
             *  Count the slides
             */

            return $(this.element).find('li').length;
        },



        /**
         *  SET CSS
         */

        setLiH: function() {
            /**
             *  Set the li height of the elements
             */

            var $self = $(this.element),
                selfH = $self.outerHeight();
            $self.find('li').css('height',selfH + 'px');
        },



        /**
         *  ADD / REMOVE CLASSES
         */

        setLiOpacity: function(visible, direction) {
            /**
             *  Make all li elements invisible except the element at passed index
             */

            // Allow 'this' to be accessed within each()
            var self = this;

            // If transition is going to take any time and it's not just been instantiated then add the 'in-transition' class
            if (this.options.transitionDuration !== 0 && direction !== false) {
                this.transitionClass();
            }

            // Adds the class of slider_hidden to all but the slide at index
            $(this.element).find('li').each(function(index, el) {
                if(index !== visible) {
                    $(el).addClass(self.hiddenClass);
                }
            });
            $(this.element).find('li:eq('+ visible +')').removeClass(self.hiddenClass);

            // If direction is false then don't fire the post events
            if (direction !== false) {
                // If there is any transition duration, wait for transition to finish to begin the post events
                if (this.options.transitionDuration !== 0) {
                    // Wait for the transition to finish, then begin post events
                    setTimeout($.proxy(this.postEvents, this, direction), this.options.transitionDuration);

                    // Remove 'in-transition' class after all transitioning
                    setTimeout($.proxy(this.transitionClass, this, true), this.options.transitionDuration);

                } else { // Transition instantly
                    this.postEvents(direction);
                }
            }
        },

        transitionClass: function(remove) {
            /**
             *  Add or remove the 'in transition' class to the slider
             */

            if (remove === true) {
                $(this.element).removeClass(pluginName + '-in-transition');
            } else {
                $(this.element).addClass(pluginName + '-in-transition');
            }
        },

        removeEventClass: function(i, locus) {
            /**
             *  Remove the added event class
             */

            var eventNum = this.padNumber(i, 2);

            // Remove event class
            $(this.element).removeClass(pluginName + '-event-' + locus + '-' + eventNum);

            // Remove direction class
            $(this.element).removeClass(pluginName + '-direction-' + locus + '-next ' + pluginName + '-direction-' + locus + '-prev');
        },

        addEventClass: function(i, direction, locus) {
            /**
             *  Add an event class to the slider
             */

            var eventNum = this.padNumber(i, 2);

            // Add new event class
            $(this.element).addClass(pluginName + '-event-' + locus + '-' + eventNum);

            // Add new direction class
            $(this.element).addClass(pluginName + '-direction-' + locus + '-' + direction);
        },

        setActivePagerItem: function(index) {
            /**
             *  Remove current instance of active pager item and add class 'active' to the pager item at index
             */

            // If the user wants a pager continue
            if (this.options.pager) {
                // Remove current instance of 'active' from pager item
                $(this.slider.pagerEl).find('a.active').removeClass('active');

                // Add the class of 'active' to the pager item at index
                $(this.slider.pagerEl).find('a').eq(index).addClass('active');

            }
        },



        /**
         *  HELPER FUNCTIONS
         */

        padNumber: function(str, max) {
            /**
             *  Add leading zero to event number if less than 10
             */

            str = str.toString();
            return str.length < max ? this.padNumber('0' + str, max) : str;
        },

        getTotalDuration: function() {
            /**
             *  Calculate the total length of milliseconds one transition will take
             */

            var lastPre = 0,
                lastPost = 0,
                eventsPreArr = this.options.eventsPre,
                eventsPostArr = this.options.eventsPost;

            // Check that the params passed for eventsPre exists, is an array and has a value
            if (typeof eventsPreArr !== 'undefined' && eventsPreArr instanceof Array && eventsPreArr.length > 0) {
                lastPre = eventsPreArr[eventsPreArr.length-1][1];
            }

            // Check that the params passed for eventsPost exists, is an array and has a value
            if (typeof eventsPostArr !== 'undefined' && eventsPostArr instanceof Array && eventsPostArr.length > 0) {
                lastPost = eventsPostArr[eventsPostArr.length-1][1];
            }

            return lastPre + lastPost + this.options.transitionDuration + this.options.delay;
        },



        /**
         *  AUTO
         */

        start: function() {
            /**
             *  Start the auto advance
             */

            var totalDuration = this.getTotalDuration();
            this.autoTimer = setInterval($.proxy(this.advance, this, this.options.direction), totalDuration);
        },

        stop: function() {
            /**
             *  Stop the auto advance
             */

            clearInterval(this.autoTimer);
        },



        /**
         *  SLIDER CONTROL
         */

        postEvents: function(direction) {
            var count = 0,
                postEndEvent;

            // If onPostStart function passed, call it before the post events start
            if (this.options.onPostStart && typeof(this.options.onPostStart) === 'function') {
                this.options.onPostStart();
            }

            // Set up timing events
            for (i = 0; i < this.options.eventsPost.length; i++) {
                // The start of the event
                this.timingsTimeoutPost[count] = setTimeout($.proxy(this.addEventClass, this, i, direction, 'post'), this.options.eventsPost[i][0]);
                // The end of the event
                this.timingsTimeoutPost[count + 1] = setTimeout($.proxy(this.removeEventClass, this, i, 'post'), this.options.eventsPost[i][1]);
                // Increment by two as each array has two values
                count += 2;

                if (i === this.options.eventsPost.length - 1) { // Last event
                    // If onPostEnd function passed, call it once the final post event has finished
                    if (this.options.onPostEnd && typeof(this.options.onPostEnd) === 'function') {
                        postEndEvent = setTimeout($.proxy(this.options.onPostEnd, this), this.options.eventsPost[i][1]);
                    }
                }
            }

        },

        transition: function(direction) {
            /**
             *  Transition to next slide
             */

            // Active slide is the only slide without the hidden class
            var activeSlide = $(this.element).find('li:not(".'+ this.hiddenClass +'")').index();

            // Work out the next/prev slide to show
            if (direction === 'next') {
                if (activeSlide + 1 >= this.slideCount) {
                    // Last slide, go back to start
                    targetIndex = 0;
                } else {
                    // Not last slide, go forward 1
                    targetIndex = activeSlide + 1;
                }
            } else {
                // Going to previous slide
                if (activeSlide <= 0) {
                    // At first slide, go to last slide
                    targetIndex = this.slideCount - 1;
                } else {
                    // Not at first slide, go previous 1
                    targetIndex = activeSlide - 1;
                }
            }

            // Make appropriate pager item 'current'
            this.setActivePagerItem(targetIndex);

            // Change the transparency of target slide
            this.setLiOpacity(targetIndex, direction);
        },

        advance: function(direction) {
            /**
             *  Set up all the event timers
             */

            var count = 0,
                transitionEvent,
                preEnd;

            // All is ready to start transition, instantiate the onStart function if exists
            if( this.options.onPreStart && typeof(this.options.onPreStart) === 'function' ) {
                this.options.onPreStart();
            }

            // Set up timing events
            for (i = 0; i < this.options.eventsPre.length; i++) {
                // The start of the event
                this.timingsTimeoutPre[count] = setTimeout($.proxy(this.addEventClass, this, i, direction, 'pre'), this.options.eventsPre[i][0]);

                // If a function has been passed for the start of this event set a timer for it
                if (typeof(this.options.functionsPre[i][0]) === 'function' && this.options.functionsPre[i][0].length > 0) {
                    this.options.functionsPre[i][0]();
                }

                // The end of the event
                this.timingsTimeoutPre[count + 1] = setTimeout($.proxy(this.removeEventClass, this, i, 'pre'), this.options.eventsPre[i][1]);
                // Increment by two as each array has two values
                count += 2;

                if (i === this.options.eventsPre.length - 1) { // Last event
                    // Transition to the next slide at the same moment the last timing event finishes
                    transitionEvent = setTimeout($.proxy(this.transition, this, direction), this.options.eventsPre[i][1]);

                    // If a function has been passed for the end of this event set a timer for it
                    if (typeof(this.options.functionsPre[i][0]) === 'function' && this.options.functionsPre[i][1].length > 0) {
                        this.options.functionsPre[i][1]();
                    }

                    // If onPreEnd function added, call it at the end of the last pre event
                    if( this.options.onPreEnd && typeof(this.options.onPreEnd) === 'function' ) {
                        preEnd = setTimeout($.proxy(this.options.onPreEnd, this), this.options.eventsPre[i][1]);
                    }
                }
            }
        },

        next: function() {
            /**
             *  Progress to the next slide
             */

            this.advance('next');
        },

        prev: function() {
            /**
             *  Back to the previous slide
             */

            this.advance('prev');
        },



        /**
         *  EVENTS
         */

        directionClick: function() {
            var self = this;

            $('body').on('click', '.eventSlider-left', function(event) {
                self.prev();
                event.preventDefault();
            });

            $('body').on('click', '.eventSlider-right', function(event) {
                self.next();
                event.preventDefault();
            });
        },

        pagerClick: function(pager, pagerItem) {
            /**
             *  Slider pager click events
             */

            var activeSlide = $(pager).prevAll('.' + pluginName).find('li:not(".'+ this.hiddenClass +'")').index(),
                targetSlide = $(pagerItem).attr('data-index'),
                direction;

            if (activeSlide >= targetSlide) {
                direction = 'prev';
            } else {
                direction = 'next';
            }

            // Make appropriate pager item 'current'
            this.setActivePagerItem(targetSlide);

            // Go to target slide
            this.setLiOpacity(targetSlide, direction);
        },

        hoverPauseFn: function() {
            var self = this;
            if (this.options.hoverPause === true && this.options.auto === true) {
                $(this.element).hover(
                    function() {
                        self.stop();
                    }, function() {
                        self.start();
                    }
                );
            }
        },

        resize: function() {
            /**
             *  Debounced window resizing function,
             *  referenced from http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
             */

            var self = this;
            (function($,sr){
                var debounce = function (func, threshold, execAsap) {
                    var timeout;

                    return function debounced () {
                        var obj = this, args = arguments;
                        function delayed () {
                            if (!execAsap) {
                                func.apply(obj, args);
                            }
                            timeout = null;
                        }

                        if (timeout) {
                            clearTimeout(timeout);
                        } else if (execAsap) {
                            func.apply(obj, args);
                        }

                        timeout = setTimeout(delayed, threshold || 100);
                    };
                };
                // smartresize
                jQuery.fn[sr] = function(fn) {  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };
            })(jQuery,'smartresize');

            $(window).smartresize(function() {
                self.setLiH();
            });
        }
	};



	/**
     *  Plugin wrapper around the constructor
     */
	$.fn[ pluginName ] = function ( options ) {
        var args = arguments,
            returns;

        if (options === undefined || typeof options === 'object') {
            return this.each(function() {
                if ( !$.data( this, 'plugin_' + pluginName ) ) {
                    $.data( this, 'plugin_' + pluginName, new Plugin( this, options ) );
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
                if (options === 'destroy') {
                    $.data(this, 'plugin_' + pluginName, null);
                }
            });
            return returns !== undefined ? returns : this;
        }
	};

})( jQuery, window, document );