/* **************************************************************************
 * $Workfile:: answerprovider-poll.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of a AnswerProvider for Poll.
 *               
 * The AnswerProvider is direct replacement of AnsManager, but instead of
 * function, it is a class extending the BricBase class.
 *
 * Created on		July 9, 2013
 * @author			Young-Suk Ahn Park
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.AnswerManPolling');


/* **************************************************************************
 * AnswerMan                                                              */ /**
 *
 * The AnswerMan widget creates a clickable html button that publishes events.
 *
 * @constructor
 * @export
 *
 **************************************************************************/
pearson.brix.AnswerManPolling = function()
{

}

/* **************************************************************************
 * AnswerMan.submitAnswer                                              */ /**
 *
 * Mock scoring engine.
 * @export
 *
 * @param {string} 		sequenceNode	-The sequence node id of the activity being scored.
 * @param {string} 		studAnswerKey		-The student's answer key.
 * @param {string} 		studAnswerValue		-The student's answer value.
 *
 * @return {object} - The object literal 
 * 			{submission:<the studAnswerKey>,
 *			feedback: <what will be displayed back to the student>,
 *			score: <the numeric score>}
 ****************************************************************************/
pearson.brix.AnswerManPolling.prototype.submitAnswer = function(sequenceNode, studAnswerKey, studAnswerValue) 
{
	if (studAnswerKey in this.statData) {
		this.statData[studAnswerKey] = this.statData[studAnswerKey] + 1;
	} else {
		this.statData[studAnswerKey] = 1;		
	}

	var responseHtml = "<div class='alert alert-success'><i class='icon-ok-sign'></i> " +
		"OK " + studAnswerKey + " selected " + this.statData[studAnswerKey] + " times. </div>";

	var scored = {
				// YSAP - No references 
				//container: config.container,
				submission: studAnswerKey,
				feedback: responseHtml
				};
	return scored;
}

pearson.brix.AnswerManPolling.prototype.statData = {};
