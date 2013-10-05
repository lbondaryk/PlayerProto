/* **************************************************************************
 * $Workfile:: ipc.js                                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview The Brix Item Player Client (IPC).
 *
 * The IPC is responsible listening for AMC for initialization message,
 * retrieving containerConfig information and instantiating brix defined 
 * in the containerConfig.
 *
 * Message structure as received By IPC from the AMC through EventManager 
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
 * The IPC listens for AMC's sequenceNodeIdentifier. Upon receipt of the 
 * sequenceNodeIdentifier, it retrieves the brix' containerConfig from IPS and 
 * instantiates and wires the brix and mortars using the BrixLayer.
 *
 * @constructor
 * @export
 *
 * @param {Object}      config          - The settings to configure this SelectGroup
 * @param {!pearson.utils.IEventManager}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 *
 ****************************************************************************/
pearson.brix.Ipc = function (config, eventManager)
{
    /**
     * The event manager to use to publish (and subscribe to) events for this widget
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager;

    if (!config.ipsBaseUrl)
    {
        throw new Error('IPS server URL not provided.');
    }
    
    /**
     * The IpsProxy instance
     * @type {pearson.brix.IpsProxy}
     */
    this.ipsProxy = new pearson.brix.IpsProxy({"serverBaseUrl":config.ipsBaseUrl});

    var bricLayerConfig = null;

    /**
     * The BrixLayer instance
     * @todo - Check if it changes to singleton
     * @type {!pearson.brix.BrixLayer}
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

/**
 * Initializes the IPC depending on the different parameters are passed.
 * The different parameters defines the mode: div or iframe.
 * In div-mode, the items contains an array of possibly multiple items, and 
 * the optional opt_containerId is not defined (or null).
 * In iframe-mode, there is only one single item and opt_containerId is passed
 * with the containerId for that particular iframe.
 * 
 * IMPORTANT: The Ipc.init() should be called prior AMC's initialization.
 *            This is because IPC mus have subscribed before AMC publishes
 *            init messages.
 *             
 * @export
 * 
 * @param  {!Array.<Object>} items            Array of {assignmentId=<val>, itemid=<val>, type=<val>}
 * @param  {string=}         opt_containerId  The containerId that this IPC is
 *                                            handling. Only in iframe mode.
 *                                            Should be undefined (or null) in div mode.
 */
pearson.brix.Ipc.prototype.init = function (items, opt_containerId)
{
    if (!items || items.length === 0)
    {
        throw new Error('Items should be valid array.');
    }
    this.items = this.normalizeByTopic(items);

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
        this.eventManager.subscribe('__system_pageLoaded', function (message) {

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
 * Returns the array where the redundant topic combination are removed.
 * For example array has:
 * [{assignmenturl="A", activityurl="B", containerid="rector"}
 * ,{assignmenturl="A", activityurl="B", containerid="step"}
 * ,{assignmenturl="A", activityurl="C", containerid="slider"}]
 * Then the array is merged as
 * [{assignmenturl="A", activityurl="B"}
 * ,{assignmenturl="A", activityurl="C", containerid="slider"}]
 * Notice that the repeated combination of assignmenturl="A", activityurl="B" were
 * merged into one.
 * This will guarantee that the bricLayer calls build() only once per same sequence node.
 * 
 * @param  {!Array.<Object>} items  Array of {assignmentId=<val>, itemid=<val>, type=<val>}
 * @return {!Array.<Object>}        Normalized array.
 */
pearson.brix.Ipc.prototype.normalizeByTopic = function (items)
{
    // Dictionary to check for duplicates
    var dictionary = {};

    var result = [];
    for (var i=0; i < items.length; i++)
    {
        var topic = this.activityBindingReplyTopic(items[i]);
        var entryDic = dictionary[topic];
        if (entryDic)
        {
            if (entryDic.counter == 1)
            {
                // From the first element, remove the attributes other than those used for topics
                result[entryDic.firstIndex] = {
                    assignmenturl: result[entryDic.firstIndex].assignmenturl,
                    activityurl: result[entryDic.firstIndex].activityurl
                };
            }
            entryDic.counter++;
        }
        else
        {
            // It not found in the dictionary, push to the result array
            dictionary[topic] = {firstIndex: result.length, counter:1};
            result.push(items[i]);
        }
    }
    return result;
};

/**
 * Returns the topic name for the init event subscription.
 * Must be exactly same as laspaf.js's 
 * 
 * @param  {Object} message  An object that represents an item.
 *                           assignmenturl and activityurl properties are required.
 * 
 * @return {string}          The topic name
 */
pearson.brix.Ipc.prototype.activityBindingReplyTopic = function (item)
{
    if (!item.assignmenturl || !item.activityurl)
    {
        throw new Error('Invalid argument required properties "assignmenturl" or "activityurl" not found.');
    }
    return "init." + item.assignmenturl
        + "." + item.activityurl;
};


/** 
 * Subscribes to initialization topic using the provided item(s) information 
 * (formerly known as itemId)
 */
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
            that.eventManager.subscribe(topic, function(initMessage) {
                
                if (initMessage.status != 'success')
                {
                    console.log("initMessage returned error status. " + JSON.stringify(initMessage.sourcemessage));
                }
                else
                {
                    // Unsubscribe, initialization is no longer needed.
                    that.eventManager.unsubscribe(topic, this);

                    var date = new Date();
                    var seqNodeRequestMessage = {
                        sequenceNodeIdentifier: initMessage.data.asrequest,
                        timestamp: date.toISOString(),
                        type: "initialization",
                        body: {}
                    };
                    // add containerId if exists (e.g. Iframe mode)
                    if (that.containerId)
                    {
                        seqNodeRequestMessage.body.containerId = that.containerId;
                    }

                    that.ipsProxy.retrieveSequenceNode(seqNodeRequestMessage, function (error, result){
                        // Build the building!
                        if (error)
                        {
                            // Handle server error
                            console.log("ERROR on retrieveSequenceNode: "+ JSON.stringify(error));
                        }
                        else
                        {
                            // in the absence of error, result is containerConfig
console.log("** ContainerConfig: "+JSON.stringify(result.data.containerConfig));
                            that.bricLayer.build(result.data.containerConfig);
                        }
                    }); // Does the AJAX call to IPS

                }
                
            });
        })(currTopic);
    }
};
