/* **************************************************************************
 * $Workfile:: mortar-agestructure.js                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview Implementation of the {@link pearson.brix.mortar.AgeStructure} mortar.
 *
 * Created on		October 28, 2013
 * @author			Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

goog.provide('pearson.brix.mortar.AgeStructure');

goog.require('pearson.brix.mortar.Mortar');
goog.require('pearson.utils.IEventManager');

/* **************************************************************************
 * AgeStructure                                                        */ /**
 *
 * Constructor function for AgeStructure instances.
 *
 * @constructor
 * @extends {pearson.brix.mortar.Mortar}
 * @export
 *
 * @param {Object}		config			-The settings to configure this AgeStructure
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this AgeStructure.
 * 										 if undefined a unique id will be assigned.
 * @param {string}      config.yearTopic
 *                                      -The topic of the year changed event.
  * @param {string}      config.birthTopic
 *                                      -The topic of the birth changed event.
* @param {!pearson.brix.BarChart}
 *                      config.targetBric
 *                                      -Bric instance whose data is to be replaced
 *                                       and redrawn to reflect new values.
 * @param {!pearson.utils.IEventManager=}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 * @classdesc
 * An AgeStructure mortar responds to selection events of one Bric by calling the
 * lite method of another Bric.
 *
 * @note May want to enhance this class to handle highlighting an array of brix.
 *
 ****************************************************************************/
pearson.brix.mortar.AgeStructure = function (config, eventManager)
{
    // call the base class constructor
    goog.base(this);

    /**
     * The id of this AgeStructure mortar instance, as specified in the config.
     * @private
     * @type {string|undefined}
     */
    this.AgeStructureId_ = pearson.brix.utils.getIdFromConfigOrAuto(config, pearson.brix.mortar.AgeStructure);
    
    /**
     * The year topic to handle by updating the data and redrawing the target bric.
     * @private
     * @type {string}
     */
    this.yearTopic_ = config['yearTopic'];

     /**
     * The year slider object is needed so we can reset it's value on recalc.
     * @private
     * @type {!pearson.brix.ISlider}
     */
    this.yearSlider_ = config['yearSlider'];

     /**
     * The initialPop topic to handle by updating the data and redrawing the target bric.
     * @private
     * @type {string}
     */
    this.initialPopTopic_ = config['initialPopTopic'];

    /**
     * The target bric instance to draw the data.
     * @private
     * @type {!pearson.brix.ILightable}
     */
    this.targetBric_ = config['targetBric'];

    /**
     * The population year that should be displayed in the target bric. 
     * @type {number}
     */
    this.year_ = 0;

    /**
     * The initial total population that will be allocated to various ages
     * according to the selected distribution profile.
     * @type {number}
     */
    this.initialPop_ = 10;

    this.birthRate_ = 0.0012;

    /**
     * The calculated population data
     * @private
     * @type {Array.<Array.<{x: number, y: number}>>}
     */
    this.population_ = [];

    // Init population data
    this.calcPopulation_();

	/**
	 * The event manager to use to publish (and subscribe to) events for this mortar
     * @private
	 * @type {!pearson.utils.IEventManager}
	 */
	this.eventManager_ = eventManager || pearson.utils.IEventManager.dummyEventManager;

    // Set up the selection event subscription
    this.eventManager_.subscribe(this.yearTopic_, goog.bind(this.handleYearChangedEvent_, this));
    this.eventManager_.subscribe(this.initialPopTopic_, goog.bind(this.handleInitialPopChangedEvent_, this));
};
goog.inherits(pearson.brix.mortar.AgeStructure, pearson.brix.mortar.Mortar);

/**
 * Prefix to use when generating ids for instances of AgeStructure.
 * @const
 * @type {string}
 */
pearson.brix.mortar.AgeStructure.autoIdPrefix = 'AgeStructure_auto_';

/* **************************************************************************
 * AgeStructure.handleYearChangedEvent_                                */ /**
 *
 * Handler for the changed year value event which will display the data for
 * the new year in the target bric.
 * @private
 *
 * @param {Object}	eventDetails		-The details of the slider change event.
 *
 ****************************************************************************/
pearson.brix.mortar.AgeStructure.prototype.handleYearChangedEvent_ = function (eventDetails)
{
    this.year_ = eventDetails.newValue;
    this.updateTargetBric_();
};

/* **************************************************************************
 * AgeStructure.handleInitialPopChangedEvent_                                */ /**
 *
 * Handler for the changed initial population value event which will 
 * recalculate the population data, and redisplay the data for
 * year0 in the target bric.
 * @private
 *
 * @param {Object}  eventDetails        -The details of the slider change event.
 *
 ****************************************************************************/
pearson.brix.mortar.AgeStructure.prototype.handleInitialPopChangedEvent_ = function (eventDetails)
{
    this.initialPop_ = eventDetails.newValue;
    this.calcPopulation_();
    this.year_ = 0;
    this.yearSlider_.setValue(this.year_);
    this.updateTargetBric_();
};

/* **************************************************************************
 * AgeStructure.updateTargetBric_                                      */ /**
 *
 * Handler for the changed year value event which will display the data for
 * the new year in the target bric.
 * @private
 *
 ****************************************************************************/
pearson.brix.mortar.AgeStructure.prototype.updateTargetBric_ = function ()
{
    this.targetBric_.data = [this.population_[this.year_]];
    this.targetBric_.redraw();
};

/* **************************************************************************
 * AgeStructure.calculatePopulation_                                   */ /**
 *
 * Handler for the changed year value event which will display the data for
 * the new year in the target bric.
 * @private
 *
 ****************************************************************************/
pearson.brix.mortar.AgeStructure.prototype.calcPopulation_ = function ()
{
    // variables to set up the difference equation
    var years = 50;
    var n0 = this.initialPop_;    // total population - eventually slider
    var maxAge = 90;
    var endBearingAge = 50; //age at which women become infertile(ish)
    var startBearingAge = 15; //might want to set this on slider
    var fertilityRate = 2; //# kids born per woman, on slider
    //death rate, A and B need to be set by a dropdown for 3 population types
    //and different A and B for men and women
    function mort(A,B,age)
        {
        return A * Math.exp(B * age);
        }

    function birth(Nreproductive)
        {
            return Nreproductive * fertilityRate/(50 - startBearingAge);
        }

    var population = []; //population is a 2-D array, first index year up to 50, second age group
    var init = []; // pop is the population array for all ages
    var A = 0.00081, B= 0.062;

    for (var a = 0; a <= maxAge; a++)
    {
        // initialize the population at each age at year 0, Type I, II or III
        // currently typeII uniform
        init[a] = {x: n0/maxAge, y: a};
    }
     
    // initialize population zero year
    population[0] = init;

    // now fill up the rest of the array
    for (var t = 1 ; t <= years; t++)
    {
        var pop = [];
        var prevPop = population[t - 1];
        var Nreproductive;

        prevPop.forEach( function(o,i)
            {
                console.log(o.x)
                Nreproductive = (i < endBearingAge && i > startBearingAge) ? Nreproductive + o.x : Nreproductive;
            });

        console.log(Nreproductive);

        // Age 0-1 should be different, including the birth rate
        pop[0] = {x: prevPop[0].x * mort(A, B, prevPop[0].x) + birth(Nreproductive), y: 0};

        for (var age = 1; age <= maxAge; age++)
        {
            //while it might be more efficient to count down, the difference equation 
            //only works if you bootstrap up. Each age's population is equal to the 
            //population of the previous age from last year, times (1 - death rate).
            pop[age] = {x: population[t - 1][age - 1].x * (1 - mort(A, B, age - 1)), y: age};
        }

        population[t] = pop;
    }

    this.population_ = population;

};
