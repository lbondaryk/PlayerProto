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
                            "mortarConfig": [],
                            "hookupActions": []
                        }
                    ]
            };

        return activityConfig;
    };

    describe('BricLayer: who do ya call when you need a brix house? BricLayer!', function () {
        var dummyEventMgr = {publish: function () {}, subscribe: function () {}, unsubscribe: function () {}};
        var DummyBricCtor = function (c, e) {this.cfg = c; this.em = e;};
        var DummyMortarCtor = function (c, e) {this.cfg = c; this.em = e;};

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
            bricWorks.registerBricMold(dummyBricName, DummyBricCtor);

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

        describe('BricLayer.build w/ bric config w/ unknown configFixup type', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another mold for testing purposes
            var dummyBricName = '_dummy test bric_'
            bricWorks.registerBricMold(dummyBricName, DummyBricCtor);

            var activityConfig = createActivityConfigSkeleton();

            var dummyBricId = 'test';
            var dummyBricConfig = {"foo": "any foo will do"};

            var fixupUnknown =
                {
                    "type": "gobble-d-gook",
                };

            var bricConfigWithFixup =
                {
                    "bricId": dummyBricId,
                    "bricType": dummyBricName,
                    "config": dummyBricConfig,
                    "configFixup": [fixupUnknown]
                };

            activityConfig.containerConfig[0].brixConfig.push(bricConfigWithFixup);

            it('should throw an exception w/ the name of the unkown config fixup type', function () {
                expect(goog.bind(bricLayer.build, bricLayer, activityConfig)).to.throw(Error, /configFixup.+gobble-d-gook/);
            });
        });

        describe('BricLayer.build w/ bric config w/ configFixup', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another couple of molds for testing purposes
            var dummyBricName = '_dummy test bric_'
            bricWorks.registerBricMold(dummyBricName, DummyBricCtor);

            var DummyRefBricCtor = function (c, e) {this.cfg = c; this.em = e;};
            DummyRefBricCtor.prototype.getBar = function () {return this.cfg.bar;};
            var dummyRefBricName = '_dummy test ref bric_'
            bricWorks.registerBricMold(dummyRefBricName, DummyRefBricCtor);

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

        describe('BricLayer.build with static mortar config', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another mix for testing purposes
            var dummyMortarName = '_dummy test mortar_'
            bricWorks.registerMortarMix(dummyMortarName, DummyMortarCtor);

            var activityConfig = createActivityConfigSkeleton();
            var dummyMortarId = 'test';
            var dummyMortarConfig = {"foo": "any foo will do"};

            var staticMortarConfig =
                {
                    "mortarId": dummyMortarId,
                    "mortarType": dummyMortarName,
                    "config": dummyMortarConfig
                };

            activityConfig.containerConfig[0].mortarConfig.push(staticMortarConfig);

            var building = bricLayer.build(activityConfig);

            it('should create the mortar as a property of the mortar object with a property name of the mortarId', function () {
                expect(building.mortar).to.have.a.property(dummyMortarId);
                expect(building.mortar[dummyMortarId]).to.be.an.instanceOf(DummyMortarCtor);
            });

            it('should build the mortar with an exact copy of the static config', function () {
                var dummyMortar = building.mortar[dummyMortarId];
                // the exact config obj from the activity config should not be passed to the ctor.
                expect(dummyMortar.cfg).to.not.equal(dummyMortarConfig);
                // the config obj should be identical to the activity config
                expect(dummyMortar.cfg).to.deep.equal(dummyMortarConfig);
                // the eventmanager the BricLayer was created with is passed to the bric ctor.
                expect(dummyMortar.em).to.equal(dummyEventMgr);
            });
        });

        describe('BricLayer.build w/ mortar config w/ configFixup', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another couple of mixes for testing purposes
            var dummyMortarName = '_dummy test mortar_'
            bricWorks.registerMortarMix(dummyMortarName, DummyMortarCtor);

            var DummyRefMortarCtor = function (c, e) {this.cfg = c; this.em = e;};
            DummyRefMortarCtor.prototype.getBar = function () {return this.cfg.bar;};
            var dummyRefMortarName = '_dummy test ref mortar_'
            bricWorks.registerMortarMix(dummyRefMortarName, DummyRefMortarCtor);

            var activityConfig = createActivityConfigSkeleton();

            var dummyRefMortarId = 'ref-test';
            var dummyRefMortarConfig = {"bar": "any fubar will do"};

            var dummyMortarId = 'test';
            var dummyMortarConfig = {"foo": "any foo will do"};

            var mortarConfigToRef =
                {
                    "mortarId": dummyRefMortarId,
                    "mortarType": dummyRefMortarName,
                    "config": dummyRefMortarConfig,
                };

            activityConfig.containerConfig[0].mortarConfig.push(mortarConfigToRef);

            var fixupConstant =
                {
                    "type": "set-property",
                    "name": "node",
                    "value":
                        {
                            "type": "constant",
                            "value": "#target"
                        }
                };

            var fixupWithMortarRefProperty =
                {
                    "type": "set-property",
                    "name": "glue",
                    "value":
                        {
                            "type": "ref",
                            "domain": "mortar",
                            "refId": dummyRefMortarId
                        }
                };

            var mortarConfigWithFixup =
                {
                    "mortarId": dummyMortarId,
                    "mortarType": dummyMortarName,
                    "config": dummyMortarConfig,
                    "configFixup": [fixupConstant, fixupWithMortarRefProperty]
                };

            activityConfig.containerConfig[0].mortarConfig.push(mortarConfigWithFixup);

            var building = null;

            building = bricLayer.build(activityConfig);

            it('should set the config property specified w/ a value of the constant given', function () {
                var dummyMortar = building.brix[dummyMortarId];
                expect(dummyMortar.cfg).to.have.a.property(fixupConstant['name']);
                expect(dummyMortar.cfg.node).to.equal('#target');
            });

            it('should set the config property specified w/ a reference to the previous mortar', function () {
                var dummyMortar = building.brix[dummyMortarId];
                var dummyRefMortar = building.brix[dummyRefMortarId];
                expect(dummyMortar.cfg).to.have.a.property(fixupWithMortarRefProperty['name']);
                expect(dummyMortar.cfg.glue).to.be.an.instanceOf(DummyRefMortarCtor);
                expect(dummyMortar.cfg.glue).to.equal(dummyRefMortar);
            });
        });

        describe('BricLayer.build w/ an unknown hookupAction type', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);

            var activityConfig = createActivityConfigSkeleton();

            var methodCallAction1 =
                {
                    "type": "jump-in-lake",
                    "instance": {"type": "ref", "domain": "brix", "refId": "foo"},
                    "methodName": "doIt",
                };

            activityConfig.containerConfig[0].hookupActions.push(methodCallAction1);

            it('should throw an exception w/ the name of the unkown action type', function () {
                expect(goog.bind(bricLayer.build, bricLayer, activityConfig)).to.throw(Error, /action.+jump-in-lake/);
            });
        });

        describe('BricLayer.build with method call hookup actions', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);
            var bricWorks = bricLayer.getBricWorks();
            // Add another couple of molds for testing purposes
            var DummyRefBricCtor = function (c, e)
                {this.cfg = c; this.em = e; this.doItArgs = null; this.doItAllArgs = null;};
            DummyRefBricCtor.prototype.doIt = function () { this.doItArgs = arguments; };
            DummyRefBricCtor.prototype.doItAll = function () { this.doItAllArgs = arguments; };

            var dummyRefBricName = '_dummy test ref bric_'
            bricWorks.registerBricMold(dummyRefBricName, DummyRefBricCtor);

            var activityConfig = createActivityConfigSkeleton();

            var dummyRefBricId = 'ref-test';
            var dummyRefBricConfig = {"bar": "any fubar will do"};

            var bricConfigToRef =
                {
                    "bricId": dummyRefBricId,
                    "bricType": dummyRefBricName,
                    "config": dummyRefBricConfig
                };

            activityConfig.containerConfig[0].brixConfig.push(bricConfigToRef);

            var methodCallAction1 =
                {
                    "type": "method-call",
                    "instance": {"type": "ref", "domain": "brix", "refId": dummyRefBricId},
                    "methodName": "doIt",
                    "args":
                        [
                            {"type": "constant", "value": 42},
                            {"type": "constant", "value": "towel"}
                        ]
                };

            var methodCallAction2 =
                {
                    "type": "method-call",
                    "instance": {"type": "ref", "domain": "brix", "refId": dummyRefBricId},
                    "methodName": "doItAll",
                    "args":
                        [
                            {"type": "constant", "value": [1, 3, 5]}
                        ]
                };

            activityConfig.containerConfig[0].hookupActions.push(methodCallAction1);
            activityConfig.containerConfig[0].hookupActions.push(methodCallAction2);

            var building = null;

            before(function () {
                building = bricLayer.build(activityConfig);
            });
        
            it('should call the methods on the correct objects w/ the correct arguments', function () {
                var dummyBric = building.brix[dummyRefBricId];
                expect(dummyBric.doItArgs).is.not.null;
                expect(dummyBric.doItArgs.length).to.equal(2);
                expect(dummyBric.doItArgs[0]).to.equal(42);
                expect(dummyBric.doItArgs[1]).to.equal('towel');

                expect(dummyBric.doItAllArgs).is.not.null;
                expect(dummyBric.doItAllArgs.length).to.equal(1);
                expect(dummyBric.doItAllArgs[0]).to.deep.equal([1, 3, 5]);
            });
        });

        describe('BricLayer.build w/ an unknown dynamicValue type', function () {
            var bricLayer = new BricLayer({}, dummyEventMgr);

            var activityConfig = createActivityConfigSkeleton();

            // we'll put the unknown dynamicValue type in an action
            var methodCallAction1 =
                {
                    "type": "method-call",
                    "instance": {"type": "cant-get-thar", "domain": "brix", "refId": "foo"},
                    "methodName": "doIt",
                };

            activityConfig.containerConfig[0].hookupActions.push(methodCallAction1);

            it('should throw an exception w/ the name of the unkown dynamicValue type', function () {
                expect(goog.bind(bricLayer.build, bricLayer, activityConfig)).to.throw(Error, /dynamicValue.+cant-get-thar/);
            });
        });
    });
})();
