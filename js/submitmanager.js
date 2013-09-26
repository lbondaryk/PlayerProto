/* **************************************************************************
 * $Workfile:: submitmanager.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of a SubmitManager object.
 *
 * The SubmitManager does some stuff.
 *
 * Created on		June 4, 2013
 * @author			Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.SubmitManager');
goog.provide('pearson.paf');

goog.require('pearson.brix.AnswerMan');

/**
 * The PAF Activity ID used by the scoring engine to identify
 * the particular activity (question) being scored.
 *
 * @typedef {string} pearson.paf.SequenceNodeId
 */
pearson.paf.SequenceNodeId;

/* **************************************************************************
 * SubmitManager                                                       */ /**
 *
 * Constructor function for the SubmitManager class
 *
 * @constructor
 *
 * @param {!pearson.utils.EventManager}
 * 						eventManager	-The event manager to use for publishing events
 * 									 	 and subscribing to them.
 * @param {!pearson.brix.AnswerMan=}
 * 						answerMan		-The correctness engine to process the selected answer.
 *
 * @classdesc
 * The submit manager handles your submissions, yo.
 *
 * It listens (subscribes) for scoring requests from registered widgets,
 * handles getting the request to the scoring engine and processes the
 * response, returning that response to the requesting widget if there
 * is a callback associated w/ the request.
 *
 ****************************************************************************/
pearson.brix.SubmitManager = function (eventManager, answerMan)
{
	/**
	 * The answerMan provides feedback to submissions 
	 * @type {!pearson.brix.AnswerMan}
	 */
	this.answerMan = answerMan || new pearson.brix.AnswerMan();
	
	/**
	 * The event manager to use to publish (and subscribe to) events
	 * @type {!pearson.utils.EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * map of all submitted answers awaiting a response from
	 * the scoring engine.
	 * @type {Object.<pearson.paf.SequenceNodeId, pearson.brix.SubmitManager.PendingDetails>}
	 * @private
	 */
	this.requestsAwaitingResponse_ = {};
};

/**
 * The PendingDetails is the information about an outstanding
 * request for an activity to be scored by the scoring engine.
 *
 * @typedef {Object} pearson.brix.SubmitManager.PendingDetails
 * @property {pearson.paf.SequenceNodeId}
 * 								sequenceNodeId	-The PAF Activity Id which identifies the
 * 												 activity being scored.
 * @property {string}			answer			-The 'key' of the chosen answer to be scored.
 * @property {number|undefined}	value			-If the answer selection is not from a discrete list
 * 												 this is the numeric value chosen.
 * @property {function(Object)}	responseCallback
 * 												-The function to call w/ the response from
 * 												 the scoring engine.
 * @property {Object}			requestDetails	-The details from the score
 * 												 request event from the question widget.
 */
pearson.brix.SubmitManager.PendingDetails;

/* **************************************************************************
 * SubmitManager.handleRequestsFrom                                    */ /**
 *
 * Register the given question widget w/ this SubmitManager to handle any
 * submitScoreRequest events the widget may publish.
 * @export
 *
 * @param {Object}	questionWidget		-The question widget that may submit a
 * 										 request for an answer to an activity to
 * 										 be scored.
 *
 ****************************************************************************/
pearson.brix.SubmitManager.prototype.handleRequestsFrom = function(questionWidget)
{
	var that = this;
	this.eventManager.subscribe(questionWidget.submitScoreRequestEventId,
								function (eventDetails) {that.handleScoreRequest_(eventDetails);});
};

/* **************************************************************************
 * SubmitManager.handleScoreRequest_                                   */ /**
 *
 * The event handler of this SubmitManager for submitScoreRequest events
 * from registered question widgets.
 *
 * @param {Object}	eventDetails		-The details of the score request must include:
 * 										 questionId and answerKey. Optionally it may
 * 										 also include a responseCallback, and any other
 * 										 properties that responseCallback may need.
 * @private
 *
 ****************************************************************************/
pearson.brix.SubmitManager.prototype.handleScoreRequest_ = function(eventDetails)
{
	var pendingDetails =
		{
			sequenceNodeId: eventDetails['questionId'],
			answer: eventDetails['answerKey'],
			value: eventDetails['submissionValue'],
			responseCallback: eventDetails['responseCallback'],
			requestDetails: eventDetails,
		};

	if (this.requestsAwaitingResponse_[pendingDetails.sequenceNodeId] !== undefined)
	{
		alert("there's already an outstanding submission request for the sequenceNode: " + pendingDetails.sequenceNodeId);
	}

	this.requestsAwaitingResponse_[pendingDetails.sequenceNodeId] = pendingDetails;

	this.submitForScoring_(pendingDetails);
};

/* **************************************************************************
 * SubmitManager.submitForScoring_                                     */ /**
 *
 * Send the score request to the scoring engine using whatever means required
 * to access that scoring engine.
 *
 * @param {pearson.brix.SubmitManager.PendingDetails}
 * 							submitDetails	-Information identifying the question
 * 											 and answer to be scored, in the properties:
 * 											 sequenceNodeId and answer.
 * @private
 *
 * @note Currently this method is using a local scoring engine that returns
 * the response immediately. Eventually the scoring engine will be remote
 * and the response should be asynchronous, meaning that it will have to be
 * handled in a separate method probably an event handler of some sort. The
 * code here that deals w/ the current synchronous response will have to be
 * moved to this new method. -mjl
 *
 ****************************************************************************/
pearson.brix.SubmitManager.prototype.submitForScoring_ = function(submitDetails)
{
	// pass the submission on to the scoring engine. This will probably be
	// via the ActivityManager I'd think
	// todo: Although we're getting a synchronous response here, we should
	// enhance this to have the "answerMan" give us an asynchronous
	// response, probably via an eventManager event. -mjl
	var submissionResponse = this.answerMan.submitAnswer(submitDetails.sequenceNodeId,
										submitDetails.answer, submitDetails.value);

	// We handle the reply from the scoring engine (in the event handler eventually)
	// by removing the request from the list of pending request
	// and calling the given callback if it exists
	var pendingDetails = this.requestsAwaitingResponse_[submitDetails.sequenceNodeId];
	delete this.requestsAwaitingResponse_[submitDetails.sequenceNodeId];
	if (typeof pendingDetails.responseCallback === "function")
	{
		submissionResponse.submitDetails = pendingDetails.requestDetails;
		pendingDetails.responseCallback(submissionResponse);
	}
};

/* **************************************************************************
 * SubmitManager.appendResponseWithDefaultFormatting                   */ /**
 *
 * This is a temporary helper method to format the responses to submitted
 * answers.
 *
 * @note This function is attached to the SubmitManager just as a convenient
 * place for widgets to access it while the actual details of the response
 * are worked out. It might otherwise be a utility function or a static class
 * method on the base class of question widgets.
 * @export
 *
 * @param {!d3.selection}
 * 					container		-The html element to write the formatted
 * 									 response into.
 * @param {Object}	responseDetails	-The response details returned by the
 * 									 scoring engine.
 * 									 The details must contain the following
 * 									 properties:
 * 									 score, submission, response.
 *
 * @note It would be nice if the score property of the responseDetails was
 * changed from the possible values of -1, 0, 1 or undefined to either a
 * string (perhaps matching the responseFormat table below), or at least
 * a whole number that could be used as an index w/o manipulation. -mjl
 *
 ****************************************************************************/
pearson.brix.SubmitManager.appendResponseWithDefaultFormatting = function (container, responseDetails)
{
	var responseFormat = {
			correct: {
				icon: "icon-ok-sign",
				answerPrefix: 'Correct. "',
				answerSuffix:  '" is the right answer. ',
				responseClass: 'feedback-correct'
			},
			incorrect: {
				icon: "icon-remove",
				answerPrefix: 'Incorrect. "',
				answerSuffix:  '" is not the right answer.',
				responseClass: "feedback-incorrect"
			},
			partial: {
				icon: "icon-adjust",
				answerPrefix: 'Partial credit. "',
				answerSuffix:  '" is partially correct. ',
				responseClass: "feedback-partial"
			},
			unknown: {
				icon: "icon-adjust",
				answerPrefix: "something has gone horribly awry - we can't score this answer.",
				responseClass: ""
			}
		};

	var scoreAnsType = ["unknown", "incorrect", "correct", "partial"];

	var ansType = "unknown";
	if (typeof responseDetails.score === "number")
	{
		ansType = scoreAnsType[responseDetails.score + 1];
	}

	var responseHtml = "<i class='" + responseFormat[ansType].icon + "'></i> " +
				responseFormat[ansType].answerPrefix +
				(responseDetails.submission || "") +
				(responseFormat[ansType].answerSuffix || "") + " " +
				('<div class="custom-feedback">' + responseDetails.response + '</div>' || "");

	// display the results of the submission in the given container
	container.append("div")
		.attr('class', ['feedback', responseFormat[ansType].responseClass].join(" "))
		.html(responseHtml);
};

