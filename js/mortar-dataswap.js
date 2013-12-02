/* **************************************************************************
 * $Workfile:: mortar-dataswap.js                                           $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link pearson.brix.mortar.Dataswap} mortar.
 *
 * Created on       November 22, 2013
 * @author          Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.mortar.Dataswap');

goog.require('pearson.brix.mortar.Mortar');
goog.require('pearson.brix.Bric');
goog.require('pearson.utils.IEventManager');

/* **************************************************************************
 * Dataswap                                                            */ /**
 *
 * Constructor function for Dataswap instances.
 *
 * @constructor
 * @extends {pearson.brix.mortar.Mortar}
 * @export
 *
 * @param {Object}      config            -The settings to configure this Dataswap
 * @param {string|undefined}
 *                      config.id         -String to uniquely identify this Dataswap.
 *                                         if undefined a unique id will be assigned.
 * @param {string}      config.topic      -The topic of the event that should be responded
 *                                         to by swapping data on the target bric.
 * @param {string}      config.eventDetailsProperty
 *                                        -The name of the property of the eventDetails
 *                                         event argument that determines which element
 *                                         from the data source array is sent to the
 *                                         target bric.
 * @param {number|undefined}
 *                      config.valueBase  -A numeric event property should have a range,
 *                                         this is the starting value of that range.
 *                                         default is 0.
 * @param {number|undefined}
 *                      config.valueStep  -The index determined from a numeric event
 *                                         property may consider the values to be in
 *                                         discreet steps other than 1. If this is the
 *                                         case, this is that step value.
 *                                         default is 1.
 * @param {!Array.<string>|undefined}
 *                      config.keyArray   -The array of keys used to determine the index
 *                                         when the event property is a string.
 *                                         If the keyArray is given it is assumed that
 *                                         the event property is a string, if it is not
 *                                         defined the event property is assumed to be a
 *                                         number.
 * @param {!pearson.brix.Bric}
 *                      config.targetBric -Bric instance whose data is to be swapped
 * @param {string}      config.dataPropertySetter
 *                                        -Name of the setter method that will be called
 *                                         with the new data.
 * @param {Array.<*>|undefined}
 *                      config.initialSetterArgs
 *                                        -Array of the initial arguments to the property
 *                                         setter method (the new data will be appended to
 *                                         this array, and the property setter called w/
 *                                         Function.apply().
 * @param {!Array.<*>}  config.sourceDataArray
 *                                        -The array of data elements that are swapped in
 *                                         to the targetBric depending on the index
 *                                         determined from the event property.
 * @param {!pearson.utils.IEventManager=}
 *                      eventManager      -The event manager to use for publishing events
 *                                         and subscribing to them.
 *
 * @classdesc
 * A Dataswap mortar responds to events of one Bric by determining an index
 * into a data source array and setting that data element on a target bric.
 * It can determine the index either from a stepped numeric value in a range (such
 * as that used by a slider) or from a string value where the index is determined
 * from the position of that string in a given array of strings.
 *
 ****************************************************************************/
pearson.brix.mortar.Dataswap = function (config, eventManager)
{
    // call the base class constructor
    goog.base(this);

    /**
     * Logger for this Bric
     * @private
     * @type {goog.debug.Logger}
     */
    this.logger_ = goog.debug.Logger.getLogger('pearson.brix.mortar.Dataswap');

    /**
     * The id of this Dataswap mortar instance, as specified in the config.
     * @private
     * @type {string|undefined}
     */
    this.dswapId_ = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.mortar.Dataswap);

    /**
     * The event topic to handle by setting data determined by the event details
     * on the given Bric.
     * @private
     * @type {string}
     */
    this.topic_ = config['topic'];

    /**
     * The property name in the handled event's eventDetails to use
     * to determine the index of the data element to set on the target bric.
     * @private
     * @type {string}
     */
    this.edPropName_ = config['eventDetailsProperty'];

    /**
     * The target bric instance whose data is to be swapped.
     * @private
     * @type {!pearson.brix.Bric}
     */
    this.targetBric_ = config['targetBric'];

    /**
     * The name of the method of the target bric to call to set
     * the new data on that bric.
     * @private
     * @type {string}
     */
    this.dataSetterName_ = config['dataPropertySetter'];

    if (!(this.dataSetterName_ in this.targetBric_) || typeof this.targetBric_[this.dataSetterName_] !== 'function')
    {
        this.logger_.severe('data setter is not a method on the target bric');
    }

    /**
     * The initial arguments (before the new data) to be passed
     * to the data property setter of the target bric.
     * @type {!Array.<*>}
     */
    this.dataSetterInitialArgs_ = config['initialSetterArgs'] || [];

    /**
     * The array of data elements that may be set on the target bric.
     * @private
     * @type {!Array.<*>}
     */
    this.dataSource_ = config['sourceDataArray'];

    if (!this.dataSource_)
    {
        this.logger_.severe('sourceDataArray is not an array');
    }

    /**
     * The base value of the range that is used when converting a numeric
     * event details value to an index.
     * @private
     * @type {number}
     */
    this.valueBase_ = config['valueBase'] !== undefined ? config['valueBase'] : 0;

    /**
     * The step value that is used when converting a numeric event
     * details value to an index.
     * @private
     * @type {number}
     */
    this.valueStep_ = config['valueStep'] !== undefined ? config['valueStep'] : 1;

    /**
     * The array of keys whose order determines the index when the event
     * details value is a string. If this array exists the event details
     * value must be a string and if it is undefined it must be a number.
     * @private
     * @type {!Array.<string>|undefined}
     */
    this.keyArray_ = config['keyArray'];

    var eventPropIsString = this.keyArray_ !== undefined;

    /**
     * The method to use to get the index from the event details value.
     * @private
     * @type {!function((string|number)): number}
     */
    this.getIndex_ = eventPropIsString ? this.stringValueToIndex_ : this.numericValueToIndex_;

    // log the configuration of this mortar
    var configMsg =
        [ '',
          'initial property values for Dataswap id: ' + this.dswapId_,
          '\ttopic: ' + this.topic_,
          '\tedPropName: ' + this.edPropName_,
          '\teventPropType: ' + (eventPropIsString ? 'string' : 'number'),
          '\ttargetBric.getId(): ' + this.targetBric_.getId(),
          '\tdataSetterName: ' + this.dataSetterName_,
          '\tdataSource: contains ' + this.dataSource_.length + ' elements',
          '\tvalueBase: ' + this.valueBase_,
          '\tvalueStep: ' + this.valueStep_,
          '\tkeyArray: contains ' + (this.keyArray_ !== undefined ? this.keyArray_.length : -1) + ' elements'
        ];
    this.logger_.config(configMsg.join('\n'));

    /**
     * The event manager to use to publish (and subscribe to) events for this mortar
     * @private
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager_ = eventManager || pearson.utils.IEventManager.dummyEventManager;

    // Set up the event subscription
    this.eventManager_.subscribe(this.topic_, goog.bind(this.handleEvent_, this));
};
goog.inherits(pearson.brix.mortar.Dataswap, pearson.brix.mortar.Mortar);

/**
 * Prefix to use when generating ids for instances of Dataswap.
 * @const
 * @type {string}
 */
pearson.brix.mortar.Dataswap.autoIdPrefix = 'dataswap_auto_';

/* **************************************************************************
 * Dataswap.handleEvent_                                               */ /**
 *
 * Handler for the event which triggers the data swap, ie setting the
 * new data on the target bric.
 * @private
 *
 * @param {Object}  eventDetails        -The details of the event.
 *
 ****************************************************************************/
pearson.brix.mortar.Dataswap.prototype.handleEvent_ = function (eventDetails)
{
    var index = this.getIndex_(eventDetails[this.edPropName_]);
    this.logger_.finer('eventDetails.' + this.edPropName_ + ': ' + eventDetails[this.edPropName_] + ' = index: ' + index);

    var args = this.dataSetterInitialArgs_.slice(0);
    args.push(this.dataSource_[index]);
    this.targetBric_[this.dataSetterName_].apply(this.targetBric_, args);
};

/* **************************************************************************
 * Dataswap.numericValueToIndex_                                       */ /**
 *
 * Convert the given numeric value into an index using the base and step
 * values.
 *
 * @param {number} value    -The numeric value to convert to an index
 *
 ****************************************************************************/
pearson.brix.mortar.Dataswap.prototype.numericValueToIndex_ = function (value)
{
    return Math.round((value - this.valueBase_) / this.valueStep_);
};

/* **************************************************************************
 * Dataswap.stringValueToIndex_                                        */ /**
 *
 * Convert the given string value into an index by looking it up in the
 * key array.
 *
 * @param {string} value    -The string value to convert to an index
 *
 ****************************************************************************/
pearson.brix.mortar.Dataswap.prototype.stringValueToIndex_ = function (value)
{
    return this.keyArray_.indexOf(value);
};

