/* **************************************************************************
 * $Workfile:: mortar-hilite.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link pearson.brix.mortar.Hilite} mortar.
 *
 * Created on		October 1, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.mortar.Hilite');

goog.require('pearson.brix.mortar.Mortar');
goog.require('pearson.utils.IEventManager');

/* **************************************************************************
 * Hilite                                                              */ /**
 *
 * Constructor function for Hilite instances.
 *
 * @constructor
 * @extends {pearson.brix.mortar.Mortar}
 * @export
 *
 * @param {Object}		config			-The settings to configure this Hilite
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Hilite.
 * 										 if undefined a unique id will be assigned.
 * @param {string}      config.topic    -The topic of the selection event published
 *                                       by a bric that should be responded to by
 *                                       calling the lite method of the target bric.
 * @param {string}      config.eventDetailsProperty
 *                                      -The name of the property of the eventDetails
 *                                       event argument to pass to the target bric's
 *                                       lite method.
 * @param {string}      config.targetBric
 *                                      -Bric instance to highlight
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * A Hilite mortar responds to selection events of one Bric by calling the
 * lite method of another Bric.
 *
 ****************************************************************************/
pearson.brix.mortar.Hilite = function (config, eventManager)
{
    // call the base class constructor
    goog.base(this);

    
};
goog.inherits(pearson.brix.mortar.Hilite, pearson.brix.mortar.Mortar);

