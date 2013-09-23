/* **************************************************************************
 * $Workfile:: ipsproxy.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview Abstracts the communication with IPS.
 *
 * The IPSProxy encapsulates series of methods that wraps around AJAX calls
 * to remote IPS.
 *
 * Created on		Sept 19, 2013
 * @author			Young-Suk Ahn
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
goog.provide('pearson.brix.IpsProxy');

goog.require("goog.net.XhrIo");


/* **************************************************************************
 * IpsProxy                                                         */ /**
 *
 * The IPSProxy encapsulates series of methods that wraps around AJAX calls
 * to remote IPS.
 *
 * @constructor
 * @export
 *
 * @param {Object}      config          - The settings to configure this SelectGroup
 * @param {string|undefined}
 *                      config.baseUrl      - The URL to the IPS server.
 *
 ****************************************************************************/
pearson.brix.IpsProxy = function (config)
{
    this.serverBaseUrl = config.baseUrl;
};

/**
 * The server base url
 * @type {String}
 */
pearson.brix.IpsProxy.serverBaseUrl = null;


/* **************************************************************************
 * Retrieves sequence node
 * @export
 * 
 * @param  {Object}   param     Parameter that containing 
 * @param  {Function} callback  Function that is called when the async operation
 *                              is completed. The signature should be:
 *                              fn(error, result).
 * @return {[type]}
 */
pearson.brix.IpsProxy.prototype.checkHealth = function (callback)
{

    var xhr = new goog.net.XhrIo();
    var ajaxCallback = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);

        var error = null;
        var result = null;

        if (xhr.isSuccess()) {
            result = xhr.getResponseJson();
        }
        else
        {
            error = {
                message: xhr.getLastError(),
                status: xhr.getStatus()
            };
        }
        callback(error, result);
    };

    // Another way of requesting is creating an XhrIo instance
    // passing it to goog event listner as
    // goog.events.listenOnce(xhr, goog.net.EventType.COMPLETE, function(e) {...}
    // and the do the actual send on the instance.
    goog.net.XhrIo.send(this.serverBaseUrl + '/healthInfo', ajaxCallback, 'GET');
};

/* **************************************************************************
 * Retrieves sequence node
 * @export
 * 
 * @param  {Object}   param     Parameter that contains message to be passed
 *                              to the server as request body. 
 *                               
 * @param  {Function} callback  Function that is called when the async operation
 *                              is completed. The signature should be:
 *                              fn(error, result).
 * @return {[type]}
 */
pearson.brix.IpsProxy.prototype.retrieveSequenceNode = function (param, callback)
{
    this.postMessage_(this.serverBaseUrl + '/sequencenodes', param, callback);
};

/* **************************************************************************
 * Posts interaction data to server
 * @export
 * 
 * @param  {Object}   param     Parameter that contains message to be passed
 *                              to the server as request body. 
 *                               
 * @param  {Function} callback  Function that is called when the async operation
 *                              is completed. The signature should be:
 *                              fn(error, result).
 * @return {[type]}
 */
pearson.brix.IpsProxy.prototype.postInteraction = function (param, callback)
{
    this.postMessage_(this.serverBaseUrl + '/sequencenodes/' + param.sequenceNodeKey + '/interactions', param, callback);
};

/* **************************************************************************
 * Posts submission data to server
 * @export
 * 
 * @param  {Object}   param     Parameter that contains message to be passed
 *                              to the server as request body. 
 *                               
 * @param  {Function} callback  Function that is called when the async operation
 *                              is completed. The signature should be:
 *                              fn(error, result).
 * @return {[type]}
 */
pearson.brix.IpsProxy.prototype.postSubmission = function (param, callback)
{
    this.postMessage_(this.serverBaseUrl + '/sequencenodes/' + param.sequenceNodeKey + '/submissions', param, callback);
};

/* **************************************************************************
 * Retrieves sequence node
 * 
 * @param  {Object}   param     Parameter that contains message to be passed
 *                              to the server as request body. 
 *                               
 * @param  {Function} callback  Function that is called when the async operation
 *                              is completed. The signature should be:
 *                              fn(error, result).
 * @return {[type]}
 */
pearson.brix.IpsProxy.prototype.postMessage_ = function (url, param, callback)
{
    var xhr = new goog.net.XhrIo();
    var ajaxCallback = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);

        var error = null;
        var result = null;

        if (xhr.isSuccess()) {
            var response = xhr.getResponseJson();
            result = response;
        }
        else
        {
            error = {
                message: xhr.getLastError(),
                status: xhr.getStatus()
            };
            result = xhr.getResponseJson();
        }
        callback(error, result);
    };

    var message = JSON.stringify(param);

    // Another way of requesting is creating an XhrIo instance
    // passing it to goog event listner as
    // goog.events.listenOnce(xhr, goog.net.EventType.COMPLETE, function(e) {...}
    // and the do the actual send on the instance.    
    goog.net.XhrIo.send(url, ajaxCallback, 'POST',
                        message, {"Content-Type": "application/json" });
};