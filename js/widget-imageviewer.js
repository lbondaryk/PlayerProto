/* **************************************************************************
 * $Workfile:: widget-imageviewer.js                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the ImageViewer bric.
 *
 * The ImageViewer bric draws the common configuration of a
 * {@link pearson.brix.Carousel} presenting a collection of images with the
 * selected image displayed in an {@link pearson.brix.Image} bric below the
 * carousel.
 *
 * Created on		May 18, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.ImageViewer');

goog.require('pearson.brix.SvgBric');
goog.require('pearson.brix.Image');
goog.require('pearson.brix.CaptionedImage');
goog.require('pearson.brix.Carousel');
goog.require('pearson.utils.IEventManager');

// Sample configuration objects for classes defined here
(function()
{
	// config for ImageViewer class
	var imageviewerConfig =
		{
			id: "imgvwr1",
			items: [],
		};
});

/* **************************************************************************
 * ImageViewer                                                         */ /**
 *
 * The ImageViewer widget draws the common widget configuration of a
 * Carousel widget presenting a collection of images with the selected
 * image displayed in an Image widget below the carousel.
 *
 * @constructor
 * @extends {pearson.brix.SvgBric}
 * @export
 *
 * @param {Object}			config			-The settings to configure this ImageViewer
 * @param {string|undefined}
 * 							config.id		-String to uniquely identify this ImageViewer.
 * 											 if undefined a unique id will be assigned.
 * @param {Array.<!pearson.brix.Image>}
 * 							config.items	-The list of Image brix to be presented by the ImageViewer.
 * @param {!pearson.utils.IEventManager}
 * 							eventManager	-allows the widget to publish and subscribe to events
 * 											 required for correct internal operation.
 *
 ****************************************************************************/
pearson.brix.ImageViewer = function (config, eventManager)
{
	// call the base class constructor
	goog.base(this);

	var that = this;
	
	/**
	 * A unique id for this instance of the image viewer bric
	 * @type {string}
	 */
	this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.ImageViewer);

	/**
	 * The list of image brix presented by the Carousel in this ImageViewer.
	 * @type {Array.<!pearson.brix.Image>}
	 */
	this.items = config.items;

	this.assignMissingItemKeys_();

	// The ImageViewer uses a standard layout of the Carousel to make its
	// configuration simpler.
	var crslConfig =
		{
			id: this.id + "_crsl",
			items: this.items,
			layout: "horizontal",
			itemMargin: {top: 15, bottom: 0, left: 6, right: 6},
			presentation: "scaleToFit",
			scrollMode: "nowrap"
		};

	/**
	 * The carousel widget used by this ImageViewer to present the images.
	 * @type {!pearson.brix.Carousel}
	 */
	this.carousel = new pearson.brix.Carousel(crslConfig, eventManager);

	// We may want to eventually support an empty image, but for now
	// we'll just copy the 1st image into the display image.
	var cimgConfig =
		{
			id: this.id + "_cimg",
			URI: this.items[0].URI,
			caption: this.items[0].caption,
			preserveAspectRatio: this.items[0].preserveAspectRatio,
			actualSize: this.items[0].actualSize,
			captionPosition: "below"
		};

	/**
	 * The captioned image widget which displays the image selected
	 * in the carousel.
	 * @type {!pearson.brix.CaptionedImage}
	 */
	this.image = new pearson.brix.CaptionedImage(cimgConfig);

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when an item in this carousel is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.carousel.selectedEventId;
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The key associated with the selected item.
	 */
	var SelectedEventDetails;

	// event handler that connects the carousel selection to changing and redrawing
	// the image below.
	var handleCarouselSelection = function (eventDetails)
	{
		that.image.changeImage(that.carousel.selectedItem().URI,
							   that.carousel.selectedItem().caption);
		that.image.redraw();
	};

	eventManager.subscribe(this.carousel.selectedEventId, handleCarouselSelection);

	/**
	 * Information about the last drawn instance of this image (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			widgetGroup: null,
		};
}; // end of ImageViewer constructor
goog.inherits(pearson.brix.ImageViewer, pearson.brix.SvgBric);

/**
 * Prefix to use when generating ids for instances of ImageViewer.
 * @const
 * @type {string}
 */
pearson.brix.ImageViewer.autoIdPrefix = "imgvwr_auto_";

/* **************************************************************************
 * ImageViewer.draw                                                    */ /**
 *
 * @inheritDoc
 * @export
 * @description The following is here until jsdoc supports the inheritDoc tag.
 * Draw this ImageViewer in the given container.
 *
 * @param {!d3.selection}	container	-The container svg element to append
 * 										 this SvgBric element tree to.
 * @param {!pearson.utils.ISize}
 * 							size		-The size (in pixels) of the area this
 * 										 SvgBric has been allocated.
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.draw = function (container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	// aliases of utility functions for readability
	var attrFnVal = pearson.brix.utils.attrFnVal;

	var that = this;
	
	// make a group to hold the imageviewer
	var widgetGroup = container.append("g")
		.attr("class", "brixImageViewer")
		.attr("id", this.id);

	// Rect for the background of the image viewer
	widgetGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height);

	// calculate the correct aspect ratio carousel height for the given width.
	var carouselHeight = this.carousel.calcOptimumHeightForWidth(size.width);

	// Carousel goes at the top
	var carouselGroup = widgetGroup.append("g");
	this.carousel.draw(carouselGroup, {height: carouselHeight, width: size.width});

	// Image goes below carousel
	var imageGroup = widgetGroup.append("g")
		.attr("transform", attrFnVal("translate", 0, carouselHeight));

	this.image.draw(imageGroup, {height: size.height - carouselHeight - 15, width: size.width});

	this.lastdrawn.widgetGroup = widgetGroup;

	// Initial selection is the 1st image
	this.selectItemAtIndex(0);

}; // end of ImageViewer.draw()

/* **************************************************************************
 * ImageViewer.redraw                                                  */ /**
 *
 * Redrawing the ImageViewer currently does nothing.
 * @export
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.redraw = function ()
{
};

/* **************************************************************************
 * ImageViewer.selectedItem                                            */ /**
 *
 * Return the selected item in the carousel.
 * @export
 *
 * @return {Object} the carousel item which is currently selected.
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.selectedItem = function ()
{
	return this.carousel.selectedItem();
};

/* **************************************************************************
 * ImageViewer.selectItemAtIndex                                       */ /**
 *
 * Select the item in the carousel at the given index.
 * @export
 *
 * @param {number}	index	-the 0-based index of the item to flag as selected.
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.selectItemAtIndex = function (index)
{
	this.carousel.selectItemAtIndex(index);
};

/* **************************************************************************
 * ImageViewer.itemKeyToIndex                                          */ /**
 *
 * Find the first item in the list of items in this ImageViewer which has the
 * specified key and return its index. If no item has that key return null.
 * @export
 *
 * @param {string}	key		-The key of the item to find
 *
 * @return {?number} the index of the item in the list of items with the
 * 			specified key.
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.itemKeyToIndex = function(key)
{
	return this.carousel.itemKeyToIndex(key);
};

/* **************************************************************************
 * ImageViewer.assignMissingItemKeys_                                  */ /**
 *
 * Assign a key property value of the index in the item list to any
 * item which doesn't have a key property. This key is used for selection and
 * highlighting.
 * @private
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.assignMissingItemKeys_ = function ()
{
	this.items.forEach(function (item, i)
					   {
						   // A falsy key is invalid, set it to the index
						   if (!item.key)
						   {
							   item.key = i.toString();
						   }
					   });
};

/* **************************************************************************
 * ImageViewer.lite                                                    */ /**
 *
 * Highlight the image(s) associated w/ the given liteKey (key) in the
 * carousel, and select the 1st highlighted image.
 * @export
 *
 * @param {string}		liteKey		-The key associated with the image(s) to be highlighted.
 *
 ****************************************************************************/
pearson.brix.ImageViewer.prototype.lite = function (liteKey)
{
	window.console.log("called ImageViewer.lite( " + liteKey + " )");

	var i = this.itemKeyToIndex(liteKey);

	if (i !== null)
	{
		this.selectItemAtIndex(i);
	}

	this.carousel.lite(liteKey);
		
}; // end of ImageViewer.lite()

