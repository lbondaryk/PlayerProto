/* **************************************************************************
 * $Workfile:: widget-slider.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the slider bric.
 *
 * The slider bric creates a Google Closure slider for setting a numerical value
 * from a range.
 *
 * Created on       April 15, 2013
 * @author          Leslie Bondaryk
 * @author          Michael Jay Lippert
 * @author          Greg Davis
 * @author          Young-Suk Ahn
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.Slider');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('goog.ui.Slider');

goog.require('pearson.utils.IEventManager');
goog.require('pearson.brix.HtmlBric');

// Sample Slider constructor configuration
(function()
{
    var sl1Config = {
            id: "slider1",
            startVal: 2.5,
            minVal: 0,
            maxVal: 5,
            stepVal: 0.1,
            unit: "&micro;m",
            label: "diameter: ",
            format: d3.format(String.fromCharCode(0x2007/*figure space*/) + '>5.2f'),
        };
});
    
/* **************************************************************************
 * Slider                                                              */ /**
 *
 * The slider widget creates a jQuery slider for setting a numerical value
 * from a range.
 * It publishes events to following topics:
 * <ID>_valueChanged - When the value was changed
 * <ID>_dragStart    - When the user starts dragging the thumb
 * <ID>_dragENd      - When the user stopped dragging the thumb
 *
 * @constructor
 * @extends {pearson.brix.HtmlBric}
 * @export
 *
 * @param {Object}      config          -The settings to configure this Slider
 * @param {string|undefined}
 *                      config.id       -String to uniquely identify this Slider.
 *                                       if undefined a unique id will be assigned.
 * @param {number}      config.startVal -starting value of slider
 * @param {number}      config.minVal   -minimum value of slider
 * @param {number}      config.maxVal   -maximum value of slider
 * @param {number}      config.stepVal  -step size of slider
 * @param {htmlString|undefined}
 *                      config.label    -text preceding the slider, optional
 * @param {htmlString|undefined}
 *                      config.unit     -text following the slider, optional
 * @param {function(number): string}
 *                      config.format   -{@link https://github.com/mbostock/d3/wiki/Formatting|formatting function}
 *                                       for displaying value in readout. 
 *                                       Set to null if does not want readout to be shown.
 * @param {number}
 *                      config.width    -The width of the slider in px.
 * @param {!pearson.utils.IEventManager=}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 *
 * @note: firefox doesn't support HTML5 sliders, they degrade to numeric input
 * fields.
 **************************************************************************/
pearson.brix.Slider = function (config, eventManager)
{
    // call the base class constructor
    goog.base(this);

    /**
     * A logger to help debugging 
     * @type {goog.debug.Logger}
     * @private
     */
    this.logger_ = goog.debug.Logger.getLogger('pearson.brix.Slider');

    /**
     * A unique id for this instance of the slider widget
     * @type {string}
     */
    this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.Slider);

    // TODO: These all need comments describing what they are. -mjl 5/16/2013
    this.startVal = config.startVal;
    this.minVal = config.minVal;
    this.maxVal = config.maxVal;
    this.stepVal = config.stepVal;

    /**
     * Text unit to display after the readout.  Currently for display only.
     * later could be used to multiply the value by a unit.
     * @type {string}
     */

    this.unit = config.unit;

    /**
     * Text to display before the readout and slider.  Currently for display only.
     * later could be used to multiply the value by a unit.
     * @type {string}
     */
    this.label = config.label;

    /**
     * Function to format the value of this slider for display by the readout.
     * @type { (function(number): string) | null}
     */
    this.format = (config.format) ? d3.format(config.format) : null;

    /**  
     * The width of the Slider in pixel
     * @type {number}
     */
    this.width = config.width || "200";

    /**
     * The event manager to use to publish (and subscribe to) events for this widget
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager || pearson.utils.IEventManager.dummyEventManager;

    /**
     * The event id (topic) published when the value of this slider changes.
     * @const
     * @type {string}
     */
    this.changedValueEventId = this.id + '_valueChanged';
    
    /**
     * The event id (topic) published when the handle starts dragging.
     * @const
     * @type {string}
     */
    this.dragStartEventId = this.id + '_dragStart';

    /**
     * The event id (topic) published when the handle stops dragging.
     * @const
     * @type {string}
     */
    this.dragEndEventId = this.id + '_dragEnd';

    /**
     * The event details for this.changedValueEventId events
     * @typedef {Object} ChangedValueEventDetails
     * @property {number} oldValue  -The previous value of this slider.
     * @property {number} newValue  -The new/current value of this slider.
     */

    /**
     * Information about the last drawn instance of this slider (from the draw method)
     * @type {Object}
     */
    this.lastdrawn =
        {
            /** @type {d3.selection} */     container: null,
            /** @type {Element} */          widgetGroup: null,
            /** @type {?number} */          value: null,
            /** @type {d3.selection} */     readOut: null,
            /** @type {goog.ui.Slider} */   sliderObj: null,
        };

    this.logger_.config('Slider with id:' + this.id + ' created.');
}; // end of slider constructor
goog.inherits(pearson.brix.Slider, pearson.brix.HtmlBric);

/**
 * Prefix to use when generating ids for instances of Slider.
 * @const
 * @type {string}
 */
pearson.brix.Slider.autoIdPrefix = "sldr_auto_";


/* **************************************************************************
 * Slider.draw                                                         */ /**
 *
 * The Slider allows the user to set a numeric value over some defined range.
 * @export
 *
 * @param {!d3.selection}   container   -The DOM element this slider will be
 *                                       created as the last child of.
 *
 ****************************************************************************/
pearson.brix.Slider.prototype.draw = function (container)
{
    this.lastdrawn.container = container;

    // Provide a reference to this Slider instance for use in any function expressions defined here.
    var that = this;

    // get the element from the d3 selection so we can use it w/ jQuery
    var cntrElement = container.node();

    //var readOut = $("<span class='readout'>" + this.format(this.startVal) + "</span>");

    // All widgets get a top level "grouping" element which gets a class identifying the widget type.
    var widgetGroup = container.append("div")
        .attr("class", "bricSlider-container")
        .attr("id", this.id);
    var widgetHeaderDiv = widgetGroup.append('div')
        .attr("class", "header");
    widgetHeaderDiv.append('span')
        .attr('role', 'label')
        .html(this.label ? this.label : "");
    var readOut = (this.format) ? widgetHeaderDiv.append('span')
            .attr("class", "readout")
            .html(this.format(this.startVal))
        : null;

    var googSliderDiv = widgetGroup.append("div")
        .attr("class", "bricSlider-widget goog-slider")
        .attr("style", "position:relative; display:inline-block; width: " + this.width + "px; height: 20px;");
    googSliderDiv.append('div') // rail (optional)
        .attr('class', 'bricSlider-rail bric-round-corner');
        // Below is sample from google site
        //.attr('style', "position:absolute;width:100%;top:9px;border:1px inset white; overflow:hidden;height:0");
    var thumbDiv = googSliderDiv.append('div')
        .attr('class', 'bricSlider-thumb goog-slider-thumb bric-round-corner');

    var trackDiv = widgetGroup.append("div")
        .attr("class", "track");
    trackDiv.append('div')
        .attr('class', 'range')
        .attr('style', 'float:right')
        .html(this.maxVal);
    trackDiv.append('div')
        .attr('class', 'range')
        .html(this.minVal);

    var sliderEl = googSliderDiv.node();

    this.lastdrawn.value = this.startVal;
    this.lastdrawn.widgetGroup = widgetGroup;
    this.lastdrawn.readOut = readOut;

    var googSlider = new goog.ui.Slider;

    googSlider.setValue(this.startVal);
    googSlider.setMinimum(this.minVal);
    googSlider.setMaximum(this.maxVal);
    if (this.stepVal)
    {
        googSlider.setStep(this.stepVal);
    }
    googSlider.decorate(sliderEl);
    googSlider.setMoveToPointEnabled(true); // Allows to go to specific point when tapped over the rail

    googSlider.listen(goog.ui.Component.EventType.CHANGE, function() {
        // This publishes the CHANGE event to the eventManager
        // passing along the updated value in the numeric field.
        var newVal = googSlider.getValue();

        if (readOut)
        {
            readOut.text(that.format(newVal));
        }
        // we want to publish the changedValue event after the value has been changed
        var oldVal = that.lastdrawn.value;
        that.lastdrawn.value = newVal;
        that.logger_.finer('Publishing to ' + that.changedValueEventId);
        that.eventManager.publish(that.changedValueEventId,
                        {oldValue: oldVal, newValue: newVal});
    });

    googSlider.listen(goog.ui.SliderBase.EventType.DRAG_START, function() {
        that.logger_.fine('Publishing to ' + that.dragStartEventId);
        that.eventManager.publish(that.dragStartEventId,
            {value: googSlider.getValue()});
    });
    
    googSlider.listen(goog.ui.SliderBase.EventType.DRAG_END, function() {
        that.logger_.fine('Publishing to ' + that.dragEndEventId);
        that.eventManager.publish(that.dragEndEventId,
            {value: googSlider.getValue()});
    });
    this.lastdrawn.sliderObj = googSlider;

}; // end of Slider.draw()

/* **************************************************************************
 * Button.setEnabled                                                   */ /**
 *
 * This method sets the current enable state of the button.
 * @export
 *
 * @param {boolean} newEnableState  -true to enable the button, false to disable it.
 *
 **************************************************************************/
pearson.brix.Slider.prototype.setEnabled = function (newEnableState)
{
    if (!this.lastdrawn.sliderObj)
    {
        // If not drawn yet, nothing to do
        return;
    }
    var stateChanged = this.lastdrawn.sliderObj.isEnabled() !== newEnableState;

    if (stateChanged && this.lastdrawn.widgetGroup)
    {
        this.lastdrawn.sliderObj.setEnabled(newEnableState);
    }
};

/* **************************************************************************
 * Slider.getValue                                                     */ /**
 *
 * The getValue method returns the current value of this Slider bric.
 * @export
 *
 * @return {number} current value of this Slider.
 ****************************************************************************/
pearson.brix.Slider.prototype.getValue = function ()
{
    // The value held by the jQuery slider may not be the value of this slider
    // bric because we update during the jQuery's slide event which is before
    // the jQuery slider updates its value.
    //var jSlider = $("span.slider", this.lastdrawn.widgetGroup);
    //return jSlider.slider("value");
    return this.lastdrawn.value;
};

/* **************************************************************************
 * Slider.setValue                                                     */ /**
 *
 * The setValue method sets the value of this Slider bric.
 * This does NOT fire the changedValue event.
 * @export
 *
 * @note: should it fire the changedValue event? -mjl
 *
 * @param {number} newValue -The new value for the widget
 *
 * @return {number} old value of this Slider before it was set to the new value.
 ****************************************************************************/
pearson.brix.Slider.prototype.setValue = function (newValue)
{
    var oldValue = this.lastdrawn.value;

    /*
    // The addEventListener(CHANGE) is called when sliderObj.setValue is called below
    // There is no need to set the readout again.
    */
    this.lastdrawn.sliderObj.setValue(newValue);

    return oldValue;
};
