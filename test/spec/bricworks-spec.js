/* **************************************************************************
 * $Workfile:: name-of-file.js                                              $
 * *********************************************************************/ /**
 *
 * @fileoverview BricWorks unit tests
 *
 * Created on	September 17, 2013
 * @author		Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';

(function () {
    var expect = chai.expect;

	var BricWorks = pearson.brix.BricWorks;

    describe('BricWorks: the place to go when you need brix', function () {

        describe('A BricWorks with no registered molds', function () {
			var bricWorks;
			var DummyBricCtor = function (c, e) {this.cfg = c; this.em = e;};

			before(function () {
				bricWorks = new BricWorks({});
			});

			it('should have a registered mold count of 0', function () {
				expect(bricWorks.getMoldCount()).to.equal(0);
			});

			it('should return null when creating a bric', function () {
				expect(bricWorks.createBric('', {})).to.be.null;
			});

			it('should not register a mold with an empty name or any name that isn\'t a string', function () {
				var name = '';
				bricWorks.registerMold(name, DummyBricCtor);
				expect(bricWorks.createBric(name, {})).to.be.null;
				expect(bricWorks.getMoldCount()).to.equal(0);

				name = 12;
				bricWorks.registerMold(name, DummyBricCtor);
				expect(bricWorks.createBric(name, {})).to.be.null;
				expect(bricWorks.getMoldCount()).to.equal(0);

				name = {name: 'foo'};
				bricWorks.registerMold(name, DummyBricCtor);
				expect(bricWorks.createBric(name, {})).to.be.null;
				expect(bricWorks.getMoldCount()).to.equal(0);

				name = null;
				bricWorks.registerMold(name, DummyBricCtor);
				expect(bricWorks.createBric(name, {})).to.be.null;
				expect(bricWorks.getMoldCount()).to.equal(0);

				name = undefined;
				bricWorks.registerMold(name, DummyBricCtor);
				expect(bricWorks.createBric(name, {})).to.be.null;
				expect(bricWorks.getMoldCount()).to.equal(0);
			});
		});

        describe('A BricWorks with one registered mold', function () {
			var dummyEventMgr = {publish: function () {}, subscribe: function () {}, unsubscribe: function () {}};
			var DummyBricCtor = function (c, e) {this.cfg = c; this.em = e;};
			var BRIC1 = 'bric1';
			var config1 = {foo: 'bar', cnt: 3};
			var bricWorks;

			before(function () {
				bricWorks = new BricWorks({}, dummyEventMgr);
				bricWorks.registerMold(BRIC1, DummyBricCtor);
			});

			it('should have a registered mold count of 1', function () {
				expect(bricWorks.getMoldCount()).to.equal(1);
			});

			it('should return null when creating a bric with an unregistered name', function () {
				expect(bricWorks.createBric('foo', {})).to.be.null;
			});

			it('should report that it has a mold for the registered name', function () {
				expect(bricWorks.hasMold(BRIC1)).is.true;
			});

			it('should create the correct bric using the given config and eventmanager' +
			   ' from the bricWorks constructor', function () {
				var mynewbric1 = bricWorks.createBric(BRIC1, config1);
				expect(mynewbric1).to.be.an.instanceOf(DummyBricCtor);
				// the exact config obj param to createBric is passed to the bric ctor.
				expect(mynewbric1.cfg).to.equal(config1);
				// the eventmanager the BricWorks was created with is passed to the bric ctor.
				expect(mynewbric1.em).to.equal(dummyEventMgr);
			});
		});

        describe('A BricWorks with two registered molds', function () {
			var dummyEventMgr = {publish: function () {}, subscribe: function () {}, unsubscribe: function () {}};
			var DummyBricCtor = function (c, e) {this.cfg = c; this.em = e;};
			var DummyBric2Ctor = function (c, e) {this.cfg2 = c; this.em2 = e;};
			var BRIC1 = 'bric1';
			var BRIC2 = 'bric2';
			var config1 = {foo: 'bar', cnt: 3};
			var config2 = {cow: 'hay', cat: ['mouse', 'frog']};
			var bricWorks;

			before(function () {
				bricWorks = new BricWorks({}, dummyEventMgr);
				bricWorks.registerMold(BRIC1, DummyBricCtor);
				bricWorks.registerMold(BRIC2, DummyBric2Ctor);
			});

			it('should have a registered mold count of 2', function () {
				expect(bricWorks.getMoldCount()).to.equal(2);
			});

			it('should report that it has a mold for both registered names', function () {
				expect(bricWorks.hasMold(BRIC1)).is.true;
				expect(bricWorks.hasMold(BRIC2)).is.true;
			});

			it('should report that it doesn\'t have a mold for an unregistered name', function () {
				expect(bricWorks.hasMold('foo')).is.false;
			});

			it('should return null when creating a bric with an unregistered name', function () {
				expect(bricWorks.createBric('foo', {})).to.be.null;
			});

			it('should create the correct bric using the given config and eventmanager' +
			   ' from the bricWorks constructor for both registered brics', function () {
				var mynewbric1 = bricWorks.createBric(BRIC1, config1);
				expect(mynewbric1).to.be.an.instanceOf(DummyBricCtor);
				// the exact config obj param to createBric is passed to the bric ctor.
				expect(mynewbric1.cfg).to.equal(config1);
				// the eventmanager the BricWorks was created with is passed to the bric ctor.
				expect(mynewbric1.em).to.equal(dummyEventMgr);

				var mynewbric2 = bricWorks.createBric(BRIC2, config2);
				expect(mynewbric2).to.be.an.instanceOf(DummyBric2Ctor);
				// the exact config obj param to createBric is passed to the bric ctor.
				expect(mynewbric2.cfg2).to.equal(config2);
				// the eventmanager the BricWorks was created with is passed to the bric ctor.
				expect(mynewbric2.em2).to.equal(dummyEventMgr);
			});
		});
    });
})();
