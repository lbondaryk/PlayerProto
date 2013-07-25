/* **************************************************************************
 * $Workfile:: eventmanager.js                                              $
 * **********************************************************************//**
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

/* **************************************************************************
 * Constants
 ****************************************************************************/

/* **************************************************************************
 * Page variables
 ****************************************************************************/

/* **************************************************************************
 * EventManager                                                         *//**
 *
 * @constructor
 *
 * The event manager keeps track of subscribers of a particular topic (event)
 * so that when a publisher publishes that topic all of the subscribers can
 * be notified.
 *
 * The event manager should be used for all events. That will allow
 * one widget on a page to respond to an event published (fired) by another
 * widget on the page. It also will allow for multiple response to a single
 * event.
 * @param {boolean} publishToBroker		Whether or not to send message to the 
 * 										MessageBroker in the parent window 
 *
 ****************************************************************************/
function EventManager(publishToBroker)
{
	// Private Fields (should not be referenced except by EventManager methods)
	
	/**
	 * events_ associates eventIds with an array of publishers and an array of
	 * subscribers to that event.
	 * @type Object.<string, ManagedEventInfo>
	 * @private
	 */
	this.events_ = {};

	this.publishToBroker_ = (publishToBroker === undefined) ? true : publishToBroker;
}

/* **************************************************************************
 * EventManager.subscribe                                               *//**
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
EventManager.prototype.subscribe = function(eventId, handler)
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
 * EventManager.publishLocal                                           *//**
 *
 * EventManager class method to publish (fire) an event calling the
 * notification function of all subscribers of that event.
 * This method does not send message to the MessageBroker.
 *
 * @param {string} eventId		The identifier of the event being fired.
 *								aka topic.
 * @param {Object} eventDetails	The details of the event to be passed to each
 *								subscriber's notification function. Its value
 *								is specific to the particular event.
 *
 ****************************************************************************/
EventManager.prototype.publishLocal = function(eventId, eventDetails)
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
}

/* **************************************************************************
 * EventManager.publish                                                 *//**
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
EventManager.prototype.publish = function(eventId, eventDetails)
{
	// If there are no subscribers, do nothing
	this.publishLocal(eventId, eventDetails);

	// YSAP - Send to the parent window as well.
	// For the message structure see messagebroker.js
	if (this.publishToBroker_) {
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
 * EventManager.listenBroker                                             *//**
 *
 * Start listening to the window's message event. 
 * Only required if the iframe contains bric that listens to events.
 * The iframe are supposed to invoke this method when all the objects are 
 * ready to handle events. 
 *
 *
 ****************************************************************************/
EventManager.prototype.listenBroker = function()
{
	var _this = this;
	window.addEventListener('message', function(e){
	var data = e.data;
	var here = location.href;
	if (data.messageType === 'bricevent'){
console.log("["+location.href+"] EventManager: publishing event locally:" + JSON.stringify(data));
			// Publish in the local iframe 
			_this.publishLocal(data.message.topic, data.message.eventData, true);
		}
	});
}
