/* **************************************************************************
 * $Workfile:: briclayer.js                                                 $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the BricLayer.
 *
 * The BricLayer creates brix and connecting cement as defined by a
 * master configuration object.
 *
 * Created on		September 10, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.BrixLayer');
goog.provide('pearson.brix.BricTypes');

goog.require('pearson.utils.IEventManager');
goog.require('pearson.utils.EventManager');
goog.require('pearson.brix.BricWorks');

// brix
goog.require('pearson.brix.SVGContainer');
goog.require('pearson.brix.BarChart');
goog.require('pearson.brix.Button');
goog.require('pearson.brix.Callouts');
goog.require('pearson.brix.CaptionedImage');
goog.require('pearson.brix.Carousel');
goog.require('pearson.brix.CheckGroup');
goog.require('pearson.brix.Image');
goog.require('pearson.brix.ImageViewer');
goog.require('pearson.brix.LabelGroup');
goog.require('pearson.brix.Legend');
goog.require('pearson.brix.LineGraph');
goog.require('pearson.brix.MarkerGroup');
goog.require('pearson.brix.MultipleChoiceQuestion');
goog.require('pearson.brix.MultiSelectQuestion');
goog.require('pearson.brix.NumericInput');
goog.require('pearson.brix.NumericQuestion');
goog.require('pearson.brix.PieChart');
goog.require('pearson.brix.RadioGroup');
goog.require('pearson.brix.Readout');
goog.require('pearson.brix.SelectGroup');
goog.require('pearson.brix.Sketch');
goog.require('pearson.brix.Slider');

// cement
// none yet


/* **************************************************************************
 * BricTypes                                                           */ /**
 *
 * This is the enumeration of all known bric types that will be registered
 * with the BricWorks instance of a BricLayer.
 *
 * @enum {string}
 *
 ****************************************************************************/
pearson.brix.BricTypes =
{
	SVGCONTAINER:			"SvgContainer",
	BARCHART:				"BarChart",
	BUTTON:					"Button",
	CALLOUTS:				"Callouts",
	CAPTIONEDIMAGE:			"CaptionedImage",
	CAROUSEL:				"Carousel",
	CHECKGROUP:				"CheckGroup",
	IMAGE:					"Image",
	IMAGEVIEWER:			"ImageViewer",
	LABELGROUP:				"LabelGroup",
	LEGEND:					"Legend",
	LINEGRAPH:				"LineGraph",
	MARKERGROUP:			"MarkerGroup",
	MULTIPLECHOICEQUESTION:	"MultipleChoiceQuestion",
	MULTISELECTQUESTION:	"MultiSelectQuestion",
	NUMERICINPUT:			"NumericInput",
	NUMERICQUESTION:		"NumericQuestion",
	PIECHART:				"PieChart",
	RADIOGROUP:				"RadioGroup",
	READOUT:				"Readout",
	SELECTGROUP:			"SelectGroup",
	SKETCH:					"Sketch",
	SLIDER:					"Slider"
};


/* **************************************************************************
 * BricLayer                                                           */ /**
 *
 * Constructor function for the BricLayer factory.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this BrixLayer.
 * 										 (there are none right now so this will
 * 										 usually be specified as null or an empty object.)
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * A BricLayer creates brix and connecting cement as defined by a master
 * configuration object.
 *
 ****************************************************************************/
pearson.brix.BricLayer = function (config, eventManager)
{
	/**
	 * The event manager to use to publish (and subscribe to) events for the
	 * created brix and cement.
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager = eventManager || new pearson.utils.EventManager();

	/**
	 * The bricWorks is the factory which builds all brix. It should
	 * ONLY be accessed using the getBricWorks accessor function.
	 * @type {pearson.brix.BricWorks}
	 */
	this.bricWorks_ = null;

}; // end of BricLayer constructor

/* **************************************************************************
 * BricLayer.build                                                     */ /**
 *
 * Create all of the brix and cement as described in the given configuration
 * object.
 *
 * @param {Object}	activityConfig		-Configuration describing the brix and
 * 										 cement to be created.
 *
 * @returns {Object} an object containing all of the created brix and cement.
 *
 ****************************************************************************/
pearson.brix.BricLayer.prototype.build = function (activityConfig)
{
	var building = {};
	return building;
};

/* **************************************************************************
 * BricLayer.getBricWorks                                              */ /**
 *
 * Get the BricWorks that is used by this BricLayer to create all brix.
 *
 * @returns {!pearson.brix.BricWorks}
 *
 ****************************************************************************/
pearson.brix.BricLayer.prototype.getBricWorks = function ()
{
	if (this.bricWorks_)
	{
		return this.bricWorks_;
	}

	// 1st time the BricWorks was accessed, so create it.
	var bricWorks = new pearson.brix.BricWorks(null, this.eventManager);

	// register all brix
	var BricTypes = pearson.brix.BricTypes;
	bricWorks.registerMold(BricTypes.SVGCONTAINER, pearson.brix.SVGContainer);
	bricWorks.registerMold(BricTypes.BARCHART, pearson.brix.BarChart);
	bricWorks.registerMold(BricTypes.BUTTON, pearson.brix.Button);
	bricWorks.registerMold(BricTypes.CALLOUTS, pearson.brix.Callouts);
	bricWorks.registerMold(BricTypes.CAROUSEL, pearson.brix.Carousel);
	bricWorks.registerMold(BricTypes.CHECKGROUP, pearson.brix.CheckGroup);
	bricWorks.registerMold(BricTypes.IMAGE, pearson.brix.Image);
	bricWorks.registerMold(BricTypes.IMAGEVIEWER, pearson.brix.ImageViewer);
	bricWorks.registerMold(BricTypes.LABELGROUP, pearson.brix.LabelGroup);
	bricWorks.registerMold(BricTypes.LEGEND, pearson.brix.Legend);
	bricWorks.registerMold(BricTypes.LINEGRAPH, pearson.brix.LineGraph);
	bricWorks.registerMold(BricTypes.MARKERGROUP, pearson.brix.MarkerGroup);
	bricWorks.registerMold(BricTypes.MULTIPLECHOICEQUESTION, pearson.brix.MultipleChoiceQuestion);
	bricWorks.registerMold(BricTypes.MULTISELECTQUESTION, pearson.brix.MultiSelectQuestion);
	bricWorks.registerMold(BricTypes.NUMERICINPUT, pearson.brix.NumericInput);
	bricWorks.registerMold(BricTypes.NUMERICQUESTION, pearson.brix.NumericQuestion);
	bricWorks.registerMold(BricTypes.PIECHART, pearson.brix.PieChart);
	bricWorks.registerMold(BricTypes.RADIOGROUP, pearson.brix.RadioGroup);
	bricWorks.registerMold(BricTypes.READOUT, pearson.brix.Readout);
	bricWorks.registerMold(BricTypes.SELECTGROUP, pearson.brix.SelectGroup);
	bricWorks.registerMold(BricTypes.SKETCH, pearson.brix.Sketch);
	bricWorks.registerMold(BricTypes.SLIDER, pearson.brix.Slider);

	this.bricWorks_ = bricWorks;

	return this.bricWorks_;
};

