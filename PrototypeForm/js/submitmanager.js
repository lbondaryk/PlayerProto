/* **************************************************************************
 * $Workfile:: submitmanager.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of a SubmitManager object.
 *
 * The SubmitManager does some stuff.
 *
 * Created on		June 04, 2013
 * @author			Seann
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

/* **************************************************************************
 * Page variables
 ****************************************************************************/

// Sample SubmitManager constructor configuration
// NA - information about the container to return to and the question ID is
// passed from the question type, e.g. multiple choice. No config.

/* **************************************************************************
 * SubmitManager                                                       */ /**
 *
 * Constructor function for the SubmitManager class
 *
 * @constructor
 *
 * @param {!EventManager}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 * @param {Function}
 * 						answerProvider	-The answer providing function.
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
function SubmitManager(eventManager, answerProvider)
{
	/**
	 * YSAP - The answer provider is an object.
	 * The answer provider
	 */
	this.answerProvider = answerProvider;

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * map of all submitted answers awaiting a response from
	 * the scoring engine.
	 * @type {Object.<SequenceNodeId, PendingDetails>}
	 * @private
	 */
	this.requestsAwaitingResponse_ = {};

	/**
	 * The PAF Activity ID used by the scoring engine to identify
	 * the particular activity (question) being scored.
	 *
	 * @typedef {string} SequenceNodeId
	 */
	
	/**
	 * The PendingDetails is the information about an outstanding
	 * request for an activity to be scored by the scoring engine.
	 *
	 * @typedef {Object} PendingDetails
	 * @property {SequenceNodeId}	sequenceNodeId	-The PAF Activity Id which identifies the
	 * 												 activity being scored.
	 * @property {string}			answer			-The chosen answer to be scored.
	 * @property {function(Object)}	responseCallback
	 * 												-The function to call w/ the response from
	 * 												 the scoring engine.
	 * @property {Object}			requestDetails	-The details from the score
	 * 												 request event from the question widget.
	 */
}

/* **************************************************************************
 * SubmitManager.handleRequestsFrom                                    */ /**
 *
 * Register the given question widget w/ this SubmitManager to handle any
 * submitScoreRequest events the widget may publish.
 *
 * @param {Object}	questionWidget		-The question widget that may submit a
 * 										 request for an answer to an activity to
 * 										 be scored.
 *
 ****************************************************************************/
SubmitManager.prototype.handleRequestsFrom = function(questionWidget)
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
SubmitManager.prototype.handleScoreRequest_ = function(eventDetails)
{
	var pendingDetails =
		{
			sequenceNodeId: eventDetails.questionId,
			answer: eventDetails.answerKey,
			value: eventDetails.submissionValue,
			responseCallback: eventDetails.responseCallback,
			requestDetails: eventDetails,
		};

	if (this.requestsAwaitingResponse_[eventDetails.questionId] !== undefined)
	{
		alert("there's already an outstanding submission request for the sequenceNode: " + eventDetails.questionId);
	}

	this.requestsAwaitingResponse_[eventDetails.questionId] = pendingDetails;

	this.submitForScoring_(pendingDetails);
};

/* **************************************************************************
 * SubmitManager.submitForScoring_                                     */ /**
 *
 * Send the score request to the scoring engine using whatever means required
 * to access that scoring engine.
 *
 * @param {PendingDetails}	submitDetails	-Information identifying the question
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
SubmitManager.prototype.submitForScoring_ = function(submitDetails)
{
	// pass the submission on to the scoring engine. This will probably be
	// via the ActivityManager I'd think
	// todo: Although we're getting a synchronous response here, we should
	// enhance this to have the "answerMan" give us an asynchronous
	// response, probably via an eventManager event. -mjl
	var submissionResponse = this.answerProvider.submitAnswer(submitDetails.sequenceNodeId,
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

	// YSAP - @todo replace above callback with message passing as below
	//this.eventManager.publish(this.submittedEventId, submissionResponse);

};

/* **************************************************************************
 * SubmitManager.submit                                                */ /**
 *
 * Submit the student's submission to the answer engine.  Publish the result.
 *
 * CURRENT FAKEY STUB...  We send the submission to the answerman()
 * function in which we can put whatever fakery we want for the short term.
 *
 * IN THE FUTURE...  We likely end up passing the submission to the 
 * Activity Manager which will know where the answer engine is, either 
 * a server-side thing (The Player Backend), a client-side thing (probably also
 * related to the Player), or the PAF Hub.
 *
 * @param {string}	submission	-The student's submission
 *
 ****************************************************************************/
SubmitManager.prototype.submit = function (submission)
{
	// pass the submission on to the answer engine.  This will probably be
	// via the ActivityManager I'd think
	var submissionResponse = answerMan(
			{	sequenceNode: this.sequenceNodeID,
				container: this.container,
			}, submission);

	// publish the result of the submission
	this.eventManager.publish(this.submittedEventId, submissionResponse);
};


/* **************************************************************************
 * fancyAnswerEngine                                                   */ /**
 *
 * I'm just a stub
 * Yes, I'm only a stub
 * And I'm sitting here on ...
 *
 * If we want to make this more useful, but still fakey, we could extract this
 * into another included javascript file, pretend it's some passthru in the
 * ActivityManager that shunts the submission (and the whole SequenceNode, 
 * which it would get from the sequenceNodeID we have) off to the real Answer Engine,
 * and hardcode some answer enginey stuff in there based on sequenceNodeID.
 *
 * @param {string}	submission	-The student's submission
 *
 ****************************************************************************/
fancyAnswerEngine = function (sequenceNodeID, submission)
{
	// You're always WRONG!  HAHAHHAHAHA.
	var submissionResponse = {
		grade: 0,
		response: "Sorry, try again."
	};
	return submissionResponse;
};
