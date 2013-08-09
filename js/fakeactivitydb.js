/* **************************************************************************
 * $Workfile:: widget-multiplechoicequestion.js                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Defines a fake database used by the mock scoring engine.
 *
 * If it had been possible to read a local JSON file, this would not define
 * a global variable, the scoring engine would have processed a strict
 * JSON file.
 *
 * Created on		June 18, 2013
 * @author			Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
// JSON FakeActiviyDB Document
/**
 * activities is a global object used as a scoring database.
 * It is an object whose keys are the sequenceNodeId's that identify
 * the activity being scored, and the value contains properties used by
 * the mock scoring engine {@link answerMan}.
 * @type {Object}
 * */
var activities = {		
	"louder": { 
		question: "How high does it go?",
		"001": {
				correctValue: 11,
				score: 1,
				response: "It's one louder."
				},
		},

	"lowMonth": { 
		question: "In what month is the CO2 concentration usually the lowest?",
		answer000: {
				content: "August",
				score: 1,
				response: "When plants are in leaf and performing photosynthesis, CO<sub>2</sub> drops."
				},
		answer001: {
				content: "May",
				score: 0,
				response:  "You're looking for the lowest concentration, which will occur at the end of the vegitation growth season.",
				},
		answer002: {
				content: "January",
				score: 0,
				response:  "The concentration has little to do with the calendar.",
				},
		answer003: {
				content: "June-July",
				score: 0,
				response:  "You are close, but read the graph more carefully.",
				}
		},

	"highMonth": { 
		question: "In what month is the CO2 concentration usually the highest?",
		answer000: {
				content: "August",
				score: 0,
				response: "When plants are in leaf and performing photosynthesis, CO<sub>2</sub> drops."
				},
		answer001: {
				content: "May",
				score: 1,
				response:  "When plants are just starting their growth season, CO<sub>2</sub> is elevated.",
				},
		answer002: {
				content: "January",
				score: 0,
				response:  "The concentration has little to do with the calendar.",
				},
		answer003: {
				content: "June-July",
				score: 0,
				response:  "You are close, but read the graph more carefully.",
				}
		},



	"SanVan001": { 
		question: "Why does it take less and less time to add each additional billion people to the planet?",
		answer000: {
				content: "Because as the population increases, the absolute number of births increases even though the growth rate stays constant.",
				score: 1,
				response: "Growth rate stays constant."
				},
		answer001: {
				content: "Because the growth rate increases as the population rises.",
				score: 0,
				response:  "Does the growth rate change with population size?",
				},
		answer002: {
				content: "Because the total fertility rate increases with population.",
				score: 0,
				response:  "This might happen, but is it necessarily true?",
				},
		answer003: {
				content: "Because social behaviors change and people decide to have more children.",
				score: 0,
				response:  "This might happen, but is it necessarily true?",
				}
		},
		
	SanVan002: { 
		question: "If a tree falls in the forest, and no one is there to hear it, does it make a sound?",
		answer000: {
				content: "True",
				score: 1,
				response: "Very practical."
				},
		answer001: {
				content: "False",
				score: 0,
				response:  "Philosophically interesting, but not strictly true.",
				}
		},
		
	SanVan003: { 
		question: "It's important to rock. Set the volume to the appropriate level using the slider below.",
		answer000: {
				content: "0",
				score: 0,
				response: "That's no way to rock."
				},
		answer011: {
				content: "11",
				score: 1,
				response:  "It's one louder.",
				}
		},

	"SanVan004": { 
		question: "How do you *know* she's a witch?",
		"newt": {
				content: "Because she turned me into a newt.",
				score: 0,
				response: "You're not a newt now."
				},
		"nose": {
				content: "Because she has a long nose.",
				score: 0,
				response:  "Do not judge a witch by the length of their nose!",
				},
		"floats": {
				content: "Because she floats on water.",
				score: 1,
				response:  "Witches are lighter than water.",
				},
		"daylight": {
				content: "Because she's afraid of daylight.",
				score: 0,
				response:  "I believe you are thinking of vampires.",
				},
		},
	"ThrowTheBall": { 
		question: "Set the initial velocity and angle of the throw such that the player makes the basket.",
		"notright": {
				content: "",
				score: 0,
				response: "That velocity and angle will miss the basket."
				},
		"right": {
				content: "v<sub>i</sub> = 7.3, &theta; = 59&deg;",
				score: 1,
				response:  "Right on target.",
				}
		},
	"LabelsMC": { 
		question: "Which of these is on top.",
		"top": {
				content: "A",
				score: 1,
				response: "Glad you know which end is up."
				},
		"middle": {
				content: "B",
				score: 0.5,
				response:  "Try going all the way up.",
				},
		"bottom": {
				content: "C",
				score: 0,
				response:  "You seem to be upside down.",
				}
		},
	"Resist1": { 
		"question": "What is the change in resistance for a wire of greater cross-section?",
		"smaller": {
				content: "smaller resistance",
				score: 1,
				response:  "More area allows more room for electrons to move and pass charge."
				},
		"greater": {
				content: "greater resistance",
				score: 0,
				response:   "More area allows more room for electrons to move and pass charge.",
				},
		"same": {
				content: "the same resistance",
				score: 0,
				response:  "More area allows more room for electrons to move and pass charge.",
				}
		},
	"Resist2": { 
		"question": "What is the change in resistance for a wire of shorter length?",
		"smaller": {
				content: "smaller resistance",
				score: 1,
				response:  "More length impedes electrons, making it harder to pass charge."
				},
		"greater": {
				content: "greater resistance",
				score: 0,
				response:   "More length impedes electrons, making it harder to pass charge.",
				},
		"same": {
				content: "the same resistance",
				score: 0,
				response:  "More length impedes electrons, making it harder to pass charge.",
				}
		},
	"http://hub.paf.pearson.com/resources/sequences/123/nodes/1": {
		"1": {
				content: "1",
				score: 1,
				response: "There can be only 1",
			},
		},
	};
