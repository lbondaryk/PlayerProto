/* **************************************************************************
 * $Workfile:: widget-prototype-axes.js                                     $
 * *********************************************************************/ /**
 *
 * @fileoverview Prototype code to create Axes still in use by graph brix.
 *
 * This contents of this file were actually extracted from widget-base.js
 * on August 31, 2013.
 *
 * This file contains the original prototype code for constructing the
 * axes used by the graph types. It is in desperate need of a refactor
 * which has begun in the widget-axes.js file, but has not been completed,
 * because graph brix have not had an official story as they are not
 * required by the 1st release.
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.AxisFormat');
goog.provide('pearson.brix.PrototypeAxes');

/* **************************************************************************
 * AxisFormat                                                          */ /**
 *
 * An AxisFormat describes how to format the axis of a graph.
 * Objects w/ these fields are arguments to the Axes contructor.
 *
 * @typedef {!Object} pearson.brix.AxisFormat
 * @property {string} type
 *							The type of axis defines its scale.
 *							<ul>
 *							<li> "linear" - ...
 *							<li> "log" - ...
 *							<li> "ordinal" - The values along the axis are determined by a
 *							                 discrete itemized list, gathered from the graphed data.
 *							<li> "double positive" - axis that always counts up from zero,
 *							                         regardless of the sign of the data
 *							<li> "time" - expects data/time formatted values
 *							</ul>
 *
 * @property {number|Array.<*>} ticks
 *							The number of "ticks" to display along the axis including those
 *							at the ends of the axis. Should be a positive integer or zero and
 *							will be coerced to a valid value in an undefined way if not.
 *							Or if the type of axis is "ordinal" then ticks may be an array
 *							to be displayed evenly distributed along the axis.
 *
 * @property {Array.<number>|undefined} extent
 *							The minimum and maximum data values expected for the axis in an
 *							array with the minimum as element 0 and the maximum as element 1.
 *							If undefined, will default to [0, 1], or the [min, max] of the ticks
 *							array if it is an array.
 *
 *							@todo find out why current behavior defaults a vertical axis to [0,1] and
 *							      a horizontal axis to [1e-10,1] -mjl
 *
 * @property {string} orientation
 *							There are 2 sets of orientation values, one for a horizontal (x) axis
 *							and one for a vertical (y) axis.
 *							<ul>
 *							<li> Horizontal (x) axis values
 *							  <ul>
 *							  <li> "top" - The axis should be displayed at the top of the display area
 *							  <li> "bottom" - The axis should be displayed at the bottom of the display area
 *							  </ul>
 *							<li> Vertical (y) axis values
 *							  <ul>
 *							  <li> "left" - The axis should be displayed at the left of the display area
 *							  <li> "right" - The axis should be displayed at the right of the display area
 *							  </ul>
 *							</ul>
 * 
 * @property {htmlString|undefined} label
 *							The label to display along the axis. It must be valid to be converted to
 *							html as the inner html of a span element. This allows the use of text
 *							markup and character entities in the label. Optional. Embedded in SVG as a 
 *							foreignobject tag.
 *
 ****************************************************************************/
pearson.brix.AxisFormat;

/**
 * An AxisFormat describes how to format the axis of a graph.
 * objects w/ these fields are arguments to the Axes contructor.
 * @constructor
 * @note this was the 1st attempt I made at creating a type for the AxisFormat
 * structure. -mjl
 */
pearson.brix.AxisFormatOldDef = function ()
{
	/**
	 * The type of axis defines its scale.
	 * <ul>
	 * <li> "linear" - ...
	 * <li> "log" - ...
	 * <li> "ordinal" - The values along the axis are determined by a
	 *                  discrete itemized list, gathered from the graphed data.
	 * <li> "double positive" - axis that always counts up from zero,
	 *                          regardless of the sign of the data
	 * <li> "time" - expects data/time formatted values
	 * </ul>
	 * @type {string}
	 */
	this.type = "linear";

	/**
	 * The number of "ticks" to display along the axis including those
	 * at the ends of the axis. Should be a positive integer or zero and
	 * will be coerced to a valid value in an undefined way if not.
	 * Or if the type of axis is "ordinal" then ticks may be an array
	 * to be displayed evenly distributed along the axis.
	 * @type {number|Array.<*>}
	 */
	this.ticks = 5;

	/**
	 * The minimum and maximum data values expected for the axis in an
	 * array with the minimum as element 0 and the maximum as element 1.
	 * If undefined, will default to [0, 1], or the [min, max] of the ticks
	 * array if it is an array.
	 * @type {Array.<number>|undefined}
	 *
	 * @todo find out why current behavior defaults a vertical axis to [0,1] and
	 *       a horizontal axis to [1e-10,1] -mjl
	 */
	this.extent = [0, 1];

	/**
	 * There are 2 sets of orientation values, one for a horizontal (x) axis
	 * and one for a vertical (y) axis.
	 * <ul>
	 * <li> Horizontal (x) axis values
	 *   <ul>
	 *   <li> "top" - The axis should be displayed at the top of the display area
	 *   <li> "bottom" - The axis should be displayed at the bottom of the display area
	 *   </ul>
	 * <li> Vertical (y) axis values
	 *   <ul>
	 *   <li> "left" - The axis should be displayed at the left of the display area
	 *   <li> "right" - The axis should be displayed at the right of the display area
	 *   </ul>
	 * </ul>
	 * @type {string}
	 */
	this.orientation = "right";

	/**
	 * The label to display along the axis. It must be valid to be converted to
	 * html as the inner html of a span element. This allows the use of text
	 * markup and character entities in the label. Optional. Embedded in SVG as a 
	 * foreignobject tag.
	 * @type {string|undefined}
	 */
	this.label = "Labels can have extended chars (&mu;m)";
}; // end of AxisFormatOldDef

/* **************************************************************************
 * PrototypeAxes                                                       */ /**
 *
 * Axes draw x-y axes in an SVG Container and provide scaling methods
 * to map data points into the area defined by the axes.
 * The bounds of each axis is defined by either the tick values or by
 * the data extents defined in that axis' AxisFormat.
 *
 * @constructor
 * @export
 *
 * @param {!d3.selection}
 *						container			-The container svg element to append the axes element tree to.
 * @param {Object}		config				-The settings to configure these Axes.
 * @param {string}		config.id			-String to uniquely identify this Axes.
 * @param {!pearson.utils.ISize}
 * 						config.size			-The height and width (in pixels) that the axes must fit within.
 * @param {!pearson.brix.AxisFormat}
 * 						config.xAxisFormat	-The formatting options for the horizontal (x) axis.
 * @param {!pearson.brix.AxisFormat}
 * 						config.yAxisFormat	-The formatting options for the vertical (y) axis.
 *
 ****************************************************************************/
pearson.brix.PrototypeAxes = function (container, config)
{
	this.id = config.id;
	this.container = container;

	this.xFmt = config.xAxisFormat;
	this.yFmt = config.yAxisFormat;

	// Set defaults for missing axis extents
	// Use small positive non-zero value to accomodate log scale
	if (!('extent' in this.xFmt))
		this.xFmt.extent = [1e-10, 1];

	if (!('extent' in this.yFmt))
		this.yFmt.extent = [0, 1];

	//default margin is set that is meant to be updated by the constituent
	//objects if they require more space - mostly happens with axes 
	//margin: an associative array/object with keys for top, bottom, left and right
	this.margin = { top: 10,
					bottom: 0,
					left: 10,
					right: 20 };

	//axis format type is a string specifying "linear", "log", "ordinal", "time", or "double positive" for axis that always count up from zero,
	//regardless of the sign of the data - log only hooked up on x
	//TODO this works for x axis only, if y is needed must be expanded

	//xTicks is either an integer number of ticks or an array of values to use as tickmarks
	//xOrient is a string for orientation "bottom" or "top". Likewise for the yTicks and yOrient
	var xTicks = this.xFmt.ticks;
	var yTicks = this.yFmt.ticks;
	var xOrient = this.xFmt.orientation;
	var yOrient = this.yFmt.orientation;
	var hasXAxisLabel = 'label' in this.xFmt;
	var hasYAxisLabel = 'label' in this.yFmt;

	if (hasXAxisLabel)
	{
		if (xOrient == 'top')
		{
			this.margin.top = this.margin.top + 40;
			window.console.log("top margin increased for top label");
			//catches the case where the whole graph renders to fit within the available SVG,
			//but cuts off at the top because it doesn't get pushed down far enough
		}
		else // xOrient === "bottom" (only other valid value)
		{
			this.margin.bottom = this.margin.bottom + 50;
		}
	}

	if (hasYAxisLabel)
	{
		if (yOrient === 'left')
		{
			this.margin.left = this.margin.left + 50;
			window.console.log("left margin increased for y label");
			//catches the case where the whole graph renders to fit within the available SVG,
			//but cuts off at the right because it gets pushed over too far
		}
		else // yOrient === "right" (only other valid value)
		{
			this.margin.right= this.margin.right + 40;
			window.console.log("right margin increased for y label");
		}
	}

	//xPerc and yPerc are decimals telling how much of the container box to use,
	//typically between 0 and 1. Multiply the width and height of the hard-set svg box
	//used to calculate the aspect ratio when sizing viewport up or down
	// @todo fix this comment -mjl
	
	// The data area is the area that data points will be drawn in.
	var dataAreaWidth = config.size.width - this.margin.left - this.margin.right;
	var dataAreaHeight = config.size.height - this.margin.top - this.margin.bottom;

	var tickheight = 10;

	 
	this.group = this.container.append("g") //make a group to hold new axes
		.attr("id", this.id) //name it so it can be manipulated or highlighted later
		;
	
		
		
	if (this.xFmt.type)
	{
		if (this.yFmt.type == "ordinal")
		{
			//if we're making horizontal ordinal bars (y ordinal axis), x axis must include 0
			this.xFmt.extent.push(0);
			this.xFmt.extent = d3.extent(this.xFmt.extent);
		}
	
		//Check if explicit ticks are specified, and if so, use them as the mapped domain of the graph width
		//ignore the actual data range
		var xExtent = (Array.isArray(xTicks) && this.xFmt.type != "ordinal") ? d3.extent(xTicks) : this.xFmt.extent;

		// this block of ifs sets the scale according to the type, with custom
		// subdivisions suitable to each type -lb

		if (this.xFmt.type == "ordinal")
		{
			//the graph set the extent for ordinal scale to be all the string vals
			this.xScale = d3.scale.ordinal().domain(xExtent) //lists all ordinal x vals
				.rangePoints([0, dataAreaWidth], .4);
			//width is broken into even spaces allowing for data point width and
			//a uniform white space between each, in this case, 40% white space
			// @todo - fix this so it's not just good for scatter graphs -lb
	    }

		if (this.xFmt.type == "linear")
		{
			// if the mode is reverse, swap the order of the extent so it's drawn in reverse
			if (this.xFmt.mode === "reverse")
			{
				xExtent.reverse();
			}
	
			this.xScale = d3.scale.linear().domain(xExtent)
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a linear function mapping x-data to the width of the drawing space

			//TODO put in logic to reverse the x axis if the axis is on the right,
			//or maybe just add a "reverse" setting.
	     }

		if (this.xFmt.type == "log")
		{
			//always start and end on even decades
			var low = Math.floor(Math.log(xExtent[0]) / Math.log(10));
			var high = Math.ceil(Math.log(xExtent[1]) / Math.log(10));

			this.xScale = d3.scale.log().domain([0.99 * Math.pow(10, low), Math.pow(10, high)])
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a log-scale function mapping x-data to the width of the drawing space
	    }

	    if (this.xFmt.type == "time")
	    {
	    	this.xScale = d3.time.scale()
    			.domain(xExtent)
    			.rangeRound([0, dataAreaWidth]);
	    }

		//if the axis is double positive then create leftPositive and rightPositive
		//scales that meet at 0. Still use xScale to plot the data.
		if (this.xFmt.type == "double positive")
		{
			this.xScale = d3.scale.linear().domain(xExtent)
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a function mapping x-data to the width of the drawing space

			var negTicks = [];
			var posTicks = [];
           //store all the negative ticks separately
			if (Array.isArray(xTicks))
			{
				xTicks.forEach(function(o)
							   {
								   if (o < 0)
								   {
									   negTicks.push(Math.abs(o));
								   }
								   else
								   {
									   posTicks.push(o);
								   }
							   });
			}

            // create two scales from negative min to 0, then 0 to positive max
			//map them to the calculated point for xScale(0) - this will need to get recalc'd if the
			//graph gets resized.
			var leftPositive = d3.scale.linear()
				.domain([Math.abs(xExtent[0]), 0])
				.rangeRound([0, this.xScale(0)]);

			var rightPositive = d3.scale.linear()
				.domain([0, xExtent[1]])
				.rangeRound([this.xScale(0), dataAreaWidth]);
		}

		// Format the ticks w/ the general format using a precision of 1 significant digit.
		var format = d3.format(".1");

		//set up the functions that will generate the x axis
		this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
			.scale(this.xScale) //telling the axis to use the scale defined by the function x
			.orient(xOrient).tickSize(tickheight, 0).tickPadding(3);

		// The formatting defaults seem to be ok.  I removed this because it otherwise
		// needs to be special cased for ordinal. -lb
		//this.xAxis.tickFormat(format);

		// this if block sets up the number of ticks or hard-set tick display
		// according to type, starting with formats, then moving on to specific tick
		// values or automatically distributed numbers of ticks - lb

		// if the type is a time axis and ticks are explicit, turn the ticks into Date objects
		if (this.xFmt.type == "time")
		{
			if (Array.isArray(xTicks))
			{ 
				// this is broken at the moment, so it's hard set to the d3 years function
				// it needs to be made into a function that spits out the string of explicit
				// values to set the tick positions and labels, but I can't tell how that should
				// be constructed. I'm lame. - lb
				this.xAxis.ticks(d3.time.years);
			}

			else {
				this.xAxis.ticks(xTicks);
			}
		}
		else if (this.xFmt.type == "log")
		{
			this.xAxis.tickFormat(pearson.brix.utils.logFormat);
			//this prevents too many tick labels on log graphs, making
			//them unreadable
			Array.isArray(xTicks) ? this.xAxis.tickValues(xTicks) : (this.xAxis.ticks(xTicks));
		}
		else if (this.xFmt.type == "double positive")
		{
			this.leftXAxis = d3.svg.axis()
				.scale(leftPositive) //do the faux positive left-hand axis
				.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

			this.xAxis = d3.svg.axis()
				.scale(rightPositive) //do the real positive right-hand axis
				.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

			//next set the ticks to absolute values or just a number of ticks
			Array.isArray(xTicks) ? (this.xAxis.tickValues(posTicks) && this.leftXAxis.tickValues(negTicks))
							  : (this.xAxis.ticks(xTicks - 2) && this.leftXAxis.ticks(2));
		}
		else
		{
			//in the face of anything that isn't log or double positive, supply an explicit array 
			//of ticks to tickValues, or a number of ticks to ticks.
			Array.isArray(xTicks) ? this.xAxis.tickValues(xTicks) : (this.xAxis.ticks(xTicks));
		}

		//now draw the horizontal axis
		this.xaxis = this.group.append("g")
			.call(this.xAxis)
			.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")")
			//move it down if the axis is at the bottom of the graph
			.attr("class", "x axis");

		//if we want positive tick values radiating from 0, then make the 
		//negative half of the axis separately
		if (this.xFmt.type == "double positive")
		{
			this.xaxis.append("g").call(this.leftXAxis)
				.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")")
				//move it down if the axis is at the bottom of the graph
				.attr("class", "x axis");
				// make the x-axis label, if it exists
		}

		if (this.xFmt.label)
		{
			var xaxisDims = this.xaxis.node().getBBox();
			this.xLabelObj = this.xaxis.append("foreignObject")
				.attr("x", 0)
				.attr("y", ((xOrient == "top") ? (-1.5) : 1) * (xaxisDims.height + 2))
				.attr("width", dataAreaWidth).attr("height", 40);

			this.xLabelObj.append("xhtml:body").style("margin", "0px")
				//this interior body shouldn't inherit margins from page body
				.append("div").attr("class", "axisLabel").html(this.xFmt.label) //make the label
				;
		}

		var xHt = d3.round(this.group.select(".x.axis").node().getBBox().height);
	}

	if (this.yFmt.type)
	{
		if (this.yFmt.type == "ordinal")
		{
			// @todo changed the domain from yRange to yTicks. The intention is to have 
			//the graph set the yTicks when the y axis is ordinal from the data. -mjl
			this.yScale = d3.scale.ordinal().domain(yTicks) //lists all ordinal y vals
				.rangeRoundBands([dataAreaHeight, 0], 0.4);

			//width is broken into even spaces allowing for bar width and
			//a uniform white space between each, in this case, 40% white space
	    }
		else
		{
			
			//check that the y range extends down to 0, because data graphs
			// that don't include 0 for y are misleading
			if (this.yFmt.extent[0] > 0)
			{
				this.yFmt.extent[0] = 0;
			}

			var yExtent = (Array.isArray(yTicks)) ? d3.extent(yTicks) : this.yFmt.extent;

			if (this.yFmt.type == "linear")
			{
				// if the mode is reverse, swap the order of the extent so it's drawn in reverse
				(this.yFmt.mode === "reverse") ? yExtent.reverse() : null;
				
				this.yScale = d3.scale.linear().domain(yExtent)
					.rangeRound([dataAreaHeight, 0]);
			}
	    }

		// yScale is a function mapping y-data to height of drawing space.
		//Svg counts height down from the top, so we want the minimum drawn at height
		this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
			.scale(this.yScale) //telling the axis to use the scale defined earlier
			.orient(yOrient).tickSize(tickheight, 0)
			//sets the height of ticks to tickheight, except for the ends, which don't get ticks
			.tickPadding(3);

		//if y ticks are specified explicitly, use them
		Array.isArray(yTicks) ? (this.yAxis.tickValues(yTicks)) : (this.yAxis.ticks(yTicks));
		 
		this.yaxis = this.group.append("g")
			.attr("transform", "translate(" + ((yOrient == "right") ? dataAreaWidth : 0) + ",0)")
			//move it over if the axis is at the bottom of the graph
			.call(this.yAxis).attr("class", "y axis");

		// make the y-axis label, if it exists
		if (hasYAxisLabel)
		{
			var yaxisDims = this.yaxis.node().getBBox();
			var yLabelObj = this.yaxis.append("foreignObject")
				.attr("transform", "translate(" + (((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width)
				   + ((yOrient == "left") ? -20 : 0)) + ","
				   + (dataAreaHeight) + ") rotate(-90)")
				// move it out of the way of the ticks to left or right depending on axis orientation
				.attr("width", dataAreaHeight).attr("height", 40);

			var yLabText = yLabelObj.append("xhtml:body").style("margin", "0px")
				//this interior body shouldn't inherit margins from page body
				.append("div")
					.attr("id","label" + this.id)
					.attr("class", "axisLabel")
					.html(this.yFmt.label) //make the label
				;
			//toDO use this to correctly move to the left of axis
		}

		var yWid = d3.round(this.group.select(".y.axis").node().getBBox().width);
	}

	var axesDims = this.group.node().getBBox();
	//check that rendering is all inside available svg viewport.  If not, enlarge
	//margins and calculate a new inner width, then update all scales and renderings
	if (axesDims.width > config.size.width)
	{
		var addMargin =  d3.round(axesDims.width - config.size.width);
		addMargin = addMargin > yWid ? addMargin:yWid;
		if (yOrient === "right")
		{
			this.margin.right = this.margin.right + addMargin;
		}
		else
		{
			this.margin.left = this.margin.left + addMargin ;
		}

		dataAreaWidth = dataAreaWidth - this.margin.right - this.margin.left;
		//using the new dimensions, redo the scale and axes
		
		if (this.xFmt.type=="ordinal")
		{
			this.xScale.rangePoints([0, dataAreaWidth], 0.4);
		}
		else
		{
			this.xScale.rangeRound([0, dataAreaWidth]);
		}

		this.xAxis.scale(this.xScale);
		window.console.log("x margins increased, new inner width is ", dataAreaWidth, " margin ", this.margin.left, this.margin.right);
		this.xaxis.call(this.xAxis);
		if (this.yaxis)
		{
			this.yaxis.attr("transform", "translate(" + ((yOrient == "right") ? dataAreaWidth : 0) + ",0)");
		}

		if (this.xLabelObj)
		{
			this.xLabelObj.attr("y", d3.round(((xOrient == "top") ? (-1.4) : 1) * (xaxisDims.height + 5)))
				.attr("width", dataAreaWidth).attr("height", 50);
		}
	}

	if (axesDims.height > config.size.height)
	{
		var addMargin = d3.round(axesDims.height - config.size.height);
		if (xOrient === "top")
		{
			this.margin.top = this.margin.top + addMargin;
		}
		else
		{
			this.margin.bottom = this.margin.bottom + addMargin;
		}

		dataAreaHeight = dataAreaHeight - this.margin.top - this.margin.bottom;
		//using the new dimensions, redo the scale and axes
		if (this.yFmt.type=="ordinal")
		{
			this.yScale.rangeRoundBands([dataAreaHeight, 0], .3);
			//width is broken into even spaces allowing for bar width and
			//a uniform white space between each, in this case, 30% white space
		}
		else
		{
			this.yScale.rangeRound([dataAreaHeight, 0]);
		}

		this.yAxis.scale(this.yScale);
		window.console.log("y margins increased, new inner height is ", dataAreaHeight, " margin: ", this.margin.top, this.margin.bottom);
		this.yaxis.call(this.yAxis);
		if (this.xaxis)
		{
			this.xaxis.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")");
		}

		if (yLabelObj)
		{
			yLabelObj.attr("transform", "translate(" + d3.round(((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width)
				   + ((yOrient == "left") ? -19 : 0)) + ","
				   + (dataAreaHeight) + ") rotate(-90)")
				// move it out of the way of the ticks to left or right depending on axis orientation
				.attr("width", dataAreaHeight);
		}
	}

	this.dataRect = pearson.utils.Rect.makeRect({t: this.margin.top, l: this.margin.left, h: dataAreaHeight, w: dataAreaWidth});
	
	//and finally, with the margins all settled, move the group down to accomodate the
	//top and left margins and position
	this.group.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

}; // end PrototypeAxes constructor

