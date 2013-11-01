/* **************************************************************************
 * $Workfile:: answerman.js                                                 $
 * *********************************************************************/ /**
 *
 * @fileoverview Client-side answer evaluation engine object.
 *
 * The AnswerMan engine does simple comparisons between its record of an item's
 * data and whether the submitted answer is correct or not.
 *
 * Created on       June 17, 2013
 * @author          Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.utils.LocalAnswerMan');

// YSAP - Changed from function to class with method.
// Proposal: change from AnswerMan to EvalProvider

/**
 * The common answerKey structure for all question types, they vary in the
 * contents of the answers property.
 *
 * @typedef {Object} pearson.brix.utils.AnswerKey
 * @property {string}   assessmentType  -The type of assessment (question)
 *                                       this is an answer key for.
 * @property {!Object}  answers         -The information needed to determine
 *                                       correctness and feedback for any
 *                                       answer of this particular question.
 */
pearson.brix.utils.AnswerKey;

/* **************************************************************************
 * IAnswerMan                                                          */ /**
 *
 * Interface for classes that provide a scoreAnswer method that evaluates
 * a student's answer and returns feedback about it.
 * @interface
 ****************************************************************************/
pearson.brix.utils.IAnswerMan = function () {};

/* **************************************************************************
 * IAnswerMan.scoreAnswer                                              */ /**
 *
 * Score (determine the correctness) of a student's answer to a question and
 * return feedback.
 *
 * @param {string}  seqNodeKey      -The sequence node key that identifies the question
 *                                   being scored.
 * @param {Object}  studentAnswer   -The student's answer to the question.
 * @param {function(pearson.brix.utils.ScoreResponse)}
 *                  callback        -Callback function to be invoked w/ the
 *                                   correctness feedback from scoring the given
 *                                   answer.
 ****************************************************************************/
pearson.brix.utils.IAnswerMan.prototype.scoreAnswer = function (seqNodeKey, studentAnswer, callback) {};


/* **************************************************************************
 * IpsAnswerMan                                                        */ /**
 *
 * The IpsAnswerMan constructor.
 *
 * @constructor
 * @implements {pearson.brix.utils.IAnswerMan}
 *
 * @param {!pearson.brix.utils.IpsProxy}
 *                          ipsProxy   -The IpsProxy that will be used to
 *                                      communicate w/ the IPS.
 *
 * @classdesc
 * The IpsAnswerMan is a correctness engine which sends the student's answer
 * to the IPS to be scored.
 *
 **************************************************************************/
pearson.brix.utils.IpsAnswerMan = function (ipsProxy)
{
    /**
     * The IpsProxy used to communicate w/ the IPS
     * @private
     * @type {!pearson.brix.utils.IpsProxy}
     */
    this.ipsProxy_ = ipsProxy;
};

/* **************************************************************************
 * IpsAnswerMan.scoreAnswer                                            */ /**
 *
 * Score (determine the correctness) of a student's answer to a question and
 * return feedback.
 *
 * @param {string}  seqNodeKey      -The sequence node key that identifies the question
 *                                   being scored.
 * @param {Object}  studentAnswer   -The student's answer to the question.
 * @param {function(pearson.brix.utils.ScoreResponse)}
 *                  callback        -Callback function to be invoked w/ the
 *                                   correctness feedback from scoring the given
 *                                   answer.
 ****************************************************************************/
pearson.brix.utils.IpsAnswerMan.prototype.scoreAnswer = function (seqNodeKey, studentAnswer, callback)
{
    var param =
        {
            'sequenceNodeKey': seqNodeKey,
            'timestamp': "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            'type': 'submission',
            'body': { 'studentSubmission': studentAnswer }
        };

    var ipsRespHandler = goog.bind(this.ipsSubmissionResponseHandler, this, seqNodeKey, callback);
    this.ipsProxy_.postSubmission(param, ipsRespHandler);
};

/* **************************************************************************
 * IpsAnswerMan.ipsSubmissionResponseHandler                           */ /**
 *
 * [Description of ipsSubmissionResponseHandler]
 *
 * @param {string}  seqNodeKey  -The sequence node key that identifies the question
 *                               being scored.
 * @param {function(pearson.brix.utils.ScoreResponse)}
 *                  callback    -Callback function to be invoked w/ the
 *                               correctness feedback from scoring the given answer.
 * @param {*}       error       -[Description of error]
 * @param {*}       result      -[Description of result]
 *
 ****************************************************************************/
pearson.brix.utils.IpsAnswerMan.prototype.ipsSubmissionResponseHandler = function (seqNodeKey, callback, error, result)
{
    if (result)
    {
        callback({'score': result['score'], 'response': result['response'] });
    }
    else
    {
        callback({'score': null, 'response': 'no response' });
    }
};


/* **************************************************************************
 * LocalAnswerMan                                                      */ /**
 *
 * The LocalAnswerMan is a correctness engine which uses a local database of
 * answer keys to determine if a given answer is correct.
 *
 * @constructor
 * @implements {pearson.brix.utils.IAnswerMan}
 *
 **************************************************************************/
pearson.brix.utils.LocalAnswerMan = function ()
{
    /**
     * Database of registered answer keys, indexed by sequenceNodeKey
     * @private
     * @type {Object.<string, !pearson.brix.utils.AnswerKey>}
     */
    this.answerKeyDB_ = {};
};

/* **************************************************************************
 * LocalAnswerMan.registerAnswerKey                                    */ /**
 *
 * Register the answer key to use for a particular question (assessment)
 * identified by the given seqNodeKey that will be used to evaluate the
 * correctness and determine the feedback for any particular answer to
 * the question when it is scored.
 *
 * @param {string}  seqNodeKey  -The sequence node key that identifies the question
 *                               being scored.
 * @param {!pearson.brix.utils.AnswerKey}
 *                  answerKey   -The answer key for the question (assessment)
 *                               identified by the given seqNodeKey, that will
 *                               be used to evaluate any particular answer to
 *                               the question.
 *
 ****************************************************************************/
pearson.brix.utils.LocalAnswerMan.prototype.registerAnswerKey = function (seqNodeKey, answerKey)
{
    this.answerKeyDB_[seqNodeKey] = answerKey;
};

/* **************************************************************************
 * LocalAnswerMan.scoreAnswer                                          */ /**
 *
 * Score (determine the correctness) of a student's answer to a question and
 * return feedback.
 *
 * @param {string}  seqNodeKey      -The sequence node key that identifies the question
 *                                   being scored.
 * @param {Object}  studentAnswer   -The student's answer to the question.
 * @param {function(pearson.brix.utils.ScoreResponse)}
 *                  callback        -Callback function to be invoked w/ the
 *                                   correctness feedback from scoring the given
 *                                   answer.
 ****************************************************************************/
pearson.brix.utils.LocalAnswerMan.prototype.scoreAnswer = function (seqNodeKey, studentAnswer, callback)
{
    // Make sure we have an answer key for the seqNodeKey
    if (!(seqNodeKey in this.answerKeyDB_))
    {
        throw Error("The answer key for '" + seqNodeKey + "' has not been registered, so it cannot be scored.");
    }

    var answerKey = this.answerKeyDB_[seqNodeKey];
    var assessmentType = answerKey['assessmentType'];

    // Make sure we've got an evaluator for the question type
    if (!(assessmentType in pearson.brix.utils.LocalAnswerMan.evaluateAnswer))
    {
        throw Error("There is no evaluator for an assessment type of '" + assessmentType);
    }

    var evaluator = pearson.brix.utils.LocalAnswerMan.evaluateAnswer[assessmentType];

    callback(evaluator(studentAnswer, answerKey['answers']));
};


/**
 * The types of questions.
 * @enum {string}
 */
pearson.brix.utils.QuestionTypes =
{
    MULTIPLECHOICE: "multiplechoice",
    MULTISELECT:    "multiselect",
    NUMERIC:        "numeric"
};

/**
 * The ScoreResponse is the object returned describing the result of
 * evaluating the answer choice to a question.
 *
 * @typedef {Object} pearson.brix.utils.ScoreResponse
 * @property {number}   score       -Description of score
 * @property {string}   response    -Description of response
 */
pearson.brix.utils.ScoreResponse;

/**
 * Functions to evaluate the various types of answers.
 * @type {Object.<pearson.brix.utils.QuestionTypes, function(Object, !pearson.brix.utils.AnswerKey):pearson.brix.utils.ScoreResponse>}
 */
pearson.brix.utils.LocalAnswerMan.evaluateAnswer =
{
    /* **************************************************************************
     * evaluateAnswer.multiplechoice                                       */ /**
     *
     * Function which evaluates the answer to a multiple choice question.
     *
     * @param {Object}  answer      -the multiple choice answer submitted by the
     *                               student to be evaluated.
     * @param {string}  answer.key  -the key of the choice selected by the student.
     * @param {!pearson.brix.utils.AnswerKey}
     *                  questionSolution
     *                              -the object which describes the question and
     *                               its solution. For a multiple choice question
     *                               it contains a property for each choice which
     *                               specifies the result for selecting that choice.
     *
     * @returns {pearson.brix.utils.ScoreResponse}
     *
     ****************************************************************************/
    'multiplechoice': function(answer, questionSolution)
    {
        var chosenKey = answer['key'];

        if (chosenKey in questionSolution)
        {
            var solution = questionSolution[chosenKey];
            return { "score": solution['score'], "response": solution['response'] };
        }

        return { "score": null, "response": 'Something went awry, your answer was unexpected.' };
    },

    /* **************************************************************************
     * evaluateAnswer.numeric                                              */ /**
     *
     * Function which evaluates the answer to a numeric question.
     *
     * @param {Object}  answer          -the numeric answer submitted by the
     *                                   student to be evaluated.
     * @param {string}  answer.value    -the numeric answer entered by the student.
     * @param {!pearson.brix.utils.AnswerKey}
     *                  questionSolution
     *                                  -the object which describes the question and
     *                                   its solution. For a numeric question
     *                                   it contains the correct numeric answer as
     *                                   well as an acceptable error by which the
     *                                   student's answer may vary from the correct answer
     *                                   and still be considered correct.
     *                                   It also contains a response for a correct answer
     *                                   and for an incorrect answer.
     *
     * @returns {pearson.brix.utils.ScoreResponse}
     *
     ****************************************************************************/
    'numeric': function(answer, questionSolution)
    {
        // assert that answer.type === "numeric"

        // Assume answer is incorrect
        var result = { "score": 0,
                       "submission": "your answer: " + answer.value + ",",
                       "response": questionSolution['incorrectResponse'] };

        var correctValue = questionSolution['correctValue'];
        var acceptableError = questionSolution['acceptableError'];

        // if answer is correct, update result to reflect that
        if (answer.value >= correctValue - acceptableError &&
            answer.value <= correctValue + acceptableError)
        {
            result.score = 1;
            result.score = questionSolution['correctResponse'];
        }

        return result;
    },

    /* **************************************************************************
     * evaluateAnswer.multiselect                                          */ /**
     *
     * Function which evaluates the answer to a numeric question.
     *
     * @param {Object}  answer          -the multiple choices selected by the
     *                                   student to be evaluated.
     * @param {!Array.<string>}
     *                  answer.keys     -list of keys of the choices selected by
     *                                   the student.
     * @param {!pearson.brix.utils.AnswerKey}
     *                  questionSolution
     *                                  -the object which describes the question and
     *                                   its solution. For a multiselect question
     *                                   it contains SOMETHING that hasn't been defined
     *                                   yet, but should be similar to the solutions
     *                                   of other question types. -mjl
     *
     * @returns {pearson.brix.utils.ScoreResponse}
     *
     ****************************************************************************/
    'multiselect': function(answer, questionSolution)
    {
        // assert that answer.type === "multiselect"

        // Assume answer is incorrect
        var result = { "score": 0,
                       "submission": "your answer: " + answer.value + ",",
                       "response": questionSolution['incorrectResponse'] };

        // if answer is correct, update result to reflect that
        // Don't know how to do that yet as the solution structure hasn't been defined.

        return result;
    },
};
