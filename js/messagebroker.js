/* **************************************************************************
 * $Workfile:: messagebroker.js                                             $
 * *********************************************************************/ /**
 *
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
 * 
 * Event = {
 *  source: <source>,
 *  data: {
 *      type: (view | message), 
 *      method: (specific to type),
 *      payload: (Object)
 *
 *      #case type='message'. This case is when the message is actually sent to EventManager
 *      method: (subscribe | unsubscribe | publish ),
 *      payload:{
 *          sendTime: <time was sent in unix format>
 *          topic: <the event manager's topic: objectId/event_name ("all-loaded" is reserved)>
 *          message: <specific data, usually collection of key-value pairs> 
 *      }
 *
 *      #case type='view'
 *      method: "set",
 *      payload:{
 *          width:<w>,
 *          height:<h>
 *      }
 *   }
 * }
 *
 *
 * Created on       July 11, 2013
 * @author          Young Suk Ahn Park
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.utils.IframeCollection');
goog.provide('pearson.utils.MessageBroker');

goog.require('goog.Disposable');
goog.require('pearson.utils.EventManager');
goog.require('pearson.utils.DomHelper');

/* **************************************************************************
 * IframeCollection                                                    */ /**
 *
 * Constructor function for IframeCollection instances.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @export
 *
 * @classdesc
 * Abstract Data Type that specifically contains iframes.
 * This class serves as caching mechanism for the brix iframes. The collection
 * contains the iframe's  window object reference as well as payload with
 * the DOM node of the iframe. 
 *
 * @note Young Suk, This class doesn't look abstract to me -mjl
 *
 ****************************************************************************/
pearson.utils.IframeCollection = function ()
{
    // call the base class constructor
    //goog.base(this);

    /**
     * List of (i)frames as obtained by the querySelectorAll(). 
     * @type {Array.<Element>}
     */
    this.framesList = null;

    /**
     * Array of cached (i)frames. Contains {node: <pointer to iframe>, subscribeHandler:<function to pubsub handler>}
     * @type {Array.<{node: Element, subscribeHandler: function(Object)}>}
     */
    this.frameCustomParams = [];

};
//goog.inherits(pearson.utils.IframeCollection, goog.Disposable);

/* **************************************************************************
 * IframeCollection.disposeInternal                                    */ /**
 *
 * Deletes or nulls out any references to COM objects, DOM nodes, or other
 * disposable objects. Classes that extend {@code goog.Disposable}
 * should override this method. Not reentrant.
 * To avoid calling it twice, it must only be called from the
 * subclass' {@code disposeInternal} method. Everywhere else the public
 * {@code dispose} method must be used. 
 *
 * Releases used resources: the list of iframe references
 * @override
 * @protected
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.disposeInternal = function ()
{
    //goog.base(this, 'disposeInternal');

    this.frameCustomParams = null;
};

/* **************************************************************************
 * IframeCollection.cacheFrames                                        */ /**
 *
 * Caches the (i)frames for faster access. The MessageBroker uses this to hold
 * information such as subscribeHandler.
 *
 * @param {String} classAttr        The class for selecting the object element 
 *                                  to be converted. (i.e. 'bric')
 * 
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.cacheFrames = function (classAttr)
{
    this.framesList = document.querySelectorAll("iframe." + classAttr);

    // Converting list into map. The map entry contains node and subscribeHandler
    for (var i = 0; i < this.framesList.length; i++)
    {
        this.setFrameCustomParams(i, {node: this.framesList[i], subscribeHandler: null});
    }
};

/* **************************************************************************
 * IframeCollection.setFrameCustomParams                               */ /**
 * 
 * Sets user defined parameters to the (i)frame object
 * 
 * @param {number}  index   The index in the array that represent the cache 
 * @param {{node: Element, subscribeHandler: function(Object)}
 *                  value   The value of the payload to associate with the (i)frame
 * 
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.setFrameCustomParams = function (index, value)
{
    this.frameCustomParams[index] = value;
};

/* **************************************************************************
 * IframeCollection.getFrameCustomParams                               */ /**
 * 
 * Gets the user defined parameters given the (i)frame object
 * 
 * @param  {Window} windowObj The reference of the iframe
 *
 * @return {Object} They payload value associated with this iframe
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.getFrameCustomParams = function (windowObj)
{
    for (var i = 0; i < this.framesList.length; i++)
    {
        if (windowObj === this.framesList[i].contentWindow)
        {
            return this.frameCustomParams[i];
        }
    }
    return null;
};

/* **************************************************************************
 * IframeCollection.getFrameCustomParamsByIndex                        */ /**
 * 
 * Gets the user defined parameters given the (i)frame index
 * 
 * @param  {number} index The index in the array of iframes
 *
 * @return {Object} They payload value associated with this iframe
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.getFrameCustomParamsByIndex = function (index)
{
    return this.frameCustomParams[index];
};

/* **************************************************************************
 * pearson.utils.IframeCollection.resize                               */ /**
 *
 * Resizes the iframe node to a specific dimension.
 * @todo: Check that all user agents (browsers) that we intend to support
 *        behave correctly.
 *
 * @param {Window}  window      The window (iframe) object to be resized.
 * @param {pearson.utils.ISize}
 *                  dimension   The object that contains width and height attributes.
 * 
 ****************************************************************************/
pearson.utils.IframeCollection.prototype.resize = function (window, dimension)
{
    var frameEntry =  this.getFrameCustomParams(window);

    if (frameEntry)
    {
        var frameObject = frameEntry.node;
        frameObject.style.width = dimension.width + 'px';
        frameObject.style.height = dimension.height + 'px';
    }
};

/* **************************************************************************
 * MessageBroker                                                       */ /**
 *
 * Constructor function for MessageBroker instances.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @export
 *
 * @param {Object}		config			-The settings to configure this MessageBroker
 * @param {!pearson.utils.DomHelper=}
 * 						domHelper	    -A DOM helper which provides useful utilities
 * 						                 to manipulate the DOM.
 *
 * @classdesc
 * The MessageBroker is the messaging component that bridges the EventManagers
 * in the iframes.
 * The constructor registers the three default channel handlers
 *
 ****************************************************************************/
pearson.utils.MessageBroker = function (config, domHelper)
{
    // call the base class constructor
    //goog.base(this);

    // Auto call to the initialization method disabled 
    // favoring the use of MessageBroker as singleton.
    //this.initialize.apply(this, arguments);

    // If DomHelper is not explicitly provided, create a default one.
    // @todo: if not created, then it should not dispose either.
    /**
     * Flag whether this.domHelper was supplied or not, so we know if
     * we should dispose of it.
     * @private
     * @type {boolean}
     */
    this.domHelperWasProvided_ = domHelper ? true : false;

    /**
     * The DomHelper this message broker will use when needed.
     * @type {pearson.utils.DomHelper}
     */
    this.domHelper = domHelper !== undefined ? domHelper : pearson.utils.DomHelper;

    this.iframeCollection = new pearson.utils.IframeCollection();


    // Register the two default Channel Handlers
    var _self = this;
    this.channelHandlers['message'] = function (evt)
    {
        if (evt.data.method === 'publish')
        {
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
    };

    this.channelHandlers['view'] = function (evt)
    {
        _self.resizeMessageCounter++;
        _self.iframeCollection.resize(evt.source, evt.data.payload);
    };
    
}; // end of MessageBroker constructor
//goog.inherits(pearson.utils.MessageBroker, goog.Disposable);


/**
 * The DOM helper. This object is used to access DOM elemements.
 * @type {DomHelper}
 */
pearson.utils.MessageBroker.prototype.domHelper = null;

/**
 * The IFrameContainer. This object is used for the cache of frames.
 * @type {IframeCollection}
 */
pearson.utils.MessageBroker.prototype.iframeCollection = null;

/**
 * The log level. Higher the number higher the log detail.
 * 0=no logging, 1=ERROR 2=WARN, 3=INFO. 4=DEBUG, 5=TRACE
 * @type {number}
 */
pearson.utils.MessageBroker.prototype.logLevel = 0; // by default, no logging

/**
 * The Number of bric messages received. Primarily for testing purpose.
 * @type {number}
 */
pearson.utils.MessageBroker.prototype.bricMessageCounter = 0;

/**
 * The Number of resize messages received. Primarily for testing purpose.
 * @type {number}
 */
pearson.utils.MessageBroker.prototype.resizeMessageCounter = 0;

/**
 * The function attached to the windows event. Dispatches the incoming messages
 * into appropriate channels.
 * @type {Function}
 */
pearson.utils.MessageBroker.prototype.channelDispatcher = null;


/**
 * The map that contains channel handlers. Channel handlers are analogous to Commands in the Command pattern.
 * Currently there are three default channels: 
 * 'bricevent' - to handle item (bric) messages, 
 * 'topic' - to handler topic subscription/unsubscription,
 * 'resize' - to handle windows resize.
 * It can later be extended by adding new function pointers that process channel messages.
 * @type {Array.<Function>}
 */
pearson.utils.MessageBroker.prototype.channelHandlers = {};


/**
 * The internal PubSub object.
 * The pubSub object must have publish, subscribe an unsubscribe methods.
 * Currently is an instance of EventManager to handle topics.
 * @type {!pearson.utils.IEventManager}
 */
pearson.utils.MessageBroker.prototype.pubSub = new pearson.utils.EventManager(false);

/* **************************************************************************
 * MessageBroker.log                                                   */ /**
 *
 * Logs messages to the console.
 * In order to actually output log message, the logLevel must be greater or equal than the argument level 
 *
 * @param {number} level    The level of the current message 
 * @param {string} message  The actual message.
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.log = function (level, message)
{
    if (this.logLevel >= level)
    {
        window.console.log("[MB] " + message);
    }
};

/* **************************************************************************
 * MessageBroker.initialize                                            */ /**
 *
 * The initialization does:
 * 1. registers the channelDispatcher to the windowEventListener
 * 2. Converts object nodes to iframe nodes
 * 3. Caches the iframe nodes in the DOM Helper
 *
 * @param {Object} options      Options (logLevel: {int}) .
 * 
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.initialize = function (options)
{
    if (options !== undefined)
    {
        if (options.logLevel !== undefined)
            this.logLevel = options.logLevel;
    }


    var _self = this;
    // Function defined here so we can access the this pointer
    // (aliased as _self)
    var _channelDispatcher = function(evt)
    {
        _self.log(5, "Message Received: " + evt.data);
        var chanHandler = _self.channelHandlers[evt.data.type];
        if (chanHandler)
        {
            chanHandler(evt);
        }
        else
        {
            _self.log(3, "Channel Handler for '" + evt.data.type +"' not found, ignoring!");
        }
    };

    // We'd like to keep the pointer to the handler function 
    // to be able to unregister later.
    this.channelDispatcher = _channelDispatcher;

    // Listen to messages events
    window.addEventListener('message', this.channelDispatcher);

    // Shall the host application do this manually??
    // Conversion of the Object to Iframe must come after the addEventListener.
    this.domHelper.convertObjectToIframeElement('bric');

    // Cache the iframes
    this.iframeCollection.cacheFrames('bric');
    this.log(1, "MessageBroker initialized.");
};

/* **************************************************************************
 * MessageBroker.disposeInternal                                       */ /**
 *
 * Unregister the message event listener, and
 * releases used references (the list of iframes), and 
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.disposeInternal = function ()
{
    // Disable Channel Dispatcher
    window.removeEventListener('message', this.channelDispatcher);

    this.pubSub = null;

    this.iframeCollection.disposeInternal();
    //this.iframeCollection = null;
    this.log(1, "MessageBroker disposed (listeners removed).");
};

/* **************************************************************************
 * MessageBroker.subscribe                                             */ /**
 *
 * Subscribes a window (iframe) to a specific topic.
 *
 * @param {string}  topic       The topic to subscribe to.
 * @param {Windows} windowsObj  The windows object to subscribe.
 *
 * @return {boolean} True if subscribed, false otherwise 
 *                   (May not be subscribed if is not part of the item)
 * 
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.subscribe = function (topic, windowsObj)
{
    var frameEntry = this.iframeCollection.getFrameCustomParams(windowsObj);

    if (frameEntry === undefined)
    {
        return false;
    } 

    // Reuse the same handle for an iframe
    var subscribeHandler = frameEntry['subscribeHandler'];

    if (!subscribeHandler)
    {
        subscribeHandler = function(evt)
        {
            if ( frameEntry.node.contentWindow === evt.source)
            {
                this.log(5, "Skipping the iframe where the message was originated.");
                return;
            }
            this.log(5, "Posting message to an iframe");
            // Sending the entire message as is
            frameEntry.node.contentWindow.postMessage(evt.data, '*');
        };

        frameEntry['subscribeHandler'] = subscribeHandler;
    }

    this.pubSub.subscribe(topic, goog.bind(subscribeHandler, this));
    this.log(2, "Frame '"+ frameEntry.node.src +"' subscribed to topic: [" + topic + "]");

    return true;
};

/* **************************************************************************
 * MessageBroker.unsubscribe                                           */ /**
 *
 * Subscribes a window to a specific topic.
 *
 * @param {string}  topic   The topic to subscribe to.
 * @param {Windows} evt     The windows object to subscribe.
 *
 * @return {boolean} True if subscribed, false otherwise 
 *                   (May not be subscribed if is not part of the item)
 * 
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.unsubscribe = function (topic, windowsObj)
{
    var frameEntry = this.iframeCollection.getFrameCustomParams(windowsObj);

    if (frameEntry === undefined)
    {
        return false;
    }

    var subscribeHandler = frameEntry['subscribeHandler'];

    if (!subscribeHandler)
    {
        return false;
    }

    this.pubSub.unsubscribe(topic, subscribeHandler);
    this.log(2, "Frame '"+ frameEntry.node.src +"' unsubscribed from topic: [" + topic + "]");

    return true;
};

/* **************************************************************************
 * MessageBroker.publish                                               */ /**
 *
 * Publishes message to the rest of iframes subscribed to the specified topic.
 *
 * @param {String} topic        The topic to publish the message.
 * @param {Object} message      The message to be published.
 * 
 ****************************************************************************/
pearson.utils.MessageBroker.prototype.publish = function (topic, evt)
{
    this.log(4, "Publishing message: " + JSON.stringify(evt.data.payload));
    this.pubSub.publish(topic, evt);
};

