/* **************************************************************************
 * $Workfile:: ipc.js                                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview The Brix Item Player Client (IPC).
 *
 * The IPC is responsible listening for an initialization message that
 * is expected to be published by the AMC (Activity Manager Client),
 * using information in that message to retrieve brix configuration
 * specific to it's container (either the whole document or a container
 * iframe) and instantiating the brix defined in that configuration.
 *
 * Message structure as received from the AMC through EventManager 
 * message = {
 *     status: <fail | success>
 *     sourcemessage: <message when there was error>
 *     data: {
 *         asrequest: {
 *             url: <url>
 *             method: <GET | POST>
 *             header: {
 *                 "Hub-Session": <data>
 *             },
 *             content: {
 *                 "nodeIndex": <index>
 *                 "targetBinding": <data>
 *             }
 *         }
 *     }
 * }
 * The 'asrequest' field represents the sequenceNodeIdentifier
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
 * The IPC (Item Player Client) listens for AMC's (Activity Manager Client)
 * sequenceNodeIdentifier. Upon receipt of the sequenceNodeIdentifier,
 * it retrieves the brix' containerConfig from IPS and 
 * instantiates and wires the brix and mortars using the BricLayer.
 *
 * @constructor
 * @export
 *
 * @param {Object}      config          - The settings to configure the Ipc
 * @param {!pearson.utils.IEventManager}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 *
 ****************************************************************************/
pearson.brix.Ipc = function (config, eventManager)
{
    if (!config.ipsBaseUrl)
    {
        throw new Error('IPS server URL not provided.');
    }
    
    /**
     * The event manager to use to publish (and subscribe to) events
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager;

    /**
     * The IpsProxy instance
     * @type {pearson.brix.IpsProxy}
     */
    this.ipsProxy = new pearson.brix.IpsProxy({"serverBaseUrl": config.ipsBaseUrl});

    var bricLayerConfig = null;

    /**
     * The BricLayer instance
     * @todo - Check if it changes to singleton
     * @type {!pearson.brix.BricLayer}
     */
    this.bricLayer = new pearson.brix.BricLayer(bricLayerConfig, eventManager);
};

/**
 * Array of {assignmenturl=<val>, activityurl=<val>, type=<val>}
 * 
 * @type {!Array.<Object>} items
 */
pearson.brix.Ipc.items = [];

/**
 * The container ID is used in the iframe mode.
 * Having a value will make the IPC to retrieve a specific conatinerId 
 * from the IPS.
 * @type {string}
 */
pearson.brix.Ipc.containerId = null;

/* **************************************************************************
 * Ipc.init                                                            */ /**
 *
 * Initializes the IPC depending on the different parameters are passed.
 * The different parameters defines the mode: div or iframe.
 * In div-mode, the items contains an array of possibly multiple items, and 
 * the optional opt_containerId is not defined (or null).
 * In iframe-mode, there is only one single item and opt_containerId is passed
 * with the containerId for that particular iframe.
 * @export
 * 
 * @param  {!Array.<Object>} items            Array of {assignmentId=<val>, itemid=<val>, type=<val>}
 * @param  {string=}         opt_containerId  The containerId that this IPC is
 *                                            handling. Only in iframe mode.
 *                                            Should be undefined (or null) in div mode.
 ****************************************************************************/
pearson.brix.Ipc.prototype.init = function (items, opt_containerId)
{
    if (!items || items.length === 0)
    {
        throw new Error('Items should be valid array.');
    }
    this.items = items;

    this.subscribeInitTopic();

    var that = this;
    if (opt_containerId)
    {
        // There should be only one element in the items
        if (this.items.length != 1)
        {
            throw new Error('In the iframe mode, there should be only one item but '
                + this.items.length + ' were provided.');
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

/* **************************************************************************
 * Ipc.activityBindingReplyTopic                                       */ /**
 *
 * Returns the topic name for the init event subscription.
 * Must be exactly same as laspaf.js's 
 * 
 * @param  {Object} message  An object that represents an item.
 *                           assignmenturl and activityurl properties are required.
 * 
 * @return {string}          The topic name
 ****************************************************************************/
pearson.brix.Ipc.prototype.activityBindingReplyTopic = function (item)
{
    if (!item.assignmenturl || !item.activityurl)
    {
        throw new Error('Invalid argument required properties "assignmenturl" or "activityurl" not found.');
    }
    return "init." + item.assignmenturl
        + "." + item.activityurl;
};


/* **************************************************************************
 * Ipc.subscribeInitTopic                                              */ /**
 *
 * Subscribes to initialization topic using the provided item(s) information 
 * (formerly known as itemId)
 ****************************************************************************/
pearson.brix.Ipc.prototype.subscribeInitTopic = function ()
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
        // the topic is used to unsubscribe in the following lines
        (function(topic) {
            that.eventManager.subscribe(topic, function(sequenceNodeIdentifier) {
                
                // Unsubscribe, initialization is no longer needed.
                that.eventManager.unsubscribe(topic, this);

                var date = new Date();
                var seqNodeRequestMessage = {
                    sequenceNodeIdentifier: sequenceNodeIdentifier,
                    timestamp: date.toISOString(),
                    type: "initialization",
                    body: {}
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
