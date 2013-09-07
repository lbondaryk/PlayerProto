/* **************************************************************************
 * $Workfile:: bricworks.js                                                 $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the BricWorks bric factory.
 *
 * The BricWorks is a factory which creates brix.
 *
 * Created on		June 26, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.BrixWorks');

goog.require('pearson.utils.IEventManager');

/* **************************************************************************
 * BricWorks                                                           */ /**
 *
 * Constructor function for the BricWorks factory.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this BrixWorks.
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * A BricWorks is a factory which creates brix using the bricMolds which have
 * been registered with the BricWorks.
 *
 ****************************************************************************/
pearson.brix.BricWorks = function (config, eventManager)
{
	/**
	 * The event manager to use to publish (and subscribe to) events for the
	 * created brix.
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager = eventManager || pearson.utils.IEventManager.dummyEventManager;

	/**
	 * The bricCatalogue is the reference to all of the brix that this BricWorks
	 * can manufacture.
	 * @type {Object.<string, function(Object, !pearson.utils.IEventManager=)>}
	 * @private
	 */
	this.bricCatalogue_ = {};

}; // end of BricWorks constructor

/* **************************************************************************
 * BricWorks.registerMold                                              */ /**
 *
 * Register the mold (constructor) used to create a bric.
 *
 * @param {string}	bricName	-The name of the bric that the given mold creates.
 * @param {function(Object, !pearson.utils.IEventManager=)}
 * 					bricMold	-A function which creates the named bric.
 *
 * @note This is currently set up for a bricMold to be a constructor. I'm
 *       not sure that's a good idea, and even if it is I'm not sure how
 *       to annotate it for closure.
 *       The initial idea that each file defining a bric would access the
 *       singleton BricWorks and register its mold isn't good since we
 *       aren't going put code to get executed on load in the various files. -mjl
 ****************************************************************************/
pearson.brix.BricWorks.prototype.registerMold = function (bricName, bricMold)
{
	this.bricCatalogue_[bricName] = bricMold;

};

/* **************************************************************************
 * BricWorks.createBric                                                */ /**
 *
 * Create the specified type of bric.
 *
 * @param {string}	bricName	-The name of the bric desired.
 * @param {Object}	config		-The configuration for the specified bric.
 * @returns {pearson.brix.Bric} the newly created Bric.
 *
 ****************************************************************************/
pearson.brix.BricWorks.prototype.createBric = function (bricName, config)
{
	var bricMold = this.bricCatalogue_[bricName];

	return new bricMold(config, this.eventManager);
};

