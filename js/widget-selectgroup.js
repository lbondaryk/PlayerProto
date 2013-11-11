/* **************************************************************************
 * $Workfile:: widget-selectgroup.js                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the SelectGroup widget.
 *
 * The SelectGroup widget draws a list of choices and allows the user to
 * select one of the choices.
 *
 * Created on       June 12, 2013
 * @author          Leslie Bondaryk
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.SelectGroup');

goog.require('pearson.utils.IEventManager');
goog.require('pearson.brix.HtmlBric');

// Sample configuration objects for classes defined here
(function()
{
    var Q1Choices =
    [
        {
            content: "Dewatering and hydrofracking",
            answerKey: "correct",
            key: "litemeUp"
        },
        {
            content: "Dewatering and mining",
            response: "Mining is a term generally used to apply to removing solids from the ground.",
            answerKey: "wrong1"
        },
        {
            content: "Hydrofracking and gas distillation",
            response: "Distillation refers to the refinement of gas, not extraction.",
            answerKey: "wrong2"

        },
        {
            content: "Dewatering and coalbed methane leaching",
            response: "Coalbed leaching is an older technique.",
            answerKey: "wrong3"
        }
    ];

    // Select widget config
    var selConfig =
        {
            //id: "SEL1",
            choices: Q1Choices,
        };

    // SelectQuestion widget config
    var sqConfig =
    {
        id: "Q1",
        question: "<span id='selTarget'></span> are two examples of new tchniques being used to extract natural gas.",
        choices: Q1Choices,
        type: "randomized", //default, even if not specified
    };
});

/**
 * choices are presented through dropdown widgets that allow the user to
 * select one (or more of them). Nominally they need content.  But if they are
 * configured as a question they need an answerKey to go with each choice.  As with
 * other brix, they can optionally have an associative highlighting key.
 *
 * @typedef {Object} pearson.brix.Answer
 * @property {string}   content     -The content of the answer, which presents the
 *                                   meaning of the answer.
 * @property {string}   response    -The response is presented to the user when
 *                                   they choose/submit this answer.
 * @property {string}   answerKey   -This is the unique ID that will be returned
 *                                   to the scoring engine to identify that the
 *                                   user has chosen this answer
 * @property {string|undefined} key         -highlighting key saying which to select and which
 *                                   other things to select on the page.
 *
 * @todo: response isn't really used here, it comes from the answer database.
 * @todo: One important use of select is as a quiz-me version of a labeled diagram
 * or image.  We will need to layer these on top of SVG objects in SVG pixel positions.
 */
pearson.brix.Answer;


/* **************************************************************************
 * SelectGroup                                                         */ /**
 *
 * The SelectGroup widget draws a list of choices and allows the user to
 * select one of the choices.
 *
 * @constructor
 * @extends {pearson.brix.HtmlBric}
 * @export
 *
 * @param {Object}      config          -The settings to configure this SelectGroup
 * @param {string|undefined}
 *                      config.id       -String to uniquely identify this SelectGroup.
 *                                       if undefined a unique id will be assigned.
 * @param {!Array.<!pearson.brix.Answer>}
 *                      config.choices  -The list of choices to be presented by the SelectGroup.
 *
 * @param {boolean}     config.question -A flag indicating whether the bric is
 *                                      to be configured as a question to the student
 * @param {!pearson.utils.IEventManager=}
 *                      eventManager    -The event manager to use for publishing events
 *                                       and subscribing to them.
 *
 ****************************************************************************/
pearson.brix.SelectGroup = function (config, eventManager)
{
    // call the base class constructor
    goog.base(this);

    /**
     * A unique id for this instance of the radio group widget
     * @type {string}
     */
    this.id = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.SelectGroup);

    /**
     * The list of choices presented by the RadioGroup.
     * @type {!Array.<!pearson.brix.Answer>}
     */
    this.choices = config.choices;

    this.question = config.question;

    /**
     * The event manager to use to publish (and subscribe to) events for this widget
     * @type {!pearson.utils.IEventManager}
     */
    this.eventManager = eventManager || pearson.utils.IEventManager.dummyEventManager;

    /**
     * The event id published when an item in this carousel is selected.
     * @const
     * @type {string}
     */
    this.selectedEventId = this.id + '_option';

    /**
     * The event details for this.selectedEventId events
     * @typedef {Object} SelectedEventDetails
     * @property {string} selectKey -The answerKey associated with the selected answer.
     */
    var SelectedEventDetails;

    /**
     * Information about the last drawn instance of this button (from the draw method)
     * @type {Object}
     */
    this.lastdrawn =
        {
            container: null,
            widgetGroup: null,
            options: null,
            choiceSelected: null,
        };
}; // end of SelectGroup constructor
goog.inherits(pearson.brix.SelectGroup, pearson.brix.HtmlBric);

/**
 * Prefix to use when generating ids for instances of SelectGroup.
 * @const
 * @type {string}
 */
pearson.brix.SelectGroup.autoIdPrefix = "sg_auto_";

/* **************************************************************************
 * SelectGroup.draw                                                    */ /**
 *
 * Draw this SelectGroup in the given container.
 *
 * @param {!d3.selection}
 *                  container   -The container html element to which we
 *                              append the select element tree.
 *
 ****************************************************************************/
pearson.brix.SelectGroup.prototype.draw = function (container)
{
    this.lastdrawn.container = container;

    var that = this;

    // make a span to hold the select group
    // these are often used inline in sentences, so we don't want a block element.
    var widgetGroup = container.append("span")
        .attr("class", "widgetSelectGroup")
        .attr("id", this.id);

    this.lastdrawn.widgetGroup = widgetGroup;

    var selectTag = widgetGroup.append("select")
                        .attr("name", this.id)
                        //set the width to auto so it sizes to content
                        .style("width","auto");

    // Create the options from the choices data
    var options = selectTag.selectAll("option").data(this.choices);

    options.enter().append("option")
            //use html to populate the options so any markup is retained
            .html(function(d) {return d.content});

    // autokey entries which have no key with the data index
    options.each(function (d, i) {
                    // if there is no key assigned, make one from the index
                    d.key = 'key' in d ? d.key : i.toString();
                    });

    options.attr("value", function (d) {return d.key;});

    selectTag.on('change',
                function ()
                {
                    that.eventManager.publish(that.selectedEventId, {
                        // the selected key is in the value, so figure out
                        // which entry you picked, and return it's value, that
                        // is the same as the key.  There's probably a more elegant
                        // way to do this with the datum associated, but it escaped me -lb
                            selectKey: options[0][this.selectedIndex].value
                        });
                });

    //when the page first loads, we want the selectedIndex to be -1 for unanswered questions
    //which causes the dropdown to display a blank. This means that any choice,
    //even the first one in the list, represents a change.  Prolly want to do
    //this differently once we've implemented state. -lb

    if (this.question == true)
    {
        selectTag[0][0].selectedIndex = -1;
    }

    this.lastdrawn.options = options;


}; // end of SelectGroup.draw()

/* **************************************************************************
 * SelectGroup.lite                                                     */ /**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string}  liteKey -The key associated with the elements to be highlighted.
 *
 ****************************************************************************/
pearson.brix.SelectGroup.prototype.lite = function (liteKey)
{
    window.console.log("TODO: log fired Select highlite " + liteKey);

    //highlighting a dropdown means both selecting an element and
    //giving focus to the dropdown to call attention to it's possible
    //selection change
    this.lastdrawn.widgetGroup.select("select")[0][0].focus();
    var allOptions = this.lastdrawn.options;
    // turn off all selections
    allOptions.property("selected", false);

    // create a filter function that will match all instances of the liteKey
    var matchesKey = function (d, i) { return d.key === liteKey.toString(); };
    // then find the set that matches
    var pickMe = allOptions.filter(matchesKey);

    // select it the matching options
    pickMe.property("selected", true);


    if (pickMe.empty())
    {
        window.console.log("No key '" + liteKey + "' in select group " + this.id );
    }
}; // end of LabelGroup.lite()


/* **************************************************************************
 * SelectGroup.selectedItem                                            */ /**
 *
 * Return the selected item's data in the select group.
 *
 * @return {Object} the select group item data which is currently selected.
 *
 ****************************************************************************/
pearson.brix.SelectGroup.prototype.selectedItem = function ()
{
    var inputCollection = this.lastdrawn.widgetGroup.select("select");
    // selectedIndex is 0-based, but nth child is 1-based, so add 1
    var index = inputCollection[0][0].selectedIndex + 1;
    var selectedInput = inputCollection.selectAll(":nth-child(" + index + ")");

    return !selectedInput.empty() ? selectedInput.datum() : null;
};

/* **************************************************************************
 * SelectGroup.selectItemAtIndex                                       */ /**
 *
 * Select the choice in this select group at the given index. If the choice is
 * already selected, do nothing.
 * @export
 *
 * @param {number}  index   -the 0-based index of the choice to mark as selected.
 *
 ****************************************************************************/
pearson.brix.SelectGroup.prototype.selectItemAtIndex = function (index)
{
    var choiceInputs = this.lastdrawn.widgetGroup.selectAll("div.widgetSelectGroup select");
    var selectedInput = choiceInputs[0][index];

    if (selectedInput.selected)
    {
        return;
    }

    // choice at index is not selected, so select it and publish selected event
    selectedInput.selected = true;

    var d = /** @type {!pearson.brix.Answer} */ (d3.select(selectedInput).datum());
    this.eventManager.publish(this.selectedEventId, {selectKey: d.answerKey});
};

