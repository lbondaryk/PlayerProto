/**
 * @fileoverview Implementation of the MessageBroker

 * MessageBroker is the component that lives in the master document (html) and 
 * serves as a middleware that relays messages between iframes.
 *
 * There are three channels of events handled based on messageType.
 * 1. The 'bricevent' channel  will forward the message to the internal EvenManager, 
 *    that will in turn propagate to the subscribed iframes.
 * 2. The 'resize' channel will handle resizing.
 * 3. The 'topic' channel will handle subscription and unsubscription.
 *
 * Topic based messaging (channel 2) is implemented by EventManager.
 *
 * The message format is as follows (the inner structure 'data' is the actual payload sent by cements).
 * Notice that the message contains the topic.
 
 PENDING: Change the message format as agreed with Inkling:

 Event = {
 	source: <source>,
 	data: {
 		type: (view | message), 
 		method: (specific to type)
 		payload: (Object)


 		#case message, this is what actually sent at EventManager scope
		method: (subscribe | unsubscribe | publish ),
	 	payload:{
	 		sendTime: <time was sent in unix format>
	 		topic: <the event manager's topic: objectId/event_name ("all-loaded" is reserved)>
			message: <specific data, usually collection of key-value pairs> 
	 	}

	 	#case 'resize'
	 	method: "set",
	 	payload:{
			width:<w>,
			height:<h>
		}
	 }
 }

 *
 * Created on		March 18, 2013
 * @author			Young Suk Ahn Park
 *
 */

goog.require('pearson.utils.EventManager');
//goog.provide('pearson.brix.MessageBroker');


/**
 * MessageBroker 
 * @constructor
 *
 * The MessageBroker is the messaging component that bridges the EventManagers
 * in the iframes.
 *
 * The constructor registers the three default channel handlers
 */
var MessageBroker = function(options, optDomHelper) 
{

	// Auto call to the initialization method disabled 
	// favoring the use of MessageBroker as singleton.
	//this.initialize.apply(this, arguments);

	// If DomHelper is not explicitly provided, create a default one.
	// @todo: if not created, then it should not dispose either.
	if (optDomHelper === undefined) {
		this.domHelper = new DomHelper();
	} else {
		this.domHelper = optDomHelper;
	}

	// Register the two default Channel Handlers
	var _self = this;
	this.channelHandlers['message'] = function(evt) {

		if (evt.data.method === 'publish') {
			_self.bricMessageCounter++;
			_self.publish(evt.data.payload.topic, evt);
		}
		else if (evt.data.method === 'subscribe') 
		{
			_self.subscribe(evt.data.payload.topic, evt.source);
		}
		else if (evt.data.method === 'unsubscribe') 
		{
			_self.unsubscribe(evt.data.payload.topic, evt.source);
		}
	}

	this.channelHandlers['view'] = function(evt) {
		_self.resizeMessageCounter++;
		_self.domHelper.resize(evt.source, evt.data.payload);	
	}
}


/**
 * THe DOM helper. This object is used for the cache of frames.
 * @type {DomHelper}
 */
MessageBroker.prototype.domHelper = null;


/**
 * The log level. Higher the number higher the log detail.
 * 0=no logging, 1=ERROR 2=WARN, 3=INFO. 4=DEBUG, 5=TRACE
 * @type {int}
 */
MessageBroker.prototype.logLevel = 0; // by default, no logging

/**
 * The Number of bric messages received. Primarily for testing purpose.
 * @type {int}
 */
MessageBroker.prototype.bricMessageCounter = 0;

/**
 * The Number of resize messages received. Primarily for testing purpose.
 * @type {int}
 */
MessageBroker.prototype.resizeMessageCounter = 0;

/**
 * The function attached to the windows event. Dispatches the incoming messages
 * into appropriate channels.
 * @type {function}
 */
MessageBroker.prototype.channelDispatcher = null;


/**
 * The map that contains channel handlers. Channel handlers are analogous to Commands in the Command pattern.
 * Currently there are three default channels: 
 * 'bricevent' - to handle item (bric) messages, 
 * 'topic' - to handler topic subscription/unsubscription,
 * 'resize' - to handle windows resize.
 * It can later be extended by adding new function pointers that process channel messages.
 * @type {function[]}
 */
MessageBroker.prototype.channelHandlers = {};


/**
 * The internal PubSub object.
 * The pubSub object must have publish, subscribe an unsubscribe methods.
 * Currently is an instance of EventManager to handle topics.
 * @type {Object}
 */
MessageBroker.prototype.pubSub = new pearson.utils.EventManager(false);

/**
 * MessageBroker.log
 *
 * Logs messages to the console.
 * In order to actually output log message, the logLevel must be greater or equal than the argument level 
 *
 * @param {int} level		The level of the current message 
 * @param {String} message	The actual message.
 */
MessageBroker.prototype.log = function (level, message) 
{
	if (this.logLevel >= level) {
			console.log("[MB] " + message);
		}
	}

/**
 * MessageBroker.initialize
 *
 * The initialization does:
 * 1. registers the channelDispater to the windowEventListener
 * 2. Converts object nodes to iframe nodes
 * 3. Caches the iframe nodes in the DOM Helper
 *
 * @param {Object} options		Options (logLevel: {int}) .
 * 
 */
MessageBroker.prototype.initialize = function (options) 
{
	if (options !== undefined) {
		if (options.logLevel !== undefined)
			this.logLevel = options.logLevel;
	}


	var _self = this;
	// Function defined here so we can access the this pointer
	// (aliased as _self)
	var _channelDispatcher = function(evt) {
			_self.log(5, "Message Received: " + evt.data);
			var chanHandler = _self.channelHandlers[evt.data.type];
			if (chanHandler) {
				chanHandler(event);
			} else {
				_self.log(3, "Channel Handler for '" + evt.data.type +"' not found, ignoring!");
			}
		}

	// We'd like to keep the pointer to the handler function 
	// to be able to unregister later.
	this.channelDispatcher = _channelDispatcher;

	// Listen to messages events
	window.addEventListener('message', this.channelDispatcher);

	// Shall the host application do this manually??
	// Conversion of the Object to Iframe must come after the addEventListener.
	this.domHelper.convertObjectToIframeElement('bric');

	// Cache the iframes
	this.domHelper.cacheFrames('bric');
	this.log(1, "MessageBroker initialized.");
};

/**
 * MessageBroker.dispose
 *
 * Unregister the message event listener, and
 * releases used references (the list of iframes), and 
 */
MessageBroker.prototype.dispose = function () 
{
	// Disable Channel Dispatcher
	window.removeEventListener('message', this.channelDispatcher);

	this.pubSub = null;

	this.domHelper.dispose();
	//this.domHelper = null;
	this.log(1, "MessageBroker disposed (listeners removed).");
};

/**
 * MessageBroker.subscribe
 *
 * Subscribes a window to a specific topic.
 *
 * @param {String} topic	The topic to subscribe to.
 * @param {Windows} evt		The windows object to subscribe.
 * @return {boolean}		True if subscribed, false otherwise 
 *							(May not be subscribed if is not part of the item)
 * 
 */
MessageBroker.prototype.subscribe = function (topic, windowsObj) 
{

	var frameEntry = this.domHelper.getFrameCustomParams(windowsObj);

	if (frameEntry === undefined) {
		return false;
	} 

	var _self = this;

	// Reuse the same handle for an iframe
	var subscribeHandler = frameEntry['subscribeHandler'];

	if(!subscribeHandler)
	{
		subscribeHandler = function(evt) {
			if ( frameEntry.node.contentWindow === evt.source) {
				_self.log(5, "Skipping the iframe where the message was originated.");
				return;
			}
			_self.log(5, "Posting message to an iframe");
			// Sending the entire message as is
			frameEntry.node.contentWindow.postMessage(evt.data, '*');
		}
		frameEntry['subscribeHandler'] = subscribeHandler;
	}

	this.pubSub.subscribe(topic, subscribeHandler);
	this.log(2, "Frame '"+ frameEntry.node.src +"' subscribed to topic: [" + topic + "]");

	return true;
};

/**
 * MessageBroker.unsubscribe
 *
 * Subscribes a window to a specific topic.
 *
 * @param {String} topic	The topic to subscribe to.
 * @param {Windows} evt		The windows object to subscribe.
 * @return {boolean}		True if subscribed, false otherwise 
 *							(May not be subscribed if is not part of the item)
 * 
 */
MessageBroker.prototype.unsubscribe = function (topic, windowsObj) 
{
	var frameEntry = this.domHelper.getFrameCustomParams(windowsObj);

	if (frameEntry === undefined) {
		return false;
	} 

	var subscribeHandler = frameEntry['subscribeHandler'];

	if(!subscribeHandler)
	{
		return false;
	}

	this.pubSub.unsubscribe(topic, subscribeHandler);
	this.log(2, "Frame '"+ frameEntry.node.src +"' unsubscribed from topic: [" + topic + "]");

	return true;
};

/**
 * MessageBroker.publish
 *
 * Publishes message to the rest of iframes subscribed to the specified topic.
 *
 * @param {String} topic		The topic to publish the message.
 * @param {Object} message		The message to be published.
 * 
 */
MessageBroker.prototype.publish = function (topic, evt) 
{

	this.log(4, "Publishing message: " + JSON.stringify(evt.data.payload));
	this.pubSub.publish(topic, evt);
};



