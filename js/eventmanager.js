/* **************************************************************************
 * $Workfile:: eventmanager.js                                              $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of an EventManager object.
 *
 * The EventManager implements the Observer pattern, aka (Publish/Subscribe)
 * as described here: http://msdn.microsoft.com/en-us/magazine/hh201955.aspx
 * A javascript implementation of this pattern is available at:
 * https://github.com/mroderick/PubSubJS
 *
 * @todo: See whether changing to object literal (singleton) makes more sense.
 *        Make it requirejs friendly
 *        Do we need regexp or subtopic matching? 
 *
 * Created on		March 18, 2013
 * @author			Michael Jay Lippert
 * @author			Young Suk Ahn Park
 *
 * **************************************************************************/

goog.provide('pearson.utils.EventManager');

/* **************************************************************************
 * IEventManager                                                       */ /**
 *
 * Interface for event managers.
 *
 * @interface
 *
 ****************************************************************************/
pearson.utils.IEventManager = function () {};

/* **************************************************************************
 * IEventManager.publish                                               */ /**
 *
 * Notify the event manager that a particular event (topic) has occurred
 * so that the event manager can call the handlers of all subscribers to that
 * event (topic).
 *
 * @param {string}	eventId			-The identifier of the event being fired.
 *									 aka topic.
 * @param {Object}	eventDetails	-The details of the event to be passed to each
 *									 subscriber's notification function. Its value
 *									 is specific to the particular event.
 *
 ****************************************************************************/
pearson.utils.IEventManager.prototype.publish = function (eventId, eventDetails) {};

/* **************************************************************************
 * IEventManager.subscribe                                             */ /**
 *
 * Request that when a particular event (topic) is published, the given
 * handler function will be called w/ that event's event details.
 *
 * @param {string}		eventId		-The identifier of the event that when fired
 *									 should invoke the given callback. aka topic.
 * @param {Function}	handler		-The function that will be called when the
 *									 event is fired.  
 *
 ****************************************************************************/
pearson.utils.IEventManager.prototype.subscribe = function (eventId, handler) {};

/* **************************************************************************
 * EventManager                                                        */ /**
 *
 * @constructor
 * @implements {pearson.utils.IEventManager}
 *
 * The event manager keeps track of subscribers of a particular topic (event)
 * so that when a publisher publishes that topic all of the subscribers can
 * be notified.
 *
 * The event manager should be used for all events. That will allow
 * one widget on a page to respond to an event published (fired) by another
 * widget on the page. It also will allow for multiple response to a single
 * event.
 * @param {boolean=} publishToBroker	Whether or not to send message to the 
 * 										MessageBroker in the parent window,
 * 										the default is true.
 *
 ****************************************************************************/
pearson.utils.EventManager = function (publishToBroker)
{
	// Private Fields (should not be referenced except by EventManager methods)
	
	/**
	 * events_ associates eventIds with an array of publishers and an array of
	 * subscribers to that event.
	 * @type {Object.<string, pearson.utils.EventManager.ManagedEventInfo_>}
	 * @private
	 */
	this.events_ = {};

	/**
	 * The publishToBroker flag determines whether published events should
	 * be sent to the MessageBroker, which propogates the event to EventManager
	 * subscriptions in other iframes.
	 * @type {boolean}
	 * @private
	 */
	this.publishToBroker_ = (publishToBroker === undefined) ? true : publishToBroker;
};

/**
 * ManagedEventInfo_ is the information stored internally by the EventManager
 * for each subscribed eventId.
 *
 * @typedef {Object} ManagedEventInfo_
 * @property {Array.<Function>}	handlers	-List of subscribed handlers for an
 * 											 eventId.
 * @private
 */
pearson.utils.EventManager.ManagedEventInfo_;

/* **************************************************************************
 * EventManager.enablePublishToBroker                                  */ /**
 *
 * Method to enable or disable publishing the message to the MessageBroker
 * in the parent window.
 *
 * @param {boolean} enable		True enables, false disables.
 *								
 ****************************************************************************/
pearson.utils.EventManager.prototype.enablePublishToBroker = function (enable)
{
	this.publishToBroker_ = enable;
};

/* **************************************************************************
 * EventManager.subscribe                                              */ /**
 *
 * EventManager class method to subscribe to an event that an object may fire.
 *
 * @param {string} eventId		The identifier of the event that when fired
 *								should invoke the given callback. aka topic.
 * @param {Function} handler	The function that will be called when the
 *								event is fired.  
 *
 * Notes:
 * - We'll need to create some unique token if we want to allow unsubscribe.
 * - If you subscribe to the same callback multiple times, when the event is
 *   fired it will be called once for each subscription.
 ****************************************************************************/
pearson.utils.EventManager.prototype.subscribe = function (eventId, handler)
{
	// If the eventId has never been subscribed to, add it
	if (!(eventId in this.events_))
	{
		this.events_[eventId] =  { handlers: [] };
	}
	
	var event = this.events_[eventId];
	
	// Add the handler to the list of handlers of the eventId
	event.handlers.push(handler);
};

/* **************************************************************************
 * EventManager.publishLocal_                                          */ /**
 *
 * EventManager class method to publish (fire) an event calling the
 * notification function of all subscribers of that event.
 * This method does not send message to the MessageBroker.
 *
 * @private
 *
 * @param {string} eventId		The identifier of the event being fired.
 *								aka topic.
 * @param {Object} eventDetails	The details of the event to be passed to each
 *								subscriber's notification function. Its value
 *								is specific to the particular event.
 *
 ****************************************************************************/
pearson.utils.EventManager.prototype.publishLocal_ = function (eventId, eventDetails)
{
	// If there are no subscribers, do nothing
	if (eventId in this.events_)
	{
		var event = this.events_[eventId];
		
		// Call all the subscribed notification functions for this event
		for (var i = 0; i < event.handlers.length; ++i)
		{
			var handler = event.handlers[i];
			handler(eventDetails);
		}
	}
};

/* **************************************************************************
 * EventManager.publish                                                */ /**
 *
 * Besides publishing the event to the local subscribers, it also sends 
 * to the MessageBroker which is an message listener at parent window.
 *
 * @param {string} eventId		The identifier of the event being fired.
 *								aka topic.
 * @param {Object} eventDetails	The details of the event to be passed to each
 *								subscriber's notification function. Its value
 *								is specific to the particular event.
 *
 ****************************************************************************/
pearson.utils.EventManager.prototype.publish = function (eventId, eventDetails)
{
	// Notify any "local" subscribers
	this.publishLocal_(eventId, eventDetails);

	// YSAP - Send to the parent window as well.
	// For the message structure see messagebroker.js
	if (this.publishToBroker_)
	{
		window.parent.postMessage(
			{
				messageType: "bricevent",
				message: {
					topic: eventId,
					eventData: eventDetails
				}
			}, '*');	
	}
};

/* **************************************************************************
 * EventManager.listenBroker                                           */ /**
 *
 * Start listening to the window's message event. 
 * Only required if the iframe contains bric that listens to events.
 * The iframe are supposed to invoke this method when all the objects are 
 * ready to handle events. 
 *
 ****************************************************************************/
pearson.utils.EventManager.prototype.listenBroker = function ()
{
	var that = this;
	window.addEventListener('message',
			function(e)
			{
				var data = e.data;
				var here = location.href;
				if (data.messageType === 'bricevent')
				{
					window.console.log("[" + here + "] EventManager: Handling bricevent:" +
								JSON.stringify(data));

					// Publish the remote event to any local subscribers
					that.publishLocal_(data.message.topic, data.message.eventData);
				}
			}
	);
}
