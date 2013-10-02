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

    /**
     * The IpsProxy instance
     * @type {pearson.brix.IpsProxy}
     */
    this.ipsProxy = new pearson.brix.IpsProxy({"serverBaseUrl":"http://localhost:8088"});

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
 * Having a value will make the IPC to retrieve a specific conatinerId 
 * from the IPS.
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

    this.subscribeInitTopic();

    var that = this;
    if (opt_containerId)
    {
        // There should be only one element in the items
        if (this.items.length != 1)
        {
            throw new Error('In the iframe mode, there should only be one item but '
                + this.items.length + ' were provided');
        }
        
        // This means that we are in Iframe mode
        this.containerId = opt_containerId;

        // IPS shall also subscribe to "pageLoaded" event that is originated 
        // from the master page
        this.eventManager.subscribe('__system_pageLoaded', function(message) {

            for (var i=0; i < that.items.length; i++)
            {
                var reqSeqNodeIdentifierMsg = {
                    type: "requestbinding",
                    replytopic : that.activityBindingReplyTopic(items[i]),
                    data : {
                        assignmenturl: items[i].assignmenturl,
                        activityurl: items[i].activityurl
                    }
                };
                that.eventManager.publish('AMC', reqSeqNodeIdentifierMsg);
            }
        });
    }
};

/**
 * Must be exactly same as laspaf.js's 
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
pearson.brix.Ipc.prototype.activityBindingReplyTopic = function (item)
{
    return "init." + item.assignmenturl
        + "." + item.activityurl;
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
 * Subscribes to initialization topic using the assignmentId and activityId 
 * (formerly known as itemId)
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
        var currTopic = this.activityBindingReplyTopic(item);

        // Anonymous function to create a scope for the currTopic to live as closure.
        // the topic is used to unsubscribe later 
        (function(topic) {
            that.eventManager.subscribe(topic, function(sequenceNodeIdentifier) {
                
                // Unsubscribe as initialization is no longer needed.
                that.eventManager.unsubscribe(topic, this);

                var date = new Date();
                var seqNodeRequestMessage = {
                    sequenceNodeIdentifier: sequenceNodeIdentifier,
                    timestamp: date.toISOString(),
                    type: "initialization",
                    body: {
                    }
                };
                // add containerId if exists (e.g. Iframe mode)
                if (that.containerId)
                {
                    seqNodeRequestMessage.body.containerId = that.containerId;
                }

                var activityConfig = that.ipsProxy.retrieveSequenceNode(seqNodeRequestMessage); // Does the AJAX call to IPS

                // Build the building!
                that.bricLayer.build(activityConfig);
            });
        })(currTopic);
    }
};
