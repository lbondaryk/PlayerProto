/* **************************************************************************
 * $Workfile:: widget-radiogroup.js                                         $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the RadioGroup widget.
 *
 * The RadioGroup widget draws a list of choices and allows the user to
 * select one of the choices.
 *
 * Created on		May 29, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.RadioGroup');

goog.require('pearson.utils.IEventManager');
goog.require('pearson.brix.HtmlBric');

// Sample configuration objects for classes defined here
(function()
{
	var Q1Choices =
	[
		{
			content: "Because as the population increases, the absolute number of births increases even though the growth rate stays constant.",
			response: "Growth rate stays constant.",
			answerKey: "correct"
		},
		{
			content: "Because the growth rate increases as the population rises.",
			response: "Does the growth rate change with population size?",
			answerKey: "wrong1"
		},
		{
			content: "Because the total fertility rate increases with population.",
			response: "Does the fertility rate change with population size?",
			answerKey: "wrong2"
	
		},
		{
			content: "Because social behaviors change and people decide to have more children.",
			response: "This might happen but is it something is necessarily occurs?",
			answerKey: "wrong3"
		}
	];
	
	// RadioButton widget config
	var rbConfig =
		{
			id: "RG1",
			choices: Q1Choices,
			numberFormat: "latin-upper"
		};
	
	// RadioButtonQuestion widget config
	var rbqConfig =
	{
		id: "Q1",
		choices: Q1Choices,
		type: "randomized", //default, even if not specified
	};
});

/**
 * Answers are presented to users by certain widgets that allow the user to
 * select one (or more of them).
 *
 * @typedef {Object} pearson.brix.Answer
 * @property {string}	content		-The content of the answer, which presents the
 * 									 meaning of the answer.
 * @property {string}	response	-The response is presented to the user when
 * 									 they choose this answer.
 * @property {string}	answerKey	-This is the unique ID that will be returned
 * 									 to the scoring engine to identify that the
 * 									 user has chosen this answer.
 *
 * @todo: the content currently must be text (a string) however, we are likely
 * to want to make the content be any widget.
 */
pearson.brix.Answer;


/* **************************************************************************
 * RadioGroup                                                          */ /**
 *
 * Constructor function for RadioGroup widget instances.
 *
 * @constructor
 * @extends {pearson.brix.HtmlBric}
 * @export
 *
 * @param {Object}		config			-The settings to configure this RadioGroup
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this RadioGroup.
 * 										 if undefined a unique id will be assigned.
 * @param {!Array.<!pearson.brix.Answer>}
 *						config.choices	-The list of choices (answers) to be presented by the RadioGroup.
 * @param {string|undefined}
 *						config.numberFormat
 *										-The format for numbering the choices. default is "none"
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * The RadioGroup widget draws a list of choices and allows the user to
 * select one of the choices by selecting a radio button next to the choice.
 *
 ****************************************************************************/
pearson.brix.RadioGroup = function (config, eventManager)
{
	// call the base class constructor
	goog.base(this);

	/**
	 * A unique id for this instance of the radio group widget
	 * @type {string}
	 */
	this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.RadioGroup);

	/**
	 * The list of choices presented by the RadioGroup.
	 * @type {!Array.<!pearson.brix.Answer>}
	 */
	this.choices = config.choices;

	/**
	 * The format for numbering the choices.
	 * "none", "latin-upper", "latin-lower", "number", "roman-lower-number"
	 * @type {string}
	 */
	this.numberFormat = config.numberFormat || "none";

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager = eventManager || pearson.utils.IEventManager.dummyEventManager;

	/**
	 * The event id published when an item in this carousel is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.id + '_itemSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The answerKey associated with the selected answer.
	 */
	var SelectedEventDetails;

	/**
	 * Information about the last drawn instance of this image (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			widgetGroup: null,
			choiceSelected: null,
		};
}; // end of RadioGroup constructor
goog.inherits(pearson.brix.RadioGroup, pearson.brix.HtmlBric);

/**
 * Prefix to use when generating ids for instances of RadioGroup.
 * @const
 * @type {string}
 */
pearson.brix.RadioGroup.autoIdPrefix = "rg_auto_";

/* **************************************************************************
 * RadioGroup.draw                                                     */ /**
 *
 * Draw this RadioGroup in the given container.
 * @export
 *
 * @param {!d3.selection}
 *					container	-The container html element to append the radio
 *								 group element tree to.
 *
 ****************************************************************************/
pearson.brix.RadioGroup.prototype.draw = function (container)
{
	this.lastdrawn.container = container;

	var that = this;
	
	// make a div to hold the radio group
	var widgetGroup = container.append("div")
		.attr("class", "widgetRadioGroup")
		.attr("id", this.id);

	// We will use a table to provide structure for the radio group
	// and put each answer in its own row of the table.
	var table = widgetGroup.append("table")
		.attr("class", "questionTable");

	// create the table body to contain the answer rows
	var tbody = table.append("tbody");

	// Create a group for each item then draw the item in that group
	var ansRows = tbody.selectAll("tr").data(this.choices);
	ansRows.enter().append("tr");

	/** @type {d3DataFunc} */
	var getButtonId = function (d, i) {return that.id + "_btn" + i;};

	var buttonCell = ansRows.append("td");
	if (this.numberFormat !== "none")
	{
		var choiceIndex = this.getChoiceNumberToDisplayFn_();

		buttonCell
			.text(/** @type {d3DataFunc} */ (function (d, i) {return choiceIndex(i) + ") ";}));
	}

	buttonCell
		.append("input")
			.attr("id", getButtonId)
			.attr("type", "radio")
			.attr("name", this.id)
			.attr("value", function (d) {return d.answerKey;});

	var labelCell = ansRows.append("td");

	labelCell
		.append("label")
			.attr("for", getButtonId)
			.text(function (d) {return d.content;});
	
	var choiceInputs = widgetGroup.selectAll("div.widgetRadioGroup input[name='" + this.id + "']");
	choiceInputs
		.on("change", function (d)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: d.answerKey});
				});
	
	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of RadioGroup.draw()

/* **************************************************************************
 * RadioGroup.selectedItem                                             */ /**
 *
 * Return the selected choice in the radio group and it's data, 
 * or null if nothing has been selected. Used in multiple choice questions.
 * Note that this does not return the index of the checked item.
 * @export
 *
 * @todo: implement lite for this and keys so it can be used as a regular
 * ui selection widget for mutually exclusive selections. -lb
 *
 * @return {Object} the radio group data corresponding to the choice 
 * which is currently selected or null.
 *
 ****************************************************************************/
pearson.brix.RadioGroup.prototype.selectedItem = function ()
{
	var selectedInputSelector = "div.widgetRadioGroup input[name='" + this.id + "']:checked";
	var selectedInput = this.lastdrawn.widgetGroup.select(selectedInputSelector);
	return !selectedInput.empty() ? selectedInput.datum() : null;
};

/* **************************************************************************
 * RadioGroup.selectItemAtIndex                                        */ /**
 *
 * Select the choice in the radio group at the given index. If the choice is
 * already selected, do nothing.
 * @export
 *
 * @param {number}	index	-the 0-based index of the choice to mark as selected.
 *
 ****************************************************************************/
pearson.brix.RadioGroup.prototype.selectItemAtIndex = function (index)
{
	var choiceInputs = this.lastdrawn.widgetGroup.selectAll("div.widgetRadioGroup input");
	var selectedInput = choiceInputs[0][index];

	if (selectedInput.checked)
	{
		return;
	}

	// choice at index is not selected, so select it and publish selected event
	selectedInput.checked = true;

	var d = /** @type {!pearson.brix.Answer} */ (d3.select(selectedInput).datum());

	this.eventManager.publish(this.selectedEventId, {selectKey: d.answerKey});
};

/* **************************************************************************
 * RadioGroup.getChoiceNumberToDisplayFn_                              */ /**
 *
 * Get a function which returns the string that should be prefixed to the
 * choice at a given index
 *
 * @private
 *
 ****************************************************************************/
pearson.brix.RadioGroup.prototype.getChoiceNumberToDisplayFn_ = function ()
{
	var formatIndexUsing =
	{
		"none": function (i)
				{
					return "";
				},
		"latin-upper": function (i)
				{
					return String.fromCharCode("A".charCodeAt(0) + i);
				},
		"latin-lower": function (i)
				{
					return String.fromCharCode("a".charCodeAt(0) + i);
				},
		"number": function (i)
				{
					return (i+1).toString();
				},
	};

	return (this.numberFormat in formatIndexUsing) ? formatIndexUsing[this.numberFormat]
												   : formatIndexUsing["none"];
};

