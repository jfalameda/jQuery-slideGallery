/*! jquery.slideGallery.js */
/**
* Slide gallery
* @Author José Fernández Alameda
* @Email jose.fa@cloudnine.se
* @version 0.1.7
*/

(function ($, window) {
    "use strict";

    var SlideGallery = function (handler, options) {
        this.init(handler, options);
    };

    SlideGallery.prototype = {

        /**
        * Interval function handler
        */
        interval: null,

        /**
        * Stores the current selected submenu
        */
        currentSelected: null,

        /**
        * Keeps a reference to the image gallery DOM element
        */
        galleryContainer: null,

        /**
        * Stores the current slide position
        */
        currentSlide: 0,

        /**
        * Indicates the slide where the transition is gonna move to.
        */
        movingToSlide: 0,

        /**
        * Stores the body font size
        */
        fontSize: null,

        /**
        * Prevents the transition to be made
        */
        preventTransition: false,

        /**
        * Indicates if the slide gallery should cycle
        */
        cycle: true,

        /**
        * Stores the cloned UL list
        */
        clonedList: null,

        /**
        * Determines if the slide gallery is paused.
        */
        paused: false,

        /**
        * Slide gallery options
        */

        OPTIONS: {
            transitionTime: 500, // Time it takes to change from one slide to the other (in milliseconds)
            slideTimeout: 5000
        },

        customOptions: null,

        /**
        * Class initializer
        * @param gallery The images gallery container
        */
        init: function (gallery, options) {

            this.galleryContainer = gallery;
            this.processingOptions(options);
            this.initializeElements();

            // Listening to the DOM elements
            this.addObservers();

            if (this.customOptions.autoplay !== false) {
                this.setInterval();
            }

            $("html").trigger("slide-gallery:ready");

        },

        /**
        * Processes the initialization options
        * @param options The options object
        */
        processingOptions: function(options) {
            if(!options) {
                options = {};
            }
            this.customOptions = options;
            this.parseOptions();
            this.parseDataAttributes();
            if(options.cycle !== undefined) {
                this.cycle = options.cycle;
            }
        },

        /**
        * Prepares the HMTL elements
        */
        initializeElements: function() {
            if (!this.customOptions.controls) {
                this.createControls();
            } else {
                this.controls = this.customOptions.controls;
                this.handles = this.controls.find("li");
            }
            this.storeDom();
            this.calculateWrapperWidth();
        },

        /**
        * Parse the options passed through data attributes
        * from the slideGallery element.
        */
        parseDataAttributes: function() {
            if(this.galleryContainer.attr("data-autoplay") == "false") {
                this.customOptions.autoplay = false;
            }
            if(this.galleryContainer.attr("data-transition-timeout")) {
                this.OPTIONS.slideTimeout = parseInt(this.galleryContainer.attr("data-transition-timeout"), 10);
            }
        },

        /**
        * Parses the options object
        */
        parseOptions: function () {
            if (!this.customOptions) {
                this.customOptions = {};
            }
        },

        /**
        * Stores the references to the DOM elements
        */
        storeDom: function () {
            var ul = this.galleryContainer.find(".wrapper").detach();
            this.galleryContainer.append('<div class="wrapper"></div>');
            ul.removeClass("wrapper");
            this.galleryContainer.find(".wrapper").append(ul);
            this.slides = ul.find("li");
            this.wrapper = this.galleryContainer.find(".wrapper");
            if (!this.controls) {
                this.controls = this.galleryContainer.find(".controls");
                this.handles = this.controls.find("li");
            }
            this.currentSelected = this.galleryContainer.find(".wrapper li:first");
        },

        /**
        * Takes care of the gallery autoplay feature
        */
        setInterval: function () {
            var $this = this;
            this.interval = window.setInterval(function () {
                $this.next();
            }, this.OPTIONS.slideTimeout);
        },

        /**
        * Marks the control corresponding to the selected slide
        */
        markControlSelected: function markControlSelected(id) {

            this.galleryContainer.find(".controls li").each(function (key, value) {
                $(value).removeClass("selected");
            });

            var selected = this.galleryContainer.find(".controls li[name=" + id + "]");
            selected.addClass("selected");
        },

        /**
        * Adds the observers on the menu elements
        */
        addObservers: function () {
            var _this = this;

            this.controls.find(this.customOptions.controlsSelector ? this.customOptions.controlsSelector : "li").click(function (data) {
                _this.onSlideControlClicked($(this), data);
            });

            $("html").bind("text-size:changed", function () {
                _this.resizeActions(false);
            });

            $(window).resize(function () {
                _this.resizeActions(false);

            });

            if(!this.customOptions.preventControls) {

                // When clicking on the next element it will move to the next
                // slide.
                this.galleryContainer.find(".next").click(function() {
                  _this.next();
                });

                // When clicking on the prev element it will move to the prev
                // slide.
                this.galleryContainer.find(".prev").click(function() {
                  _this.prev();
                });
            }

            $(this.galleryContainer.find("*")).on('slideGallery:pause', function() {
                _this.pause();
            });

        },         

        /**
        * This function is triggered when a click over a slide gallery
        * control element is clicked. It will perform the movement to
        * the corresponding slide.
        * @param element The clicked element
        * @param data The attached data.
        */
        onSlideControlClicked: function (element, data) {
            if (parseInt(element.attr("name"), 10) != this.currentSlide) {
                window.clearInterval(this.interval);
                data.preventDefault();
                if (!this.preventTransition) {
                    this.onMenuLinkClicked(element, data, null);
                } else {
                    this.preventTransition = false;
                }
                // Setting the automatic play of the slide
                // in case the option is setted.
                if (this.customOptions.autoplay !== false) {
                    this.setInterval();
                }
            }
        },

        /**
        * This callback function will be called whenever the browser window
        * is resized. It recalculates the position of the images gallery wrapper
        * and the slides width.
        * @param {Boolean} noWrapper Indicates to re-calculate or not the wrapper width
        */
        resizeActions: function (noWrapper) {
            if (!noWrapper)
                this.calculateWrapperWidth();
            // Getting the current slide
            var selected = this.currentSlide;
            // Reposition the current slide due the
            // slides widh have changed.
            this.wrapper.css({
                marginLeft: "-" + (selected * this.galleryContainer.width()) + "px"
            });

        },
        
        /**
        * Moves to the next slide
        */
        next: function() {
            if(!this.preventTransition) {
                this.galleryContainer.trigger("slideGallery:onSlideNext");
                this.preventTransition = true;
                var next = this.currentSelected.next();
                if (next.length === 0) {
                  next = this.galleryContainer.find(".wrapper li:first");
                }
                this.markControlSelected(next.attr("name"));
                this.onMenuLinkClicked(next, null, null, true);
            }
        },
        
        /**
        * Moves to the previous slide
        */
        prev: function() {
            if(!this.preventTransition) {
                this.galleryContainer.trigger("slideGallery:onSlidePrevious");
                this.preventTransition = true;
                var next = this.currentSelected.prev();
                if (next.length === 0) {
                    next = this.galleryContainer.find(".wrapper li:last");
                }
                this.markControlSelected(next.attr("name"));
                this.onMenuLinkClicked(next, null, null, false);
            }
        },

        pause: function(argument) {
            window.clearInterval(this.interval);
            this.paused = true;
        },

        play: function() {
            this.setInterval();
            this.paused = false;
        },

        // OBSERVER CALLBACKS

        /**
        * This function takes care of performing the slide movement.
        * It also takes cares of moving the elments to the end or the
        * start of the list in order to create the cycling effect.
        * @param element The element on the list we are gonna move to
        * @param event The click event information.
        * @param manualPosition Force to move to a slide based on
        *       an integer value.
        */
        onMenuLinkClicked: function (element, event, manualPosition, next) {
            var position       = parseInt(element.attr("name"), 10); // The position of the slide to move to
            this.movingToSlide = position; // Storing this on a class attribute

            // Triggering the event that indicates which is the next
            // slide gallery it would transition to.
            this.galleryContainer.trigger("slideGallery:nextGallery", this.slides[position]);

            var cycle          = this.listTransformation(position, event, next);

            // Calling the callbacks before the transition is performed
            this.callCallbacksFunctions(cycle);

            // In case a transformation is needed we intertupt the flow
            if(cycle) { return; }
            this.currentSlide  = position; // Storing the position
            
            position = position || 0;

            var originalPosition = position;
            

            position = manualPosition || position;
            // Moving to the next slide
            this.nextSlide(position, cycle, next);
            // Storing the currently selected slide
            this.currentSelected = element;
            this.currentSlideElement = this.slides[originalPosition];
            this.markControlSelected(originalPosition);
        },
        /**
        * Takes care of creating the loop efect on the slide gallery
        * @position The position to move to
        * @event The click event
        */
        listTransformation: function (position, event, next) {
            if (this.cycle && !event) {
                if (position === 0 && this.currentSlide == this.slides.length - 1 && next) {
                    this.clonedList = this.galleryContainer.find(".wrapper ul").clone();
                    this.galleryContainer.find(".wrapper").prepend(this.clonedList);
                    this.nextSlide(this.slides.length, true, next);
                    return true;
                } else if ( position === this.slides.length - 1 && this.currentSlide === 0 && !next) {
                    this.clonedList = this.galleryContainer.find(".wrapper ul").clone();
                    this.galleryContainer.find(".wrapper").append(this.clonedList);
                    this.goToSlide(this.slides.length);
                    this.nextSlide(this.slides.length-1, true, next);
                    return true;
                }
            }
            return false;
        },

        /**
        * This function is called once the transition has been made.
        * It would move the elements that were moved in order to
        * create the cycling effect to its originals positions.
        * @param cycke The position the moved element is.
        */
        postCyclingActions: function (cycle, next) {
            if(next) {
                this.goToSlide(0);
                this.setCurrent(0);
            } else {
                this.goToSlide(this.slides.length-1);
                this.setCurrent(this.slides.length-1);
            }
            this.clonedList.remove();
        },

        /**
        * Sets the current element on the variables
        */
        setCurrent: function(position) {
            this.currentSlide = position;
            this.currentSelected = $(this.slides[position]);
            this.currentSlideElement = $(this.slides[position]);
        },

        /**
        * Moves the gallery to the next slide. This is made by calculating
        * the slide offset on the list container and giving the wrapper a
        * negative margin.
        * @param position {Integer} The slide to move to position
        * @param cycle {Boolean} Indicates if the next transition will imitate
        *                        the cycling effect.
        */
        nextSlide: function (position, cycle, next) {
            var $this = this;
            // Finding the wrapper element and animate it to the new
            // position.
            this.galleryContainer.find(".wrapper").animate({
                marginLeft: this.getPosition(position) // Getting the new position based on the slide position
            }, this.OPTIONS.transitionTime, function () {
                // Setting the prevent transition attribute to
                // False. It prevents the user to move to another slide
                // while one is already being made.
                $this.preventTransition = false;
                // Once the transition is finished the callback funcitons
                // will be called
                $this.callOnCompletedCallbacksFunctions();
                // In case the cycling effecft was performed some
                // actions need to be perform in order to restore
                // the gallery on its original sort order.
                if (cycle !== false && $this.cycle) {
                    $this.postCyclingActions(cycle, next);
                }
            });
        },

        /**
        * Calls the defined callback functions set on the options object
        * when the plugin was initialized.
        * @param cycle {Boolean} Indicates the transition imitates the cycling
        *                        effect.
        */
        callCallbacksFunctions: function (cycle) {
            if (this.customOptions.onSlideCallback) {
                this.customOptions.onSlideCallback(this, cycle);
            }
        },

        /**
        * Calls the defined callback functions set on the options object
        * when the plugin was initialized.¨s
        */
        callOnCompletedCallbacksFunctions: function () {
            // Calling the on completed callback
            if (this.customOptions.onSlideCallbackCompleted) {
                this.customOptions.onSlideCallbackCompleted(this);
            }
        },

        /**
        * Gets the slide margin to move to.
        * @param position {Integer} The slide position on the list.
        */
        getPosition: function (position) {
            return "-" + (position * this.galleryContainer.outerWidth()) + "px";
        },

        /**
        * Moves to a slide without making any transition
        * @param position {Integer} The slide to move to
        */
        goToSlide: function (position) {
            this.galleryContainer.find(".wrapper").css("margin-left", this.getPosition(position));
            this.currentSlideElement = this.slides[position];
        },

        getBodyFontSize: function () {
            return parseInt($("body").css("font-size"), 10);
        },

        /**
        * Calculates the slides wrapper with. The slide wrap is the element
        * that will make the effect of sliding by modifying the margin.
        */
        calculateWrapperWidth: function () {
            if (this.handles.size() == 1)
                this.controls.hide();

            var totalWidth = 0;
            this.calculateSlidesWidth();
            this.slides.each(function (key, children) {
                totalWidth += $(children).outerWidth();
            });

            this.wrapper.css("width", (totalWidth + 100)*2 + "px");
        },

        calculateSlidesWidth: function () {
            this.slides.width(this.galleryContainer.width() + "px");
        },

        /**
        * Creates the slide gallery controls
        */
        createControls: function createControls() {
            var controls = $('<ul class="controls"></ul>');
            this.galleryContainer.find(".wrapper > li").each(function (key, val) {
                $(val).attr("name", key);
                var item = $('<li name="' + key + '"><a></a></li>');
                if (key === 0)
                    item.addClass("selected");
                controls.append(item);
            });
            this.galleryContainer.append(controls);
        }

    };

    // Registering jQuery function
    $.fn.slideGallery = function (options) {
        return new SlideGallery($(this), options);
    };

    window.SPL.SlideGallery = SlideGallery;

})(jQuery, window);