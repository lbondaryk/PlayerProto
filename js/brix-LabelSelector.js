/* **************************************************************************
 * $Workfile:: brix-labelselector.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the LabelSelector widget.
 *
 * The LabelSelector widget draws a collection of labels in an SVGContainer and
 * allows one of them to be selected.
 *
 * Created on		Sept 13, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.LabelSelector');

goog.require('pearson.brix.SvgBric');
goog.require('pearson.utils.IEventManager');

// Sample configuration objects for classes defined here
(function()
{
	// config for Carousel class
	var labelSelectorConfig =
		{
			id: "crsl1",
			items: ["foo","bar","thing"],
			layout: "horizontal",
			itemMargin: {top: 4, bottom: 4, left: 2, right: 2},
			type: "numbered"
		};
});

/* **************************************************************************
 * LabelSelector                                                          */ /**
 *
 * The LabelSelector widget draws a collection of labels side by side in an 
 * SVGContainer and allows one of them to be selected.
 *
 * @constructor
 * @extends {pearson.brix.SvgBric}
 * @export
 *
 * @param {Object}		config			-The settings to configure this bric
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this LabelSelector.
 * 										 if undefined a unique id will be assigned.
 * @param {!Array.<!pearson.brix.SvgBric>}
 *						config.items	-The list of label strings to be presented by the Selector.
 * @param {string}		config.layout	-How the selector will layout the items (vertical or horizontal).
 * @param {{top: number, bottom: number, left: number, right: number}}
 *						config.itemMargin
 *										-The margin around each label, note that the
 *										 intra-item gap will be the sum of the left and right margin.
 * @param {string}		config.type 	- 'numbered', 'bullets' or null to auto number or bullet
 *				
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @todo Implement the "vertical" layout -mjl
 * @todo Implement the "scroll" presentation, after we figure out what it means to fit naturally (maybe it means we specify an itemAspectRatio). -mjl
 *
 ****************************************************************************/
pearson.brix.LabelSelector = function (config, eventManager)
{
	// call the base class constructor
	goog.base(this);

	var that = this;
	
	/**
	 * A unique id for this instance of the LabelSelector bric
	 * @type {string}
	 */
	this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.LabelSelector);

	/**
	 * The list of label strings presented by the LabelSelector.
	 * @type {!Array.<!string>}
	 */
	this.items = config.items;

	//this.assignMissingItemKeys_();
	
	/**
	 * How the carousel will layout the items (vertical or horizontal).
	 * @type {string}
	 */
	this.layout = config.layout;
	
	/**
	 * The margin around each item, note that the
	 * intra-item gap will be the sum of the left and right margin.
	 * @type {{top: number, bottom: number, left: number, right: number}}
	 */
	this.itemMargin = config.itemMargin;
	
	/**
	 * Should labels have numbers or bullets?
	 * @type {string}
	 */
	this.type = config.type;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager = eventManager || pearson.utils.IEventManager.dummyEventManager;

	/**
	 * The event id published when an item in this LabelSelector is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.id + '_itemSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {number} index		-The 0-based index of the selected item.
	 * @property {string} selectKey	-The key associated with the selected item.
	 */
	var SelectedEventDetails;

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
}; // end of LabelSelector constructor
goog.inherits(pearson.brix.LabelSelector, pearson.brix.SvgBric);

/**
 * Prefix to use when generating ids for instances of LabelSelector.
 * @const
 * @type {string}
 */
pearson.brix.LabelSelector.autoIdPrefix = "labSel_";

/* **************************************************************************
 * LabelSelector.draw                                                       */ /**
 *
 * @inheritDoc
 * @export
 * @description The following is here until jsdoc supports the inheritDoc tag.
 * Draw this LabelSelector in the given container.
 *
 * @param {!d3.selection}	container	-The container svg element to append
 * 										 this SvgBric element tree to.
 * @param {!pearson.utils.ISize}
 * 							size		-The size (in pixels) of the area this
 * 										 SvgBric has been allocated.
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	// aliases of utility functions for readability
	var attrFnVal = pearson.brix.utils.attrFnVal;

	var that = this;
	
	var itemMargin = this.itemMargin;
	
	// We don't support anything other than this.layout === "horizontal"
	
	// Carve the width up for the n items
	var itemCnt = this.items.length;
	// deducting 20 pixels for margins, and preventing divide by 0
	var labelWidth = (size.width - 20) / (itemCnt ? itemCnt : 1) - (itemMargin.left + itemMargin.right);

	var itemSize = {height: 30,
					width: labelWidth};

	// function used to place each item into its correct position
	/** @type {d3DataFunc} */
	var positionItem =
		function (d, i)
		{
			// these values are done as percentages of the height and width of the container
			var x = 10 + itemMargin.left + i * (itemMargin.left + itemSize.width + itemMargin.right);
			var xPerc = x/size.width;
			var y = itemMargin.top;
			var yPerc = 1 - y/size.height;
			return [xPerc, yPerc];
		};

	// make a group to hold the carousel
	var widgetGroup = container.append("g")
		.attr("class", "brixLabelSelector")
		.attr("id", this.id);

	// Rect for the background of the carousel
	widgetGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height);

	var labelConfig = [];

	this.items.forEach(
			function (o, i) { labelConfig[i] = 
										{
										content: o,
										xyPos: positionItem(o, i),
										width: labelWidth
										}; 
							});
	
	
	var labelItems = new pearson.brix.LabelGroup(
			{
			type: this.type,
			labels: labelConfig
			});

	labelItems.draw(container,size);

	/*itemGroups.on('click',
				  function (d, i)
				  {
					  that.selectItemAtIndex(i);
				  });
*/
				
	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of LabelSelector.draw()


/* **************************************************************************
 * LabelSelector.redraw                                                     */ /**
 *
 * Redraw the image as it may have been changed (new URI or caption). It will be
 * redrawn into the same container area as it was last drawn.
 * @export
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.redraw = function ()
{
	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	var image = this.widgetGroup.select("image");
	image.attr("xlink:href", this.URI);
	
	var desc = image.select("desc");
	desc.text(this.caption);
};

/* **************************************************************************
 * LabelSelector.selectedItem                                               */ /**
 *
 * Return the selected item in the carousel.
 * @export
 *
 * @return {pearson.brix.SvgBric} the carousel item which is currently selected.
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.selectedItem = function ()
{
	return this.lastdrawn.widgetGroup.select("g.widgetItem.selected").datum();
};

/* **************************************************************************
 * LabelSelector.selectItemAtIndex                                          */ /**
 *
 * Select the item in the carousel at the given index. If the item is
 * already selected, do nothing.
 * @export
 *
 * @param {number}	index	-the 0-based index of the item to flag as selected.
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.selectItemAtIndex = function (index)
{
	var itemGroups = this.lastdrawn.widgetGroup.selectAll("g.widgetItem");
	var selectedItemGroup = d3.select(itemGroups[0][index]);
	if (selectedItemGroup.classed('selected'))
	{
		return;
	}

	itemGroups.classed("selected", false);
	selectedItemGroup.classed("selected", true);

	this.eventManager.publish(this.selectedEventId, {index: index, selectKey: selectedItemGroup.datum().key});
};

/* **************************************************************************
 * LabelSelector.itemKeyToIndex                                             */ /**
 *
 * Find the first item in the list of items in this Carousel which has the
 * specified key and return its index. If no item has that key return null.
 * @export
 *
 * @param {string}	key		-The key of the item to find
 *
 * @return {?number} the index of the item in the list of items with the
 * 			specified key.
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.itemKeyToIndex = function(key)
{
	for (var i = 0; i < this.items.length; ++i)
	{
		if (this.items[i].key === key)
		{
			return i;
		}
	};

	return null;
};

/* **************************************************************************
 * LabelSelector.calcOptimumHeightForWidth                                  */ /**
 *
 * Calculate the optimum height for this carousel laid out horizontally
 * to fit within the given width.
 * @export
 *
 * @param {number}	width	-The width available to lay out the images in the carousel.
 *
 * @return {number} The optimum height for the carousel to display its items
 * 					in the given width.
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.calcOptimumHeightForWidth = function (width)
{
	// Carve the width up for the n items
	var itemCnt = this.items.length;
	var itemWidth = width / itemCnt - (this.itemMargin.left + this.itemMargin.right);
	var thumbWidth = width / (itemCnt ? itemCnt : 1) - (this.itemMargin.left + this.itemMargin.right);

	//calculate the height for the thumbnail item based on aspect ratio
	var itemAspectRatio = this.items[0].actualSize.height/this.items[0].actualSize.width;
	var thumbHeight = (thumbWidth * itemAspectRatio);
	
	/* 
 	I'm ditching this for now, it seems that the correctly scaled height of
	 the first thumbnail is what's desired - lb
	
	var getHeight = function (item)
	{
		var hwRatio = item.actualSize.height / item.actualSize.width;
		return itemWidth * hwRatio;
	};

	 //Try optimum being the average height
	 var itemHeights = this.items.map(getHeight);
	 var heightSum = itemHeights.reduce(function (pv, cv) {return pv + cv;});
	 */

	return thumbHeight + this.itemMargin.top + this.itemMargin.bottom;
};

/* **************************************************************************
 * LabelSelector.assignMissingItemKeys_                                     */ /**
 *
 * Assign a key property value of the index in the item list to any
 * item which doesn't have a key property. This key is used for selection and
 * highlighting.
 * @private
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.assignMissingItemKeys_ = function ()
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
 * LabelSelector.lite                                                       */ /**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 * @export
 *
 * @param {string|number}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.lite = function (liteKey)
{
	window.console.log("called Carousel.lite( " + liteKey + " )");

	// todo: this works well when all the items are Images but not so well for other widget types
	this.items.forEach(function (item) {item.lite(liteKey);});
	
}; // end of Carousel.lite()

