/**
* Slide gallery
* @Author José Fernández Alameda
* @Email jose.fa@cloudnine.se
* @version 0.1.5
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

            this.customOptions = options;
            this.galleryContainer = gallery;
            this.parseOptions();


            if (!this.customOptions.controls) {
                this.createControls();
            } else {
                this.controls = this.customOptions.controls;
                this.handles = this.controls.find("li");
            }

            this.storeDom();

            this.calculateWrapperWidth();

            // Listening to the DOM elements
            this.addObservers();

            if (this.customOptions.autoplay !== false) {
                this.setInterval();
            }

            $("html").trigger("slide-gallery:ready");

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
            this.slides = this.galleryContainer.find(".wrapper").children();
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
            this.interval = setInterval(function () {
                var next = $this.currentSelected.next();
                if (next.length === 0) {
                    next = $this.galleryContainer.find(".wrapper li:first");
                }
                $this.markControlSelected(next.attr("name"));
                $this.onMenuLinkClicked(next, null, null);
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
        },

        onSlideControlClicked: function (element, data) {
            if (parseInt(element.attr("name"), 10) != this.currentSlide) {
                clearInterval(this.interval);
                data.preventDefault();
                if (!this.preventTransition) {
                    this.onMenuLinkClicked(element, data, null);
                } else {
                    this.preventTransition = false;
                }
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

        // OBSERVER CALLBACKS

        onMenuLinkClicked: function (element, event, manualPosition) {

            var position = parseInt(element.attr("name"), 10);

            this.movingToSlide = position;

            var cycle = this.listTransformation(position);

            this.callCallbacksFunctions(cycle);

            this.currentSlide = position;
            if (!position)
                position = 0;

            var originalPosition = position;

            if (cycle)
                position = 1;

            if (manualPosition)
                position = manualPosition;

            this.nextSlide(position, cycle);

            this.currentSelected = element;
            this.currentSlideElement = this.slides[originalPosition];

            this.markControlSelected(originalPosition);

        },

        listTransformation: function (position) {
            if (this.cycle) {
                if (position === 0 && this.currentSlide == this.slides.length - 1) {
                    var last = this.galleryContainer.find(".wrapper li:last").remove();
                    this.galleryContainer.find(".wrapper").prepend(last);
                    this.goToSlide(0);
                    return true;
                }
            }
            return false;
        },

        postCyclingActions: function () {
            var first = this.galleryContainer.find(".wrapper li:first").remove();
            this.galleryContainer.find(".wrapper").append(first);
            this.goToSlide(0);
            this.currentSlide = 0;
            this.preventTransition = false;
        },

        nextSlide: function (position, cycle) {
            var $this = this;
            this.galleryContainer.find(".wrapper").animate({
                marginLeft: this.getPosition(position)
            }, this.OPTIONS.transitionTime, function () {
                $this.callOnCompletedCallbacksFunctions();
                if (cycle) {
                    $this.postCyclingActions();
                }
            });
        },

        callCallbacksFunctions: function (cycle) {
            if (this.customOptions.onSlideCallback) {
                this.customOptions.onSlideCallback(this, cycle);
            }
        },

        callOnCompletedCallbacksFunctions: function () {
            if (this.customOptions.onSlideCallbackCompleted) {
                this.customOptions.onSlideCallbackCompleted(this);
            }
        },

        /**
        * Gets the slide margin to move to
        */
        getPosition: function (position) {
            return "-" + (position * this.galleryContainer.outerWidth()) + "px";
        },

        /**
        * Moves to a slide without making any transition
        * @param position {Integer} The slide to move to
        */
        goToSlide: function (position) {
            this.preventTransition = true;
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


            this.wrapper.css("width", (totalWidth + 100) + "px");
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


})(jQuery, window);