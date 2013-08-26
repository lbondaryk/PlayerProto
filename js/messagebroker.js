/* **************************************************************************
 * $Workfile:: name-of-file.js                                              $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the MessageBroker
 *
 * MessageBroker is the component that lives in the master document (html) and 
 * serves as a middleware that relays messages between iframes.
 *
 * There are three channels of event handling based on messageType.
 * 1. The 'bricevent' channel  will forward the message to the internal EvenManager, 
 *    that will in turn propagate to the subscribed iframes.
 * 2. The 'resize' channel will handle resizing.
 * 3. The 'topic' channel will handle subscription and unsubscription.
 *
 * Created on		July 11, 2013
 * @author			Young Suk Ahn Park
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * @note: The current implementation does not handle topic.
 *
 * The message format is as follows (the inner structure 'data' is the actual payload').
 * Notice that the message contains the topic.
 * @example
 *   Event = {
 *   	source: <source>,
 *   	data: {
 		channel: <bricevent, resize, topic>
 *   		#case bricevent, this is what actually sent at EventManager scope
 *  	 	message: {
 *  	 		sendTime: <time was sent in unix format>
 *  	 		topic: <the event manager's topic: objectId/event_name (changed, submitted, control, error, etc)>
 *  			eventData: <specific data, usually collection of key-value pairs> 
 *  	 	}
 *  
 *  	 	#case 'resize'
 *  		width:<w>,
 *  		height:<h>
 *  
 *  		#case 'topic' (implementation pending)
 *  		topic:<the topic name>,
 *  		action:<subscribe | unsubscribe>
 *  	 }
 *   }
 *
 * **************************************************************************/
/*
 * Change Log:
 * - Working on the topic functionality (messageType changed to channel)
 */

//goog.require('brixworks.eventmanager');


/* **************************************************************************
 * MessageBroker                                                       */ /**
 *
 * The MessageBroker all bric iframes for the message relaying.
 * To make it simpler to migrate to object literal style, the constructor's 
 * logic was placed in the initialize() function.
 * 
 * @constructor
 *
 * @param {Object=}	options		-Unused. For possible future options.
 */
var MessageBroker = function (options)
{
	// Auto call to the initialization method disabled 
	// favoring the use of MessageBroker as singleton.
	//this.initialize.apply(this, arguments);
};

/**
 * List of iframes that contains brics
 * @type {Object[]}
 */
MessageBroker.prototype.bricIframes = null;

/**
 * The log level. Higher the number higher the log detail.
 * @type {int}
 */
MessageBroker.prototype.logLevel = 0; // by default, no logging

/**
 * The Number of bric messages received.
 * @type {int}
 */
MessageBroker.prototype.bricMessageCounter = 0;

/**
 * The Number of resize messages receved.
 * @type {int}
 */
MessageBroker.prototype.resizeMessageCounter = 0;

/**
 * The messageHandler function. This is assigned at initialize() method and 
 * is used to use the reference (e.g. when removing the listener).
 * @type {function}
 */
MessageBroker.prototype.messageHandler = null;

/**
 * The internal PubSub (an instance of EventManager to handle topics)
 * The pubSub object must have publish, subscribe an unsubscribe methods.
 * @type {Object[]}
 */
MessageBroker.prototype.pubSub = new EventManager(false);

/**
 * Logs messages to the console.
 * In order to actually output log message, the logLevel must be greater than the argument level 
 *
 * @param {int} level		The level of the current message (E.g. 1= coarse detail .. 5= high detail).
 * @param {String} message	The actual message.
 */
MessageBroker.prototype.log = function (level, message) {
	if (this.logLevel >= level) {
			console.log("[MB] " + message);
		}
	}

/**
 * MessageBroker.initialize
 *
 * The initialization method.
 *
 * @param {Object} options		Options (traceLevel: 0 - no logging, 1 - some logging .. 5=detailed logging ) .
 * 
 */
MessageBroker.prototype.initialize = function (options)
{
	if (options !== undefined) {
		if (options.logLevel !== undefined)
			this.logLevel = options.logLevel;
	}

	this.convertObjectTagToIframeTag();

	this.bricIframes = document.querySelectorAll('iframe.bric'); // 
	//this.bricIframes = $("iframe.bric");  // Alternatively can use jQuery 

	var _self = this;

	// Function defined here so we can access the this pointer
	// (aliased as _self)
	var _messageHandler = function(evt) {
			_self.log(1, "Message Received: " + evt.data);
			if (evt.data.messageType === 'bricevent') {
				_self.bricMessageCounter++;
				_self.relay(evt);
			}
			else if (evt.data.messageType === 'resize') {
				_self.resizeMessageCounter++;
				_self.resize(_self, evt);	
			} 
			// @todo: implement 'topic' channel
		}

	// We'd like to keep the pointer to the handler function 
	// to be able to unregister later.
	this.messageHandler = _messageHandler;

	// Listen to messages events
	window.addEventListener('message', this.messageHandler);
};

/**
 * MessageBroker.dispose
 *
 * Releases used references (the list of iframes), and unregister the message event listener.
 */
MessageBroker.prototype.dispose = function ()
{
	this.bricIframes = null;
	window.removeEventListener('message', this.messageHandler);
	this.log(1, "MessageBroker disposed (listeners removed).");
};

/**
 * MessageBroker.initialize
 *
 * Relay the message to the rest of iframes.
 * @todo: Possible improvement. Smarter relaying, i.e. to specific iframes 
 *        that are interested in that topic.
 *        Be ware that "smarter" MessageBroker means more load/complexity to it.
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 * 
 */
MessageBroker.prototype.relay = function (evt)
{
	var _self = this;
	[].forEach.call(_self.bricIframes, function(bricIframe) {
		// Skip over the iframe that sent the message.
		if (evt.source === bricIframe.contentWindow) return;

		var message = {
			messageType: evt.data.messageType,
			message: evt.data.message
		};
		_self.log(1, "Sending message: " + message);
		if (bricIframe) {
			bricIframe.contentWindow.postMessage(message, '*');	
		}
		
	});
};

/**
 * MessageBroker.resize
 *
 * Handles the resize of the iframes.
 * The message contains the width and height.
 * @todo: Check that all user agents (browsers) that we intent to support
 *        behaves correctly.
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 */
MessageBroker.prototype.resize = function (that, evt) {
		
		var sourceObject = that.findIFrameWithWindow(evt.source);
		if (sourceObject) {
			sourceObject.style.width = evt.data.width + 'px';
			sourceObject.style.height = evt.data.height + 'px';
		}
	};



	////////// methods related to DOM
	// Maybe is a good idea to refactor them to to a separate class
	// say, DomHelper, that handles DOM related events.
	// And provides abstraction of specific DOM manipulation

/**
 * MessageBroker.findIFrameWithWindow
 *
 * Returns the matching iframe within the the list of bric iframe list. 
 *
 * @param {Object} evt		The event object as sent by the postMessage().
 */
MessageBroker.prototype.findIFrameWithWindow = function (win)
{
	for (var i = 0; i < this.bricIframes.length; i++) {
		if (win === this.bricIframes[i].contentWindow) return this.bricIframes[i];
	}
};

/**
 * MessageBroker.findIFrameWithWindow
 *
 * Returns a queryString from <param> tags inside and <object>. 
 *
 * @param {Node} objectNode		The object node that will be changed to iframe, and contains the params.
 */
function buildQueryStringFromParams(objectNode)
{
	var params = objectNode.querySelectorAll('param');
	var queryString = [].reduce.call(params, function(acc, paramNode){
		var name = paramNode.getAttribute('name');
		var value = paramNode.getAttribute('value');

		if (acc) acc += '&';
		return acc + encodeURIComponent(name) + '=' + encodeURIComponent(value);
	}, '');
	return queryString;
};

/**
 * MessageBroker.convertObjectTagToIframeTag
 *
 * Converts the object tag to iframe tag.(Yes, as the function name implies) 
 *
 * @param {Node} objectNode		The object node that will be changed to iframe, and contains the params.
 */
MessageBroker.prototype.convertObjectTagToIframeTag = function ()
{
	// Turn the <object> tags into <iframe> tags to work around webkit bug https://bugs.webkit.org/show_bug.cgi?id=75395.
	// Also append parameters to iframe url so they're accessible to the iframe implementation.
	// To prevent the flicker when loading, you might want to do this transformation work before rendering the HTML in your player.
	var objectNodes = document.querySelectorAll('object.bric');
	[].forEach.call(objectNodes, function(objectNode) {
		var iframeNode = document.createElement('iframe');
		iframeNode.setAttribute('sandbox', 'allow-scripts');

		// Copy over whitelisted attributes from the <object> to the <iframe>.
		['height','width','class','style'].forEach(function(attrName) {
			var attrValue = objectNode.getAttribute(attrName);
			if (attrValue !== null) iframeNode.setAttribute(attrName, attrValue);
		});

		var queryString = buildQueryStringFromParams(objectNode);
		var url = objectNode.getAttribute('data') + '?' + queryString;
		iframeNode.setAttribute('src', url);
		// Swap the <object> for the <iframe> node.
		objectNode.parentNode.replaceChild(iframeNode, objectNode);
	});
};

