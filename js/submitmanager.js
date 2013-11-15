/* **************************************************************************
 * $Workfile:: submitmanager.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of a SubmitManager object.
 *
 * The SubmitManager does some stuff.
 *
 * Created on       June 4, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.utils.SubmitManager');

goog.require('goog.debug.Logger');
goog.require('pearson.brix.utils.LocalAnswerMan');

/* **************************************************************************
 * SubmitManager                                                       */ /**
 *
 * Constructor function for the SubmitManager class
 *
 * @constructor
 *
 * @param {!pearson.utils.IEventManager}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 * @param {!pearson.brix.IAnswerMan=}
 *                      answerMan       -The correctness engine to process the selected answer.
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
pearson.brix.utils.SubmitManager = function (eventManager, answerMan)
{
    /**
     * A logger to help debugging
     * @type {goog.debug.Logger}
     * @private
     */
    this.logger_ = goog.debug.Logger.getLogger('pearson.brix.utils.SubmitManager');

    /**
     * The answerMan provides feedback to submissions 
     * @private
     * @type {!pearson.brix.utils.IAnswerMan}
     */
    this.answerMan_ = answerMan || new pearson.brix.utils.LocalAnswerMan();
    
    /**
     * The event manager to use to publish (and subscribe to) events
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager;

    /**
     * map of all submitted answers awaiting a response from
     * the scoring engine.
     * @type {Object.<pearson.brix.Ipc.SequenceNodeKey, pearson.brix.utils.SubmitManager.PendingDetails>}
     * @private
     */
    this.requestsAwaitingResponse_ = {};
};

/**
 * The PendingDetails is the information about an outstanding
 * request for an activity to be scored by the scoring engine.
 *
 * @typedef {Object} pearson.brix.utils.SubmitManager.PendingDetails
 * @property {pearson.brix.Ipc.SequenceNodeKey}
 *                              sequenceNodeKey -The PAF Activity Id which identifies the
 *                                               activity being scored.
 * @property {string}           answer          -The 'key' of the chosen answer to be scored.
 * @property {number|undefined} value           -If the answer selection is not from a discrete list
 *                                               this is the numeric value chosen.
 * @property {function(Object)} responseCallback
 *                                              -The function to call w/ the response from
 *                                               the scoring engine.
 * @property {Object}           requestDetails  -The details from the score
 *                                               request event from the question widget.
 */
pearson.brix.utils.SubmitManager.PendingDetails;

/* **************************************************************************
 * SubmitManager.handleRequestsFrom                                    */ /**
 *
 * Register the given question widget w/ this SubmitManager to handle any
 * submitScoreRequest events the widget may publish.
 * @export
 *
 * @param {Object}  questionWidget      -The question widget that may submit a
 *                                       request for an answer to an activity to
 *                                       be scored.
 *
 ****************************************************************************/
pearson.brix.utils.SubmitManager.prototype.handleRequestsFrom = function(questionWidget)
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
 * @param {Object}  eventDetails        -The details of the score request must include:
 *                                       questionId and answerKey. Optionally it may
 *                                       also include a responseCallback, and any other
 *                                       properties that responseCallback may need.
 * @private
 *
 ****************************************************************************/
pearson.brix.utils.SubmitManager.prototype.handleScoreRequest_ = function(eventDetails)
{
    var pendingDetails =
        {
            sequenceNodeKey: eventDetails['questionId'],
            answer: eventDetails['answerKey'],
            value: eventDetails['submissionValue'],
            responseCallback: eventDetails['responseCallback'],
            requestDetails: eventDetails,
        };

    if (this.requestsAwaitingResponse_[pendingDetails.sequenceNodeKey] !== undefined)
    {
        alert("there's already an outstanding submission request for the sequenceNode: " + pendingDetails.sequenceNodeId);
    }

    this.requestsAwaitingResponse_[pendingDetails.sequenceNodeKey] = pendingDetails;

    this.answerMan_.scoreAnswer(pendingDetails.sequenceNodeKey,
                                {key: pendingDetails.answer},
                                goog.bind(this.handleScoringResponse_, this, pendingDetails.sequenceNodeKey));
};

/* **************************************************************************
 * SubmitManager.handleScoringResponse_                                */ /**
 *
 * Send the score request to the scoring engine using whatever means required
 * to access that scoring engine.
 *
 * @param {pearson.brix.utils.SubmitManager.PendingDetails}
 *                          submitDetails   -Information identifying the question
 *                                           and answer to be scored, in the properties:
 *                                           sequenceNodeId and answer.
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
pearson.brix.utils.SubmitManager.prototype.handleScoringResponse_ = function (seqNodeKey, submissionResponse)
{
    // We handle the reply from the scoring engine (in the event handler eventually)
    // by removing the request from the list of pending request
    // and calling the given callback if it exists
    var pendingDetails = this.requestsAwaitingResponse_[seqNodeKey];
    delete this.requestsAwaitingResponse_[seqNodeKey];
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
 *                  container       -The html element to write the formatted
 *                                   response into.
 * @param {Object}  responseDetails -The response details returned by the
 *                                   scoring engine.
 *                                   The details must contain the following
 *                                   properties:
 *                                   score, submission, response.
 *
 * @note It would be nice if the score property of the responseDetails was
 * changed from the possible values of -1, 0, 1 or undefined to either a
 * string (perhaps matching the responseFormat table below), or at least
 * a whole number that could be used as an index w/o manipulation. -mjl
 *
 ****************************************************************************/
pearson.brix.utils.SubmitManager.appendResponseWithDefaultFormatting = function (container, responseDetails)
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
        .attr('class', responseFormat[ansType].responseClass)
        .html(responseHtml);
};

