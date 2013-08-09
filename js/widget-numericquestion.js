/* **************************************************************************
 * $Workfile:: widget-numericquestion.js                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the numericquestion widget.
 *
 * The numericquestion widget displays a question and a control
 * for entering a numeric answer (slider, text entry, data point) to be scored.
 * It also has facility for allowing several correct answers, or an answer
 * range.
 *
 * Created on		August 9, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample configuration objects for classes defined here
(function()
{
	
	// numericquestion widget config
	var numqConfig =
	{
		//id: "Q1",
		questionId: "SanVan003",
		question: "How high does it go?",
		widget: Slider,
		widgetConfig: {
			startVal: 12,
			minVal: 12.0,
			maxVal: 18.0,
			stepVal: .1,
			label: "Level:",
			format: d3.format('5.1f'),
			} // 
	};
});


/* **************************************************************************
 * numericquestion                                              */ /**
 *
 * Constructor function for numericquestion brix.
 *
 * @constructor
 * @implements {IWidget}
 * @implements {IQuestion}
 *
 * @param {Object}		config			-The settings to configure this numericquestion
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this numericquestion.
 * 										 if undefined a unique id will be assigned.
 * @param {string}		config.questionId
 * 										-Scoring engine Id of this question
 * @param {string}		config.question	-The HTML question being posed to the user which should
 * 										 be answered by choosing one of the presented choices.
 * @param {Array|undefined}		
 *						config.svgSize	-Two element array with the maxWidth and Height of the 
 *										 svg container, if the widget is an SVG widget.
 * @param {IWidget}		config.widget	-The constructor for a widget that enables a numeric input.
 * @param {!Object}		config.widgetConfig
 * 										-The configuration object for the specified widget
 * 										 constructor without the id properties which
 * 										 will be added by this question constructor.
 * @param {EventManager}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * The numericquestion widget displays a question and a set of possible
 * answers one of which must be selected and submitted to be scored.
 *
 ****************************************************************************/
function NumericQuestion(config, eventManager)
{
	/**
	 * A unique id for this instance of the select one question widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, NumericQuestion);

	/**
	 * The scoring engine id of this question.
	 * @type {string}
	 */
	this.questionId = config.questionId;

	/**
	 * The question text.
	 * @type {string}
	 */
	this.question = config.question;

	var widgetConfig = config.widgetConfig;

	widgetConfig.id = this.id + "_wdgt";

	this.svgSize = config.svgSize;


	/**
	 * The widget used to present the numeric entry to answer
	 * this question.
	 * @type {IWidget}
	 */
	this.choiceWidget = new config.widget(widgetConfig, eventManager);

	// The configuration options for the submit button
	var submitBtnConfig =
	{
		id: this.id + "_sbmtBtn",
		text: "Select an answer",
		enabled: false
	};

	/**
	 * The button widget which allows the answer to the question to be submitted
	 * for scoring.
	 * @type {IWidget}
	 */
	this.submitButton = new Button(submitBtnConfig, eventManager);

	/**
	 * List of responses that have been received for all submitted
	 * scoring requests.
	 * @type {Array.<Object>}
	 */
	this.responses = [];

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when a choice in this question is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.choiceWidget.selectedEventId;

	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The answerKey associated with the selected answer.
	 */

	/**
	 * The event id published when the submit button is clicked.
	 * @const
	 * @type {string}
	 */
	this.submitScoreRequestEventId = this.id + "_submitAnswerRequest";

	/**
	 * The event details for this.submitScoreRequestEventId events
	 * @typedef {Object} SubmitAnswerRequest
	 * @property {SelecOneQuestion} question	-This question widget
	 * @property {string} 			questionId	-The id which identifies this question to the scoring engine.
	 * @property {string} 			answerKey	-The answerKey associated with the selected answer.
	 * @property {function(Object)}	responseCallback
	 * 											-[optional] function to call with the response when it is
	 * 											 returned by the scoring engine.
	 */

	// subscribe to events of our 'child' widgets
	var that = this;
	eventManager.subscribe(this.submitButton.pressedEventId, function () {that.handleSubmitRequested_();});
	eventManager.subscribe(this.choiceWidget.changedValueEventId, function () {that.handleAnswerSelected_();});

	/**
	 * Information about the last drawn instance of this widget (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			widgetGroup: null,
		};
} // end of numericquestion constructor

/**
 * Prefix to use when generating ids for instances of numericquestion.
 * @const
 * @type {string}
 */
NumericQuestion.autoIdPrefix = "numQ_auto_";

/* **************************************************************************
 * numericquestion.handleSubmitRequested_                       */ /**
 *
 * Handle the pressed event from the submit button which means that we want
 * to fire the submit answer requested event.
 * @private
 *
 ****************************************************************************/
NumericQuestion.prototype.handleSubmitRequested_ = function()
{
	var that = this;
	var submitAnsDetails =
		{
			question: this,
			questionId: this.questionId,
			answerKey: "001",
			submissionValue: this.choiceWidget.selectedItem(),
			responseCallback: function (responseDetails) { that.handleSubmitResponse_(responseDetails); }
		};

	this.eventManager.publish(this.submitScoreRequestEventId, submitAnsDetails);
};

/* **************************************************************************
 * numericquestion.handleAnswerSelected_                        */ /**
 *
 * Handle the selected event from the choice widget which means that the
 * submit button can be enabled.
 * @private
 *
 ****************************************************************************/
NumericQuestion.prototype.handleAnswerSelected_ = function()
{
	this.submitButton.setText("Submit Answer");
	this.submitButton.setEnabled(true);
};

/* **************************************************************************
 * numericquestion.handleSubmitResponse_                        */ /**
 *
 * Handle the response to submitting an answer.
 *
 * @param {Object}	responseDetails	-An object containing details about how
 * 									 the submitted answer was scored.
 * @private
 *
 ****************************************************************************/
NumericQuestion.prototype.handleSubmitResponse_ = function(responseDetails)
{
	this.responses.push(responseDetails);

	var responseDiv = this.lastdrawn.widgetGroup.select("div.responses");

	// For now just use the helper function to write the response.
	SubmitManager.appendResponseWithDefaultFormatting(responseDiv, responseDetails);
};

/* **************************************************************************
 * numericquestion.draw                                         */ /**
 *
 * Draw this numericquestion in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container html element to append the
 *								 question element tree to.
 *
 ****************************************************************************/
NumericQuestion.prototype.draw = function(container)
{
	this.lastdrawn.container = container;
	
	// make a div to hold the select one question
	var widgetGroup = container.append("div")
		.attr("class", "widgetnumericquestion")
		.attr("id", this.id);

	var question = widgetGroup.append("p")
		.attr("class", "question")
		.text(this.question);
	
	var choiceWidgetCntr = widgetGroup.append("div")
		.attr("class", "choices")
		.attr("id", "choice_id");

	// check if it's an SVG widget with a size, in which case
	// create 

	if (Array.isArray(this.svgSize)){

		var mcSVG = new SVGContainer({
			node: d3.select("#choice_id"),
			maxWid: this.svgSize[0],
			maxHt: this.svgSize[1]
		});

		mcSVG.append(this.choiceWidget);
	}
	
	else {
		this.choiceWidget.draw(choiceWidgetCntr);
	}

	// draw the submit button below
	var submitButtonCntr = widgetGroup.append("div")
		.attr("class", "submit");

	this.submitButton.draw(submitButtonCntr);

	widgetGroup.append("div")
		.attr("class", "responses");

	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of numericquestion.draw()

/* **************************************************************************
 * numericquestion.selectedItem                                 */ /**
 *
 * Return the selected choice from the choice widget or null if nothing has been
 * selected.
 *
 * @return {Object} the choice which is currently selected or null.
 *
 ****************************************************************************/
NumericQuestion.prototype.selectedItem = function ()
{
	return this.choiceWidget.selectedItem();
};

/* **************************************************************************
 * numericquestion.selectItemAtIndex                            */ /**
 *
 * Select the choice in the choice widget at the given index. If the choice is
 * already selected, do nothing. The index is the displayed choice index and
 * not the config choice index (in other words if the choices have been randomized
 * then the configuration index is NOT the displayed index).
 *
 * @param {number}	index	-the 0-based index of the choice to mark as selected.
 *
 ****************************************************************************/
NumericQuestion.prototype.selectItemAtIndex = function (index)
{
	this.choiceWidget.selectItemAtIndex(index);
};

