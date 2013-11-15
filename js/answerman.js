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
 * @author          Young Suk Ahn
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


goog.provide('pearson.brix.utils.IpsAnswerMan');
goog.provide('pearson.brix.utils.IAnswerMan');

goog.require('goog.object');
goog.require('goog.debug.Logger');
goog.require('pearson.brix.utils.IpsProxy');

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
 * @param {pearson.brix.utils.IpsProxy}
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
     * A logger to help debugging
     * @type {goog.debug.Logger}
     * @private
     */
    this.logger_ = goog.debug.Logger.getLogger('pearson.brix.utils.IpsAnswerMan');

    /**
     * The IpsProxy used to communicate w/ the IPS
     * @private
     * @type {pearson.brix.utils.IpsProxy}
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
    // Currently the IPS correctness engine expects the key property to be named 'submission'
    var ipsStudentAnswer = {};
    goog.object.extend(ipsStudentAnswer, studentAnswer);
    ipsStudentAnswer['submission'] = ipsStudentAnswer['key'];
    delete ipsStudentAnswer['key'];

    var timestamp = (new Date()).toISOString();
    var param =
        {
            'sequenceNodeKey': seqNodeKey,
            'timestamp': timestamp,
            'type': 'submission',
            'body': { 'studentSubmission': ipsStudentAnswer }
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
    if (error)
    {
        this.logger_.warning('IpsProxy.postSubmission returned error: ' + JSON.stringify(error));
        // @todo - (ysa) Is this response enough, even for system errors such as no network? 
        // Also how do we handle last attempt and beyond?
        callback({ 'score': null, 'response': 'no response' });
    }
    else
    {
        // change the property names from the Ips response to those currently expected by
        // the brix.
        // @todo change the brix (and LocalAnswerMan) to expect the structure returned from the Ips -mjl
        // @todo - Handle result.data.attemptsMade, as well as the answer returned upon last attempt
        var scoreResponse =
            {
                'score': result.data['correctness'],
                'response': result.data['feedback'],
                'attemptsMade': result.data['attemptsMade'],
                'correctAnswer': result.data['correctAnswer']
            };

        this.logger_.fine('IpsProxy.postSubmission returned: ' + JSON.stringify(scoreResponse));
        callback(scoreResponse);
    }
};

