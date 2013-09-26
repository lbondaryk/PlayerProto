/* **************************************************************************
 * $Workfile:: brix-labelselector.js                                        $
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
			labels: ["foo","bar","thing"],
			layout: "horizontal",
			itemMargin: {top: 4, bottom: 4, left: 2, right: 2},
			type: "numbered"
		};
});

/* **************************************************************************
 * LabelSelector                                                       */ /**
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
 * @param {!Array.<string>}
 *						config.labels	-The list of label strings to be presented by the Selector.
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
	 * @type {!Array.<string>}
	 */
	this.labels = config.labels;

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
	
	// configuration for the labelItems LabelGroup.
	var labelConfig =
		{
			id: this.id + '_labels',
			type: this.type,
			labels: []	// will be populated by draw()
		};

	/**
	 * The label group that draws the labels
	 * @type {pearson.brix.LabelGroup}
	 */
	this.labelItems = new pearson.brix.LabelGroup(labelConfig, this.eventManager);
	
	/**
	 * The event id published when a label in this LabelSelector is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.labelItems.selectedEventId;
	
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
pearson.brix.LabelSelector.autoIdPrefix = "labSel_auto_";

/* **************************************************************************
 * LabelSelector.draw                                                  */ /**
 *
 * @inheritDoc
 * @export
 * @description The following is here until jsdoc supports the inheritDoc tag.
 * Draw this LabelSelector in the given container.
 *
 * @param {!d3.selection}	container	-The container svg element to append
 *										this SvgBric element tree to.
 * @param {!pearson.utils.ISize}
 *							size		-The size (in pixels) of the area this
 *										SvgBric has been allocated.
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	// aliases of utility functions for readability
	var attrFnVal = pearson.brix.utils.attrFnVal;

	var that = this;
	
	var itemMargin = this.itemMargin;
	
	var labelItemsLabels = this.labelItems.labels;

	// We don't support anything other than this.layout === "horizontal"


	if (Array.isArray(this.labels)) {
		// If labels is a set of strings, then divide the width evenly and put the label strings in
		// Carve the width up for the n items
		var itemCnt = this.labels.length;

		// deducting 30 pixels for r/l margins, and preventing divide by 0
		var labelWidth = (size.width - 30) / (itemCnt ? itemCnt : 1) - (itemMargin.left + itemMargin.right);
		var itemSize = {height: 44,
					width: labelWidth};
		/**
		 * function used to place each item into its correct position
		 * @type {function(*, number):Array.<number>}
		 */
		var positionItem =
			function (d, i)
			{
				// these values are done as percentages of the height and width of the container
				var x = 15 + itemMargin.left + i * (itemMargin.left + itemSize.width + itemMargin.right);
				var xPerc = x/size.width;
				var y = itemMargin.top;
				var yPerc = 1 - d3.round(y/size.height, 2);
				return [xPerc, yPerc];
			};

		this.labels.forEach(
				function (o, i) { labelItemsLabels[i] = 
									{
										content: o,
										xyPos: positionItem(o, i),
										width: labelWidth
									}; 
								});
		} // end if

	else {
		// if labels is just a count of numerical labels, then spread them out one after the other
		// packed on the left after a 15 pixel margin

		var itemCnt = this.labels;

		var itemSize = {height: 44,
					width: 44};
		/**
		* function used to place each item into its correct position
		* @type {function(*, number):Array.<number>}
		*/
		var positionItem =
			function (i)
			{
				// these values are done as percentages of the height and width of the container
				var x = 15 + itemMargin.left + i * (itemMargin.left + itemSize.width + itemMargin.right);
				var xPerc = x/size.width;
				var y = itemMargin.top;
				var yPerc = 1 - d3.round(y/size.height, 2);
				return [xPerc, yPerc];
			};

	for (var i = this.labels - 1; i >= 0; i--)
		{
			labelItemsLabels[i] =
					{
					content: "",
					xyPos: positionItem(i),
					width: 0
					}; 
		}
	} // end else

	this.labelItems.draw(container, size);

	this.lastdrawn.widgetGroup = d3.select(this.id);

}; // end of LabelSelector.draw()


/* **************************************************************************
 * LabelSelector.redraw                                                */ /**
 *
 * Redraw the labels as they may get updated text or order. It will be
 * redrawn into the same container area as it was last drawn.
 * @export
 *
 ****************************************************************************/
pearson.brix.LabelSelector.prototype.redraw = function ()
{
};

/* **************************************************************************
 * LabelSelector.selectItemAtIndex                                     */ /**
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

	this.labelItems.lite(index.toString());

	this.eventManager.publish(this.selectedEventId, {index: index, selectKey: index.toString()});
};



/* **************************************************************************
 * LabelSelector.lite                                                  */ /**
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
	this.labelItems.lite(liteKey);
	
}; // end of Carousel.lite()
