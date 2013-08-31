/* **************************************************************************
 * $Workfile:: widget-barchart.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link pearson.brix.BarChart} bric.
 *
 * The Barchart bric provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * Created on		April 11, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.BarChart');

// Sample BarChart constructor configuration
(function()
{
	var bc1Config = {
			id: "bc1",
			Data: [],
			type: "grouped",
			xAxisFormat: { type: "linear",
						   mode: "reverse",
						   ticks: 5,
						   orientation: "bottom",
						   label: "linear bar value (%)" },
			yAxisFormat: { type: "ordinal",
						   ticks: 5,
						   orientation: "left",
						   label: "Bar category labels" },
		};
});
	
/* **************************************************************************
 * BarChart                                                            */ /**
 *
 * Constructor function for a BarChart bric.
 *
 * @constructor
 * @export
 *
 * @param {Object}		config			-The settings to configure this BarChart
 * @param {string}		config.id		-String to uniquely identify this BarChart.
 * @param {Array.<Array.<{x: number, y: string, key: (string|undefined)}>>}
 *						config.Data		-An array of series;
 *										 each series is an array of one or more bars with names.
 *										 Either bars or series can have a key label for highlighting.
 * @param {string}		config.type		-String specifying "grouped", or anything else (ignored)
 * @param {pearson.brix.AxisFormat}
 * 						config.xAxisFormat -Format of the x axis of the graph.
 * @param {pearson.brix.AxisFormat}
 * 						config.yAxisFormat -Format of the y axis of the graph.
 * @param {!pearson.utils.EventManager=}
 * 						eventManager	-allows the object to emit events
 *
 * @note: One of the two axes must be ordinal for a bar graph. Only y is accomodated
 * for now.
 * There's a lot of logic in here to make sure that both positive and
 * negative values are accomodated.  Negative values have to count right to x=0
 * and positive must always count right from x=0. Currently all bar graphs are
 * assumed to layout horizontally.
 * @todo: vertical bar graphs (thermometers)
 * @todo: emit events when edges of bars are dragged to set a new value
 *
 * @classdesc
 * The BarChart widget provides single or multiple series bar chart
 * visualization of sets of data points. Can create pyramid chart (two sided)
 * or grouped bar chart (several bars on the same label from different series - multivariate)
 *
 **************************************************************************/
pearson.brix.BarChart = function (config, eventManager)
{
	/**
	 * A unique id for this instance of the bar chart widget
	 * @type {string}
	 */
	this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.BarChart);

	/**
	 * Array of bar series, where each series is an array of objects/bars, and each object is a
	 * bar lengths and category w/ a {number/size} x and {string} y property.
	 * Negative bar lengths Mean bars should face the other way.
	 * @type {Array.<Array.<{x: number, y: string, key: (string|undefined)}>>}
	 *
	 * @example
	 *   // 3 series, 1 bar each:
	 *   [[{y: "High Income", x: 5523.6}],
	 *    [{yVal: "Middle Income", xVal: 1509.3}],
	 *    [{y: "Low Income", x: 491.8}]]
	 * @example
	 *   // bar objects may also include an optional key: string in
	 *   // which case they will be given an ID that  associates them
	 *   // with other widget events in the page, such as clicks on
	 *   // the legend.
	 */
	this.data = config.Data;

	/**
	 * The render type is one of:
	 *
	 *  - "grouped" for bars from multiple series with the same label, 
	 *    plotted side by side instead of on top of one another
	 *  - {null} for regular bars
	 *
	 * @type {string}
	 */
	this.type = config.type;

	/**
	 * Format of the x axis of the graph.
	 * @type {!pearson.brix.AxisFormat}
	 */
	this.xAxisFormat = config.xAxisFormat;

	/**
	 * Format of the y axis of the graph.
	 * @type {!pearson.brix.AxisFormat}
	 */
	this.yAxisFormat = config.yAxisFormat;

	/**
	 * List of child widgets which are to be drawn before and after this
	 * bar chart's data in its data area.
	 * Child widgets are added using BarChart.append.
	 * @type {{beforeData: Array.<pearson.brix.SvgBric>, afterData: Array.<pearson.brix.SvgBric>}}
	 */
	this.childWidgets = {beforeData: [], afterData: []};
		
	//these aren't hooked up yet, but I expect bar graphs to eventually need
	//to fire drag events that let users change the data for the bar length
	//and drag events that let users sort the data differently, reordering the bars -lb
	this.eventManager = eventManager;
	/**
	 * The event id published when a row in this group is selected.
	 * @const
	 * @type {string}
	 */

	this.selectedEventId = this.id + '_barSelected';
	this.sortedEventId = this.id + 'barSortChanged';
	
	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			dataRect: new pearson.utils.Rect(0, 0, 0, 0),
			axes: null,
			xScale: null,
			yScale: null,
			groupScale: null,
			bandsize: null,
			bars: null,
			graph: null,
		};
} // end of barChart constructor

/**
 * Prefix to use when generating ids for instances of BarChart.
 * @const
 * @type {string}
 */
pearson.brix.BarChart.autoIdPrefix = "bar_auto_";


/* **************************************************************************
 * BarChart.draw                                                       */ /**
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 * @export
 *
 * @param {!d3.selection}
 *						container	-The container svg element to append the graph element tree to.
 * @param {!pearson.utils.ISize}
 * 						size		-The size in pixels for the graph
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	// Create the axes (svg canvas) in the container
	var axesConfig = {
			id: this.id + '_axes',
			size: this.lastdrawn.size,
			xAxisFormat: this.xAxisFormat,
			yAxisFormat: this.yAxisFormat,
		};
		
	var dataPts = d3.merge(this.data);
	
	//all the data in each dimension is merged to use for the domain  
	//on the axis (autoranging)
	axesConfig.xAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.x;});
	axesConfig.yAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.y;});

	//Check to see whether ordinal or other scales will be generated
	// and whether explicit ticks are set, which overrides the autoranging
	if (axesConfig.xAxisFormat.type == 'ordinal' && !Array.isArray(axesConfig.xAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.x;}));
		axesConfig.xAxisFormat.ticks = ordinalValueMap.values();
	}
	
	if (axesConfig.yAxisFormat.type == 'ordinal' && !Array.isArray(axesConfig.yAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.y;}));
		axesConfig.yAxisFormat.ticks = ordinalValueMap.values();
		
	} 
	
	
	//make the axes for this graph - draw these first because these are the 
	//pieces that need extra unknown space for ticks, ticklabels, axis label
	this.lastdrawn.axes = new pearson.brix.Axes(this.lastdrawn.container, axesConfig);
	//only draw axes if there aren't any yet
	/*
	if(!d3.select("#"+ axesConfig.id)[0][0]){
		this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);
	}*/
	
	
	//inherit the dataRect from the axes container
	this.lastdrawn.dataRect = this.lastdrawn.axes.dataRect;
	
	// alias for axes once they've been rendered
	var axesDrawn = this.lastdrawn.axes;

	//inherit the x and y scales from the axes 
	this.lastdrawn.xScale = axesDrawn.xScale;
	this.lastdrawn.yScale = axesDrawn.yScale;
	this.lastdrawn.barsId = this.id + '_bars';
	var barsId = this.lastdrawn.barsId;
	
	

	//get the size of the bars and spacing produced by ordinal scale
	//TODO: would need to be xScale if the bars are vertical
	this.lastdrawn.bandsize = axesDrawn.yScale.rangeBand();
	var bandsize = this.lastdrawn.bandsize;
	
	if (this.type == "grouped")
	{
		//grouped bar charts find the common labels in each data set and draw non-overlapping
		//bars in a group, one bar in each series for that label.
		//The effect of the following code is to calculate a "subspacing" that fans
		//the individual bars in each label/group out around the central point for the data
		//label on the axis.
		var indices = [];

		for (var i = 0; i < this.data.length; i++)
		{
			indices.push(i); //needed to space out grouped barcharts
		}

		var groupScale = d3.scale.ordinal()
			.domain(indices) //creates an extra ordinal set that encloses the data label,
			//one for each group (element in data array)
			.rangeRoundBands([bandsize, 0]);
			
			//TEST: The last index  should produce the topmost bar
			//appearing at y = 0
		window.console.log("Grouped barChart last bar mapped to 0 offset: ",
			groupScale(this.data.length - 1) == 0);
	};


	// Draw any 'before' child widgets that got appended before draw was called
	this.childWidgets.beforeData.forEach(this.drawWidget_, this);

	var graph = axesDrawn.group.append("g") //make a group to hold bars
		.attr("class","widgetBarChart").attr("id", this.id);

	
	this.lastdrawn.graph = graph;
	this.lastdrawn.groupScale = groupScale;
	
	// Draw the data (traces and/or points as specified by the graph type)
	this.drawData_();

	// Draw any 'after' child widgets that got appended after draw was called
	this.childWidgets.afterData.forEach(this.drawWidget_, this);
	
}; // end of pearson.brix.BarChart.draw()


/* **************************************************************************
 * BarChart.redraw                                                     */ /**
 *
 * Redraw the line graph data as it may have been modified. It will be
 * redrawn into the same container area as it was last drawn.
 * @export
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.redraw = function ()
{
	// TODO: We may want to create new axes if the changed data would cause their
	//       min/max to have changed, but for now we're going to keep them.

	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	this.childWidgets.beforeData.forEach(this.redrawWidget_, this);
	this.drawData_();
	this.childWidgets.afterData.forEach(this.redrawWidget_, this);
};

/* **************************************************************************
 * BarChart.drawWidget_                                                */ /**
 *
 * Draw the given child widget in this charts's data area.
 * This chart must have been drawn BEFORE this method is called or
 * bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.drawWidget_ = function (widget)
{
	widget.setScale(this.lastdrawn.xScale, this.lastdrawn.yScale);
	widget.draw(this.lastdrawn.axes.group, this.lastdrawn.dataRect.getSize());
};


/* **************************************************************************
 * BarChart.redrawWidget_                                              */ /**
 *
 * Redraw the given child widget.
 * This bar chart and this child widget must have been drawn BEFORE this
 * method is called or bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.redrawWidget_ = function (widget)
{
	widget.redraw();
};

/* **************************************************************************
 * BarChart.drawData_                                                  */ /**
 *
 * Draw the chart data (overwriting any existing data).
 *
 * @private
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.drawData_ = function ()
{
	// local var names are easier to read (shorter)
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;
	var bandsize = this.lastdrawn.bandsize;
	var groupScale = this.lastdrawn.groupScale;
	var that = this;
	
	// get the group that contains the graph lines
	var graph = this.lastdrawn.graph;
	
	//draw the series
	// bind all the series data to a group element w/ a series class
	// creating or removing group elements so that each series has its own group.
	var barSeries = graph.selectAll("g.series")
		.data(this.data);

	barSeries.enter()
		.append("g")
			.attr("class", function(d, i) {
					//give each series it's own color
					return "series fill" + i;
				});
	//on redraw, get rid of any series which now have no data
	barSeries.exit().remove();  

	// autokey entries which have no key with the data index for highlighting
	// can't use the y label because it might contain spaces. 
	barSeries.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});
	//If it's a grouped barchart, shimmie out the bars by group
	//Bars will be thinner and the group will be centered around
	//the ordinal label. The whole series can be shifted up or down 
	//according to it's order.  TODO: make these sortable by max or
	//min value for any group label
	if (this.type == "grouped")
	{
		barSeries.attr("transform", function(d, i) {
				return "translate(0," + (groupScale(i)) + ")";
				});
	}
	

	// The series data is an array of values for each bar of the series
	// bind each series data element (bar length) to a child group element, 
	// one for each bar in the series. - mjl
	//	Enclose the bars in individual groups 
	// so you could choose to label the ends with data or label
	//  and have it stick to the bar by putting it in the same group -lb
	var bars = barSeries.selectAll("g.bar")
		.data(function(d) {return d;}); 	//drill down into the nested data

	bars.exit().remove();
 
	bars.enter()
		.append("g")
			.attr("class", "bar")
			.append("rect");
			
	// TODO: figure out a strategy for highlighting and selecting individual bars -lb 

	bars.attr("transform",
				  function(d)
				  {
				// move each group to the x=0 position horizontally if it's a
				// positive bar, or start at it's negative x value if negative,
				// or at it's positive value if reversedx.
				// The negative value logic allows us to draw pyramid charts, normally bar 
				// charts are bin counts and all positive. 
				      var x = (d.x < 0 || that.lastdrawn.axes.xFmt.mode === "reverse") ? xScale(d.x) : xScale(0);
					  var y = yScale(d.y);
				      return "translate(" + x + "," + y + ")";
				  });
				  
	// Update the height and width of the bar rects based on the data points bound above.
	bars.select("rect")
	//if grouped, each bar is only 1/(# groups) of the available height around 
	// an ordinal tickmark
		.attr("height", (this.type == "grouped") ? (bandsize / (this.data.length + 1)) : bandsize)
		.attr("width",
			  function(d)
			  {
				  return Math.abs(xScale(0) - xScale(d.x));
			  });
			  
	
	bars.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: d.key});
				});
				
	//do a clean selection of the drawn data to store for the object properties
	this.lastdrawn.bars = graph.selectAll("g.series");
};

/* **************************************************************************
 * BarChart.append                                                     */ /**
 *
 * Append the widget or widgets to this bar chart and draw it/them on top
 * of the data area and any widgets appended earlier. If append
 * is called before draw has been called, then the appended widget(s) will be
 * drawn when draw is called.
 * @export
 *
 * @param {!IWidget|Array.<IWidget>}
 * 						svgWidgets	-The widget or array of widgets to be drawn in
 *									 this line graph's data area.
 * @param {string|undefined}
 * 						zOrder		-Optional. Specifies whether to append this
 * 									 widget to the list of widgets that are
 * 									 drawn before the graph data or the list that
 * 									 is drawn after. "after" | "before", defaults
 * 									 to "after".
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.append = function(svgWidgets, zOrder)
{
	if (!Array.isArray(svgWidgets))
	{
		this.append_one_(svgWidgets, zOrder);
	}
	else
	{
		svgWidgets.forEach(function (w) {this.append_one_(w, zOrder);}, this);
	}

	// Deal w/ drawing the appended widgets before already drawn data.
	if (zOrder === "before" && this.lastdrawn.container != null)
	{
		// we need to remove the existing drawn elements and execute draw again
		var container = this.lastdrawn.container;
		var size = this.lastdrawn.size;
		var axes = this.lastdrawn.axes;
		this.clearLastdrawn_();
		axes.group.remove();
		this.draw(container, size);
	}
		
}; // end of pearson.brix.BarChart.append()

/* **************************************************************************
 * BarChart.append_one_                                                */ /**
 *
 * Helper for append that does the work needed to append a single widget.
 * This can handle drawing the widget after the data even after the data
 * has been drawn, but it does not handle drawning the widget before when
 * the data has already been drawn, so the caller must deal with that situation.
 *
 * @param {!IWidget}	widget	-The widget which is to be drawn in this line
 *								 graph's data area.
 * @param {string|undefined}
 * 						zOrder	-Optional. Specifies whether to append this
 * 								 widget to the list of widgets that are
 * 								 drawn before the graph data or the list that
 * 								 is drawn after. "after" | "before", defaults
 * 								 to "after".
 *
 * @private
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.append_one_ = function(widget, zOrder)
{
	if (zOrder === "before")
	{
		this.childWidgets.beforeData.push(widget);
	}
	else
	{
		this.childWidgets.afterData.push(widget);
	
		if (this.lastdrawn.container !== null)
			this.drawWidget_(widget);
	}
		
} // end of pearson.brix.BarChart.append_one_()


/* **************************************************************************
 * BarChart.lite                                                       */ /**
 *
 * Highlight the members of the collection associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 * @export
 *
 * @param {string}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
pearson.brix.BarChart.prototype.lite = function(liteKey)
{
	window.console.log("TODO: log fired BarChart highlite " + liteKey);
	
	// Turn off all current highlights
	var allBars = this.lastdrawn.bars;
	allBars
		.classed("lit", false);
		
	//var allSeries = this.lastdrawn.series;
	//allSeries
		//.classed("lit", false);

	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesKey = function (d, i) { return d.key === liteKey; };
	
	var barsToLite = allBars.filter(matchesKey);

	// Highlight the labels w/ the matching key
	barsToLite
		.classed("lit", true);

	if (barsToLite.empty())
	{
		window.console.log("No key '" + liteKey + "' in bar chart " + this.id );
	}
};

