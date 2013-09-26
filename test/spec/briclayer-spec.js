/* **************************************************************************
 * briclayer-spec.js                                                        *
 * *********************************************************************/ /**
 *
 * @fileoverview BricLayer unit tests
 *
 * Created on   September 17, 2013
 * @author      Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';

goog.require('goog.object');

(function () {
    var expect = chai.expect;

    var BricLayer = pearson.brix.BricLayer;

    var createActivityConfigSkeleton = function ()
    {
        var activityConfig =
            {
                "sequenceNodeKey": "seq key",
                "containerConfig":
                    [
                        {
                            "containerId": "container1",
                            "brixConfig": [],
                            "mortarConfig": []
                        }
                    ]
            };

        return activityConfig;
    };

    describe('BricLayer: who do ya call when you need a brix house? BricLayer!', function () {
        var dummyEventMgr = {publish: function () {}, subscribe: function () {}, unsubscribe: function () {}};
        var DummyBricCtor = function (c, e) {this.cfg = c; this.em = e;};

        var bricLayer = new BricLayer({}, dummyEventMgr);

        it('should have a BricWorks', function () {
            expect(bricLayer.getBricWorks()).to.not.be.null;
        });

        it('should only have one instance of a BricWorks', function () {
            var bricWorks = bricLayer.getBricWorks();
            expect(bricLayer.getBricWorks()).to.equal(bricWorks);
        });

        it('should have a bricWorks w/ a registered mold for all brix in BricTypes', function () {
            var BricTypes = pearson.brix.BricTypes;
            var bricWorks = bricLayer.getBricWorks();

            goog.object.forEach(BricTypes, function (bricName, key) {
                expect(bricWorks.hasMold(bricName), key + '("' + bricName + '")').to.be.true;
            });
        });

        describe('BricLayer.build with valid empty activity config', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var activityConfig = createActivityConfigSkeleton();
            var building = bricLayer.build(activityConfig);

            it('should return an object w/ an info property which is an object', function () {
                expect(building).to.have.a.property('info');
                expect(building.info).to.be.an('object');
            });

            it('should return an object w/ a brix property which is an object w/ no properties', function () {
                expect(building).to.have.a.property('brix');
                expect(building.brix).to.be.an('object');
                expect(goog.object.getCount(building.brix)).to.equal(0);
            });

            it('should return an object w/ a mortar property which is an object w/ no properties', function () {
                expect(building).to.have.a.property('mortar');
                expect(building.mortar).to.be.an('object');
                expect(goog.object.getCount(building.mortar)).to.equal(0);
            });
        });

        describe('BricLayer.build with static bric config', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another mold for testing purposes
            var dummyBricName = '_dummy test bric_'
            bricWorks.registerMold(dummyBricName, DummyBricCtor);

            var activityConfig = createActivityConfigSkeleton();
            var dummyBricId = 'test';
            var dummyBricConfig = {"foo": "any foo will do"};

            var staticBricConfig =
                {
                    "bricId": dummyBricId,
                    "bricType": dummyBricName,
                    "config": dummyBricConfig
                };

            activityConfig.containerConfig[0].brixConfig.push(staticBricConfig);

            var building = bricLayer.build(activityConfig);

            it('should create the bric as a property of the brix object with a property name of the bricId', function () {
                expect(building.brix).to.have.a.property(dummyBricId);
                expect(building.brix[dummyBricId]).to.be.an.instanceOf(DummyBricCtor);
            });

            it('should build the bric with an exact copy of the static config', function () {
                var dummyBric = building.brix[dummyBricId];
                // the exact config obj from the activity config should not be passed to the ctor.
                expect(dummyBric.cfg).to.not.equal(dummyBricConfig);
                // the config obj should be identical to the activity config
                expect(dummyBric.cfg).to.deep.equal(dummyBricConfig);
                // the eventmanager the BricLayer was created with is passed to the bric ctor.
                expect(dummyBric.em).to.equal(dummyEventMgr);
            });
        });

        describe('BricLayer.build w/ bric config w/ configFixup', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another couple of molds for testing purposes
            var dummyBricName = '_dummy test bric_'
            bricWorks.registerMold(dummyBricName, DummyBricCtor);

            var DummyRefBricCtor = function (c, e) {this.cfg = c; this.em = e;};
            DummyRefBricCtor.prototype.getBar = function () {return this.cfg.bar;};
            var dummyRefBricName = '_dummy test ref bric_'
            bricWorks.registerMold(dummyRefBricName, DummyRefBricCtor);

            var activityConfig = createActivityConfigSkeleton();

            var dummyRefBricId = 'ref-test';
            var dummyRefBricConfig = {"bar": "any fubar will do"};

            var dummyBricId = 'test';
            var dummyBricConfig = {"foo": "any foo will do"};

            var bricConfigToRef =
                {
                    "bricId": dummyRefBricId,
                    "bricType": dummyRefBricName,
                    "config": dummyRefBricConfig,
                };

            activityConfig.containerConfig[0].brixConfig.push(bricConfigToRef);

            var fixupD3Select =
                {
                    "type": "set-property",
                    "name": "node",
                    "value":
                        {
                            "type": "d3select",
                            "selector": "#target"
                        }
                };

            var fixupWithBrixRefProperty =
                {
                    "type": "set-property",
                    "name": "maxSize",
                    "value":
                        {
                            "type": "property-of-ref",
                            "domain": "brix",
                            "refId": dummyRefBricId,
                            "accessor": "getBar"
                        }
                };

            var bricConfigWithFixup =
                {
                    "bricId": dummyBricId,
                    "bricType": dummyBricName,
                    "config": dummyBricConfig,
                    "configFixup": [fixupD3Select, fixupWithBrixRefProperty]
                };

            activityConfig.containerConfig[0].brixConfig.push(bricConfigWithFixup);

            var building = null;

            // the div element w/ id 'target' created before the tests, which will be removed
            // after the tests.
            var div;

            before(function () {
                div = helper.createNewDiv();
                d3.select(div).attr('id', 'target');
                building = bricLayer.build(activityConfig);
            });

            after(function () {
                d3.select(div).remove();
            });

            it('should set the config property specified w/ a value of the d3 select of the given selector', function () {
                var dummyBric = building.brix[dummyBricId];
                expect(dummyBric.cfg).to.have.a.property(fixupD3Select['name']);
                expect(dummyBric.cfg.node).to.be.an.instanceof(d3.selection);
                expect(dummyBric.cfg.node).to.deep.equal(d3.select('#target'));
            });

            it('should set the config property specified w/ a value from a previous bric', function () {
                var dummyBric = building.brix[dummyBricId];
                expect(dummyBric.cfg).to.have.a.property(fixupWithBrixRefProperty['name']);
                expect(dummyBric.cfg.maxSize).to.equal("any fubar will do");
            });
        });
    });
})();
