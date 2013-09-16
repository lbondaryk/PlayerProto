/* **************************************************************************
 * $Workfile:: brix-labelcarousel.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the Label Carousel widget.
 *
 *
 * The LabelCarousel bric draws the common configuration of a
 * {@link pearson.brix.LabelCarousel} presenting a collection of images with the
 * selected image displayed in an {@link pearson.brix.Image} bric below the
 * LabelSelector {@link pearson.brix.LabelSelector}. Based on ImageViewer.
 *
 * Created on		Sept 15, 2013
 * @author			Leslie Bondaryk 
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


goog.provide('pearson.brix.LabelCarousel');

goog.require('pearson.brix.SvgBric');
goog.require('pearson.brix.Image');
goog.require('pearson.brix.CaptionedImage');
goog.require('pearson.brix.LabelSelector');
goog.require('pearson.utils.IEventManager');

// Sample configuration objects for classes defined here
(function()
{
	// config for ImageViewer class
	var labelCarouselConfig =
		{
			id: "imgvwr1",
			items: [],
			labels: [],
		};
});

/* **************************************************************************
 * LabelCarousel                                                       */ /**
 *
 * The ImageViewer draws the common bric configuration of a Label
 * Selector presenting a collection of images with the selected
 * image displayed in an Image widget below.
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
 * 							config.items	-The list of Image brix to be presented by Carousel.
 * @param {Array.<!pearson.brix.LabelSelector>}
 * 							config.labels	-The list of labels to be presented by the Selector.
 * @param {!pearson.utils.IEventManager}
 * 							eventManager	-allows the bric to publish and subscribe to events
 * 											 required for correct internal operation.
 *
 ****************************************************************************/
pearson.brix.LabelCarousel = function (config, eventManager)
{
	// call the base class constructor
	goog.base(this);

	var that = this;
	
	/**
	 * A unique id for this instance of the LabelCarousel bric
	 * @type {string}
	 */
	this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.LabelCarousel);

	/**
	 * The list of image brix presented by this LabelCarousel.
	 * @type {Array.<!pearson.brix.Image>}
	 */
	this.items = config.items;

	function makeLabels () 
		{
			
			if (config.labels) 
			{
				return config.labels;
			}
			else
			{ 
				var labelArray = [];
				for (var i = that.items.length - 1; i >= 0; i--) 
				{
					labelArray[i] = '&nbsp;';
				};
				
				return labelArray;

			}
		}

	this.labels = makeLabels(); 

	this.assignMissingItemKeys_();

	// The ImageViewer uses a standard layout of the Carousel to make its
	// configuration simpler.
	var crslConfig =
		{
			id: this.id + "_labels",
			items: this.labels,
			layout: "horizontal",
			type: "numbered",
			itemMargin: {top: 0, bottom: 0, left: 2, right: 2}
		};

	/**
	 * The selector bric used by this LabelCarousel to present the images.
	 * @type {!pearson.brix.LabelSelector}
	 */
	this.labelSelector = new pearson.brix.LabelSelector(crslConfig, eventManager);

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
	 * The captioned image bric which displays the image selected
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
	this.selectedEventId = this.labelSelector.selectedEventId;
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The key associated with the selected item.
	 */
	var SelectedEventDetails;

	// event handler that connects the carousel selection to changing and redrawing
	// the image below.
	var handleLabelSelection = function (eventDetails)
	{
		console.log("firing image change handler");
		that.image.changeImage(that.items[Number(eventDetails.selectKey)].URI,
							   that.items[Number(eventDetails.selectKey)].caption);
		that.image.redraw();
	};

	eventManager.subscribe(this.labelSelector.labelItems.selectedEventId, handleLabelSelection);
	
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
}; // end of LabelCarousel constructor
goog.inherits(pearson.brix.LabelCarousel, pearson.brix.SvgBric);

/**
 * Prefix to use when generating ids for instances of ImageViewer.
 * @const
 * @type {string}
 */
pearson.brix.LabelCarousel.autoIdPrefix = 'labCrsl_';

/* **************************************************************************
 * LabelCarousel.draw                                                    */ /**
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
pearson.brix.LabelCarousel.prototype.draw = function (container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	// aliases of utility functions for readability
	var attrFnVal = pearson.brix.utils.attrFnVal;

	var that = this;
	
	// make a group to hold the imageviewer
	var widgetGroup = container.append("g")
		.attr("class", "brixLabelCarousel")
		.attr("id", this.id);

	// Rect for the background of the image viewer
	widgetGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height);

	// currently hard set height.  We might want to measure labels in future.
	var selectorHeight = 44;

	// Carousel goes at the top
	var selectorGroup = widgetGroup.append("g");
 	this.labelSelector.draw(selectorGroup, {height: selectorHeight, width: size.width});

	// Image goes below carousel with 10 px margin
	var imageGroup = widgetGroup.append("g")
		.attr("transform", attrFnVal("translate", 0, selectorHeight + 10));

	this.image.draw(imageGroup, {height: size.height - selectorHeight - 10, width: size.width});

	this.lastdrawn.widgetGroup = widgetGroup;

	// Initial selection is the 1st image
	this.selectItemAtIndex(0);

}; // end of ImageViewer.draw()

/* **************************************************************************
 * LabelCarousel.redraw                                                  */ /**
 *
 * Redrawing the ImageViewer currently does nothing.
 * @export
 *
 ****************************************************************************/
pearson.brix.LabelCarousel.prototype.redraw = function ()
{
};

/* **************************************************************************
 * LabelCarousel.selectedItem                                            */ /**
 *
 * Return the selected item in the carousel.
 * @export
 *
 * @return {Object} the carousel item which is currently selected.
 *
 ****************************************************************************/
pearson.brix.LabelCarousel.prototype.selectedItem = function ()
{
	return this.labelSelector.selectedItem();
};

/* **************************************************************************
 * LabelCarousel.selectItemAtIndex                                       */ /**
 *
 * Select the item in the carousel at the given index.
 * @export
 *
 * @param {number}	index	-the 0-based index of the item to flag as selected.
 *
 ****************************************************************************/
pearson.brix.LabelCarousel.prototype.selectItemAtIndex = function (index)
{
 this.labelSelector.selectItemAtIndex(index);
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
pearson.brix.LabelCarousel.prototype.itemKeyToIndex = function(key)
{
	return this.labelSelector.itemKeyToIndex(key);
};

/* **************************************************************************
 * LabelCarousel.assignMissingItemKeys_                                  */ /**
 *
 * Assign a key property value of the index in the item list to any
 * item which doesn't have a key property. This key is used for selection and
 * highlighting.
 * @private
 *
 ****************************************************************************/
pearson.brix.LabelCarousel.prototype.assignMissingItemKeys_ = function ()
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
 * LabelCarousel.lite                                                    */ /**
 *
 * Highlight the image(s) associated w/ the given liteKey (key) in the
 * carousel, and select the 1st highlighted image.
 * @export
 *
 * @param {string}		liteKey		-The key associated with the image(s) to be highlighted.
 *
 ****************************************************************************/
pearson.brix.LabelCarousel.prototype.lite = function (liteKey)
{
	window.console.log("called LabelCarousel.lite( " + liteKey + " )");

	var i = this.itemKeyToIndex(liteKey);

	if (i !== null)
	{
		this.selectItemAtIndex(i);
	}

 this.labelSelector.lite(liteKey);
		
}; // end of ImageViewer.lite()

