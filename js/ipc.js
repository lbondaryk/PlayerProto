/* **************************************************************************
 * $Workfile:: ipc.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview The Brix Item Player Client.
 *
 * The IPC is responsible of retrieving containerConfig and instantiating 
 * brix configured within the containerConfig.

 *
 * Created on       Sept 30, 2013
 * @author          Young-Suk Ahn
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
goog.provide('pearson.brix.Ipc');

goog.require("pearson.brix.IpsProxy");
goog.require("pearson.brix.BrixLayer");


/* **************************************************************************
 * Ipc                                                                 */ /**
 *
 * The IPC listens for AMC's sequenceNodeIdentifier. Upon receipt of the 
 * sequenceNodeIdentifier, it retrieves the brix' containerConfig from IPS and 
 * instantiates and wires the brix and mortars using the BrixLayer.
 *
 * @constructor
 * @export
 *
 * @param {Object}      config          - The settings to configure this SelectGroup
 *
 ****************************************************************************/
pearson.brix.Ipc = function (config, eventManager)
{
    /**
     * The event manager to use to publish (and subscribe to) events for this widget
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager;

    var brixLayerConfig = null;

    /**
     * The BrixLayer instance
     * @todo - Check if it changes to singleton
     * @type {pearson.brix.BrixLayer}
     */
    this.bricLayer = new pearson.brix.BricLayer(brixLayerConfig, eventManager);
};

/**
 * Array of {assignmentId=<val>, itemid=<val>, type=<val>}
 * 
 * @type {Array.<Object>} items
 */
pearson.brix.Ipc.items = [];

/**
 * The container ID is used in the iframe mode.
 * Having a value will make the IPC to retrieve a specific targetId 
 * (aka. containerItem) from the IPS.
 * @type {String}
 */
pearson.brix.Ipc.containerId = null;

/** 
 * Initialization
 * @params items array of {assignemntId, itemId, type}
 * @param target is used in iframe mode, otherwise null (pesude code for deafult param).
 */

/**
 * Initializes the IPC depending on the different parameters are passed.
 * The different parameters defines the mode: div or iframe.
 * In div-mode, the items contains an array of possibly multiple items, and 
 * the optional opt_containerId is not defined (or null).
 * In firame-mode, there is only one single item and opt_containerId is passed
 * with the containerId for that particular iframe.
 * 
 * @param  {Array.<Object>} items           Array of {assignmentId=<val>, itemid=<val>, type=<val>}
 * @param  {string=}        opt_containerId In iframe mode, the containerId.
 */
pearson.brix.Ipc.prototype.init = function(items,  opt_containerId)
{
    this.items = items;
    // Throw error if items is empty; 

    if (opt_containerId)
    {
        this.containerId = opt_containerId;
    }

    this.subscribeInitTopic();
};

/**
 * Must be exactly same as laspaf.js's 
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
pearson.brix.Ipc.prototype.activityBindingReplyTopic = function (item)
{
    return "init." + item.assignmentid
        + "." + item.itemid;
};

/**
 * Message structure as received to the initialization topic 
 * (message originated from AMS, @see laspaf.js):
message = {
    status: <fail | success>
    sourcemessage: <message when there was error>
    data: {
        asrequest: {
            url:
            method:
            header: {
                "Hub-Session": <data>
            },
            content: {
                "nodeIndex": <index>
                "targetBinding": <data>
            }
        }
    }
}
 */

/** 
 * Subscribes to initialization topic using the assignmentId and itemId
 */
pearson.brix.Ipc.prototype.subscribeInitTopic = function()
{
    var item;
    var that = this;
    // Iterate through items and subscribe
    for(var i = 0; i < this.items.length; i++)
    {
        item = this.items[i];

        // topic by virtue of closure
        var topic = this.activityBindingReplyTopic(item);
        this.eventManager.subscribe(topic, function(seqNodeIdntifier) {
            
            // Unsubscribe as initialization is no longer needed.
            this.eventManager.unsubscribe(topic, this);

            var activityConfig = ipsproxy.retrieveSequenceNode(seqNodeIdntifier, containerId); // Does the AJAX call to IPS

            //
            this.bricLayer.build(activityConfig);
        });
    }
};
