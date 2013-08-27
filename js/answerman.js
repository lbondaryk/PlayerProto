/* **************************************************************************
 * $Workfile:: answerman.js                                                 $
 * *********************************************************************/ /**
 *
 * @fileoverview Client-side answer evaluation engine object.
 *
 * The AnswerMan engine does simple comparisons between its record of an item's
 * data and whether the submitted answer is correct or not.
 *
 * Created on		June 17, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.AnswerMan');
goog.require('pearson.brix.test');

// YSAP - Changed from function to class with method.
// Proposal: change from AnswerMan to EvalProvider

/* **************************************************************************
 * AnswerMan                                                              */ /**
 *
 * The AnswerMan widget creates a clickable html button that publishes events.
 *
 * @constructor
 * @export
 *
 **************************************************************************/
pearson.brix.AnswerMan = function()
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
 ****************************************************************************/
pearson.brix.AnswerMan.prototype.submitAnswer = function (sequenceNode, studAnswerKey, studAnswerValue)
{ 
	 
	//lookup the student answer in the answer key in fakeactivitydb.js, which
	//got loaded with the page
	var activities = pearson.brix.test.activities;
	var activity = (sequenceNode in activities) ? activities[sequenceNode] : "activity not found";
	var solution = (studAnswerKey in activity) ? activity[studAnswerKey] : "solution key not found";

	// stash the answer score and response in some variables
	//var ansKey = ('score' in solution) ? activity.score : "answer key not found";
	
	// what follows is an unbelievably bogus implementation of numerical answer
	// scoring.  There is only one answer key for numerical problems, and it always
	// returns correct.  The numerical right answer is stored in the correctValue key.
	// This can only be absolutely compared with the submitted value.  If they match,
	// you get one, otherwise, 0, and the content (used in the response generator),
	// is set to the value the student submitted.
	
	var feedback = solution.response;
	if (studAnswerValue)
		{
		ansKey = studAnswerValue != solution.correctValue ? 0 : 1;
		solution.content = studAnswerValue;
		}
	else
		{
			var ansKey = solution.score;
		}
	
	//initialized the scored return object.  We'll need to know it's container
	//(specifies where to write the responses), the value of the student submission,
	//the score, and any specialized response.
	var scored = {
				submission: solution.content,
				response: feedback
				};
				
	//then we switch on the lookup right or wrong response.  This is hard-coded
	//to student answer now, but needs to come from the lookup vs. the student 
	//response.  Should be either 0 for wrong, 1 for right, or anything else for
	//partial credit for the fallthrough case.
				
	//note that the current implementation of the submitmanager uses the score
	//as an array index, and so these must be integers.  Not sure if we'll want
	//to keep doing that in the long term, but eventually we'll need some kind of 
	//sliding scale functionality that allows some answers to be more correct
	//and some less -lb
	switch(ansKey)
		{
		case 1:
  		// You got it right, hooray!
			scored.score = 1;
 			break;
			
		case 0:
		// You're always WRONG!  HAHAHHAHAHA.
			scored.score = 0;
  			break;
			
		case undefined: 
			scored.score = -1;
			break;
			
		//fallthrough case for partially correct answers.
		default:
  			scored.score = 2;
			//scored.response =" Sorta kinda.";
  			break;
		}
	
	//the return the scored object to the submitting page.
	return scored;
	
} //end answerMan function
