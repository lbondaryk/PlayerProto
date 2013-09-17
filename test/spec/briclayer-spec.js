/* **************************************************************************
 * briclayer-spec.js                                                        *
 * *********************************************************************/ /**
 *
 * @fileoverview BricLayer unit tests
 *
 * Created on	September 17, 2013
 * @author		Michael Jay Lippert
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';

goog.require('goog.object');

(function () {
    var expect = chai.expect;

	var BricLayer = pearson.brix.BricLayer;

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
    });
})();
