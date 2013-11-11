/* **************************************************************************
 * $Workfile:: widget-multiplechoicequestion.js                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the MultipleChoiceQuestion bric.
 *
 * The MultipleChoiceQuestion bric displays a question and a set of possible
 * answers one of which must be selected and submitted to be scored.
 *
 * Created on       May 29, 2013
 * @author          Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.MultipleChoiceQuestion');

goog.require('goog.debug.Logger');

goog.require('pearson.utils.IEventManager');
goog.require('pearson.utils.EventManager');
goog.require('pearson.brix.utils.SubmitManager');
goog.require('pearson.brix.BricWorks');
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

    // RadioButton bric config
    var rbConfig =
        {
            id: "RG1",
            choices: Q1Choices,
            numberFormat: "latin-upper"
        };

    // MultipleChoiceQuestion bric config
    var mcqConfig =
    {
        id: "Q1",
        questionId: "SanVan003",
        question: "Why?",
        choices: Q1Choices,
        order: "randomized", //default, even if not specified
        maxAttempts: 3,
        presenterType: "RadioGroup",
        presenterConfig: { numberFormat: "latin-upper" } // id and choices will be added by MultipleChoiceQuestion
    };
});

/**
 * Answers are presented to users by certain brix that allow the user to
 * select one (or more of them).
 *
 * @typedef {Object} pearson.brix.Answer
 * @property {string}   content     -The content of the answer, which presents the
 *                                   meaning of the answer.
 * @property {string}   answerKey   -This is the unique ID that will be returned
 *                                   to the scoring engine to identify that the
 *                                   user has chosen this answer.
 *
 * @todo: the content currently must be text (a string) however, we are likely
 * to want to make the content be any bric.
 */
pearson.brix.Answer;


/* **************************************************************************
 * MultipleChoiceQuestion                                              */ /**
 *
 * Constructor function for MultipleChoiceQuestion brix.
 *
 * @constructor
 * @extends {pearson.brix.HtmlBric}
 * @implements {pearson.brix.IQuestionBric}
 * @export
 *
 * @param {Object}      config          -The settings to configure this MultipleChoiceQuestion
 * @param {string|undefined}
 *                      config.id       -String to uniquely identify this MultipleChoiceQuestion.
 *                                       if undefined a unique id will be assigned.
 * @param {string}      config.questionId
 *                                      -Scoring engine Id of this question
 * @param {htmlString}  config.question -The question being posed to the user which should
 *                                       be answered by choosing one of the presented choices.
 * @param {!Array.<!pearson.brix.Answer>}
 *                      config.choices  -The list of choices (answers) to be presented
 *                                       by the MultipleChoiceQuestion.
 * @param {string=}     config.order    -The order in which the choices should be presented.
 *                                       either "randomized" or "ordered". Default is
 *                                       "randomized" if not specified.
 * @param {number=}     config.maxAttempts
 *                                      -The maximum number of submissions allowed attempting
 *                                       to answer correctly. Default is unlimited.
 * @param {pearson.brix.BrixTypes}
 *                      config.presenterType
 *                                      -The type of bric to use for presenting the choices.
 * @param {!Object}     config.presenterConfig
 *                                      -The configuration object for the specified presenter
 *                                       bric without the id or choices properties which
 *                                       will be added by this question constructor.
 * @param {!pearson.utils.IEventManager=}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 * @param {!pearson.brix.BricWorks=}
 *                      bricWorks       -The BricWorks to use to create the specified choice
 *                                       presentation bric. This is not really optional, but
 *                                       in order to keep all Bric constructors w/ the same
 *                                       signature, we need to annotate it as though it was.
 *
 * @classdesc
 * The MultipleChoiceQuestion bric displays a question and a set of possible
 * answers one of which must be selected and submitted to be scored.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion = function (config, eventManager, bricWorks)
{
    // call the base class constructor
    goog.base(this);

    /**
     * Logger for this Bric
     * @private
     * @type {goog.debug.Logger}
     */
    this.logger_ = goog.debug.Logger.getLogger('pearson.brix.MultipleChoiceQuestion');

    // Without a valid BricWorks we can't construct this MultipleChoiceBric
    if (!bricWorks)
    {
        var msg = 'MultipleChoiceQuestion requires a valid BricWorks to create the presenterType and Button brix that it uses';
        this.logger_.severe(msg);
        throw new Error(msg);
    }

    /**
     * A unique id for this instance of the multiple choice question bric
     * @private
     * @type {string}
     */
    this.mcqId_ = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.MultipleChoiceQuestion);

    /**
     * The scoring engine id of this question.
     * (e.g. the sequence node id)
     * @type {string}
     */
    this.questionId = config.questionId;

    /**
     * The question text.
     * @type {htmlString}
     */
    this.question = config.question;

    /**
     * The maximum number of submissions allowed attempting to get the correct
     * answer. Null means unlimited.
     * @type {?number}
     */
    this.maxAttempts_ = null;

    if (typeof config.maxAttempts === 'number' && config.maxAttempts >= 1)
    {
        this.maxAttempts_ = Math.round(config.maxAttempts);
    }

    /**
     * The number of attempts that have been made. Must be less than or equal to the
     * maximum number of attempts. Initially will be 0.
     * @type {number}
     */
    this.attemptsMade_ = 0;

    /**
     * The configuration options for the bric that will display the choices that
     * answer this question.
     * Add an id and adjust the choices according to the question type and add them
     * to the config.
     * @type {Object}
     */
    var presenterConfig = config.presenterConfig;

    presenterConfig.id = this.mcqId_ + "_prsntr";

    var choices = config.choices;
    if (config.order === undefined || config.order === "randomized")
    {
        // clone the array before we rearrange it so we don't modify the
        // array passed in the config.
        choices = choices.slice(0);
        pearson.utils.randomizeArray(choices);
    }

    presenterConfig.choices = choices;

    /**
     * The bric used to present the choices that may be selected to answer
     * this question.
     * @type {!pearson.brix.HtmlBric}
     */
    this.presenterBric = /**@type {!pearson.brix.HtmlBric}*/ (bricWorks.createBric(config.presenterType, presenterConfig));

    // The configuration options for the submit button
    var submitBtnConfig =
    {
        id: this.mcqId_ + "_sbmtBtn",
        text: "Select an answer",
        enabled: false
    };

    /**
     * The button bric which allows the answer to the question to be submitted
     * for scoring.
     * @type {!pearson.brix.Button}
     */
    this.submitButton = /**@type {!pearson.brix.Button}*/
                        (bricWorks.createBric(pearson.brix.BricTypes.BUTTON, submitBtnConfig));

    /**
     * List of responses that have been received for all submitted
     * scoring requests.
     * @type {Array.<Object>}
     */
    this.responses = [];

    /**
     * The event manager to use to publish (and subscribe to) events for this bric
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager || new pearson.utils.EventManager();

    /**
     * The event id published when a choice in this question is selected.
     * @const
     * @type {string}
     */
    this.selectedEventId = this.presenterBric.selectedEventId;

    /**
     * The event details for this.selectedEventId events
     * @typedef {Object} SelectedEventDetails
     * @property {string} selectKey -The answerKey associated with the selected answer.
     */
    var SelectedEventDetails;

    /**
     * The event id published when the submit button is clicked.
     * @const
     * @type {string}
     */
    this.submitScoreRequestEventId = pearson.brix.MultipleChoiceQuestion.getEventTopic('submitScoreRequest', this.mcqId_);

    /**
     * The event details for this.submitScoreRequestEventId events
     * @typedef {Object} SubmitAnswerRequest
     * @property {pearson.brix.IQuestionBric}
     *                              question    -This question bric
     * @property {string}           questionId  -The id which identifies this question to the scoring engine.
     * @property {string}           answerKey   -The answerKey associated with the selected answer.
     * @property {function(Object)} responseCallback
     *                                          -[optional] function to call with the response when it is
     *                                           returned by the scoring engine.
     */
    var SubmitAnswerRequest;

    // subscribe to events of our 'child' brix
    eventManager.subscribe(this.submitButton.pressedEventId, goog.bind(this.handleSubmitRequested_, this));

    /**
     * The answer selected handler given to the eventmanager and used
     * to subscribe and unsubscribe.
     * @type {Function}
     */
    this.answerSelectedHandler_ = goog.bind(this.handleAnswerSelected_, this);
    eventManager.subscribe(this.presenterBric.selectedEventId, this.answerSelectedHandler_);

    /**
     * Information about the last drawn instance of this bric (from the draw method)
     * @type {Object}
     */
    this.lastdrawn =
        {
            container: null,
            widgetGroup: null,
        };
}; // end of MultipleChoiceQuestion constructor
goog.inherits(pearson.brix.MultipleChoiceQuestion, pearson.brix.HtmlBric);

/**
 * Prefix to use when generating ids for instances of MultipleChoiceQuestion.
 * @const
 * @type {string}
 */
pearson.brix.MultipleChoiceQuestion.autoIdPrefix = "mcQ_auto_";

/* **************************************************************************
 * MultipleChoiceQuestion.getEventTopic (static)                       */ /**
 *
 * Get the topic that will be published for the specified event by a
 * MultipleChoiceQuestion bric with the specified id.
 * @export
 *
 * @param {string}  eventName       -The name of the event published by instances
 *                                   of this Bric.
 * @param {string}  instanceId      -The id of the Bric instance.
 *
 * @returns {string} The topic string for the given topic name published
 *                   by an instance of MultipleChoiceQuestion with the given
 *                   instanceId.
 *
 * @throws {Error} If the eventName is not published by this bric or the
 *                 topic cannot be determined for any other reason.
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.getEventTopic = function (eventName, instanceId)
{
    /**
     * Functions that return the topic of a published event given an id.
     * @type {Object.<string, function(string): string>}
     */
    var publishedEventTopics =
    {
        'selected': function (instanceId)
        {
            throw new Error("The requested event '" + eventName + "' can only be determined at runtime. The implementation of MultipleChoiceQuestion will need to be changed if this topic is required");
        },

        'submitScoreRequest': function (instanceId)
        {
            return instanceId + '_submitAnswerRequest';
        },
    };

    if (!(eventName in publishedEventTopics))
    {
        throw new Error("The requested event '" + eventName + "' is not published by MultipleChoiceQuestion brix");
    }

    return publishedEventTopics[eventName](instanceId);
};

/* **************************************************************************
 * MultipleChoiceQuestion.handleSubmitRequested_                       */ /**
 *
 * Handle the pressed event from the submit button which means that we want
 * to fire the submit answer requested event.
 * @private
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.handleSubmitRequested_ = function ()
{
    this.logger_.fine('MCQ: handling submit requested');

    var submitAnsDetails =
        {
            question: this,
            questionId: this.questionId,
            answerKey: this.presenterBric.selectedItem().answerKey,
            responseCallback: goog.bind(this.handleSubmitResponse_, this)
        };

    // Disable the submit button at least until we get a response to the score request
    this.submitButton.setEnabled(false);

    this.eventManager.publish(this.submitScoreRequestEventId, submitAnsDetails);
};

/* **************************************************************************
 * MultipleChoiceQuestion.handleAnswerSelected_                        */ /**
 *
 * Handle the selected event from the choice widget which means that the
 * submit button can be enabled.
 * @private
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.handleAnswerSelected_ = function ()
{
    this.logger_.fine('MCQ: handling answer selected');

    this.submitButton.setText('Submit');
    this.submitButton.setEnabled(true);

    // unsubscribe because we don't want subsequent answer selections
    // to enable the submit button if we've deliberately disabled it.
    this.eventManager.unsubscribe(this.presenterBric.selectedEventId, this.answerSelectedHandler_);
};

/* **************************************************************************
 * MultipleChoiceQuestion.handleSubmitResponse_                        */ /**
 *
 * Handle the response to submitting an answer.
 *
 * @param {Object}  responseDetails -An object containing details about how
 *                                   the submitted answer was scored.
 * @private
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.handleSubmitResponse_ = function (responseDetails)
{
    this.logger_.fine('MCQ: handling submit response');

    this.responses.push(responseDetails);

    var responseDiv = this.lastdrawn.widgetGroup.select('div.feedback');

    // this removes any previous feedback and only shows student the most recent
    var prevFeedback = this.lastdrawn.widgetGroup.selectAll('div.feedback > *');
    prevFeedback.remove();

    // Update attempts remaining from the value in the response
    this.updateAttemptsMade_(responseDetails.attemptsMade);

    // For now just use the helper function to write the response
    responseDetails.submission = this.presenterBric.selectedItem().content;
    pearson.brix.utils.SubmitManager.appendResponseWithDefaultFormatting(responseDiv, responseDetails);

    if ('correctAnswer' in responseDetails)
    {
        var correctAnswer = responseDetails['correctAnswer'];
        var correctChoiceIndex = this.presenterBric.itemKeyToIndex(correctAnswer['key']);
        var correctChoice = this.presenterBric.choices[correctChoiceIndex];
        correctAnswer.submission = correctChoice(correctChoiceIndex).content;
        pearson.brix.utils.SubmitManager.appendResponseWithDefaultFormatting(responseDiv, correctAnswer);
    }

    // Re-enable the submit button if the answer was incorrect and there are attempts remaining
    if (!this.correctlyAnswered() &&
        this.maxAttempts_ !== null && this.attemptsMade_ < this.maxAttempts_)
    {
        this.submitButton.setEnabled(true);
    }
};

/* **************************************************************************
 * MultipleChoiceQuestion.correctlyAnswered                            */ /**
 *
 * Determine if the last submitted answer was the correct answer.
 *
 * @returns {boolean} true if the last submitted answer was the correct answer.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.correctlyAnswered = function ()
{
    if (this.responses.length === 0 ||
        this.responses[this.responses.length - 1].score !== 1)
    {
        return false;
    }

    return true;
};

/* **************************************************************************
 * MultipleChoiceQuestion.getId                                        */ /**
 *
 * @inheritDoc
 * @export
 * @description The following is here until jsdoc supports the inheritDoc tag.
 * Returns the ID of this bric.
 *
 * @returns {string} The ID of this Bric.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.getId = function ()
{
    return this.mcqId_;
};

/* **************************************************************************
 * MultipleChoiceQuestion.draw                                         */ /**
 *
 * @inheritDoc
 * @export
 * @description The following is here until jsdoc supports the inheritDoc tag.
 * Draw this MultipleChoiceQuestion in the given container.
 *
 * @param {!d3.selection}   container   -The container html element to append
 *                                       this HtmlBric element tree to.
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.draw = function (container)
{
    this.lastdrawn.container = container;

    // make a div to hold the multiple choice question
    var widgetGroup = container.append("div")
        .attr("class", "brixMultipleChoiceQuestion");

    // use a fieldset (although w/o a form) to group the question and choices
    var qCntr = widgetGroup.append('fieldset');

    var question = qCntr.append('legend')
        .attr("class", "question")
        .html(this.question);

    var presenterBricCntr = qCntr.append("div")
        .attr("class", "choices");

    // draw the choices
    this.presenterBric.draw(presenterBricCntr);

    // We need a block container for the submit button and the attempts
    var submitAndAttemptsCntr  = widgetGroup.append('div');

    // draw the submit button below
    var submitButtonCntr = submitAndAttemptsCntr.append('div')
        .attr('class', 'submit')
        .style('display', 'inline-block');

    this.submitButton.draw(submitButtonCntr);

    var attemptsCntr = submitAndAttemptsCntr.append('span')
        .attr('class', 'attempts');

    // make a target for feedback when the question is answered
    widgetGroup.append('div')
        .attr('class', 'feedback');

    this.lastdrawn.widgetGroup = widgetGroup;

    this.drawAttempts_(attemptsCntr);

}; // end of MultipleChoiceQuestion.draw()

/* **************************************************************************
 * MultipleChoiceQuestion.drawAttempts_                                */ /**
 *
 * [Description of drawAttempts_]
 *
 * @param {Object}  cntr        -[Description of cntr]
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.drawAttempts_ = function (cntr)
{
    var count = cntr.append('span').attr('class', 'count');
    cntr.append('span').text(' ');
    var cntDescr = cntr.append('span').attr('class', 'descr');

    this.redrawAttempts_();
};

/* **************************************************************************
 * MultipleChoiceQuestion.redrawAttempts_                              */ /**
 *
 * [Description of redrawAttempts_]
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.redrawAttempts_ = function ()
{
    var count = this.lastdrawn.widgetGroup.select('span.attempts span.count');
    var cntDescr = this.lastdrawn.widgetGroup.select('span.attempts span.descr');

    if (this.maxAttempts_ === null)
    {
        count.text('');
        cntDescr.text('');
    }
    else
    {
        count.text(this.maxAttempts_ - this.attemptsMade_);
        cntDescr.text('remaining attempts');
    }
};

/* **************************************************************************
 * MultipleChoiceQuestion.updateAttemptsMade_                          */ /**
 *
 * Update the attemptsMade property w/ the new value, and update
 * where it presented to the user.
 *
 * @param {number}  attemptsMade    -The number of attempts that have been
 *                                   submitted so far.
 *                                   Must be a whole integer.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.updateAttemptsMade_ = function (attemptsMade)
{
    this.attemptsMade_ = attemptsMade;

    // attempts used may not exceed the max attempts
    if (this.maxAttempts_ !== null && this.maxAttempts_ < attemptsMade)
    {
        this.attemptsMade_ = this.maxAttempts_;
    }

    this.redrawAttempts_();
};

/* **************************************************************************
 * MultipleChoiceQuestion.selectedItem                                 */ /**
 *
 * Return the selected choice from the choice widget or null if nothing has been
 * selected.
 * @export
 *
 * @return {Object} the choice which is currently selected or null.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.selectedItem = function ()
{
    return this.presenterBric.selectedItem();
};

/* **************************************************************************
 * MultipleChoiceQuestion.selectItemAtIndex                            */ /**
 *
 * Select the choice in the choice widget at the given index. If the choice is
 * already selected, do nothing. The index is the displayed choice index and
 * not the config choice index (in other words if the choices have been randomized
 * then the configuration index is NOT the displayed index).
 * @export
 *
 * @param {number}  index   -the 0-based index of the choice to mark as selected.
 *
 ****************************************************************************/
pearson.brix.MultipleChoiceQuestion.prototype.selectItemAtIndex = function (index)
{
    this.presenterBric.selectItemAtIndex(index);
};

