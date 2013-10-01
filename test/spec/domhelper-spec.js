/*****************************************************************************
 * Unit test for IpsProxy making AJAX calls to the server.
 *
 * This test is integration test and is meant to run while IPS server is up.
 *
 * If you are getting error in the Browser console saying: 
 * "XMLHttpRequest cannot load http://localhost:8088/sequencenodes/. 
 * Origin null is not allowed by Access-Control-Allow-Origin"
 * 
 *
 * @author Young-Suk Ahn Park 
 */

'use strict';

(function () {
    var expect = chai.expect;

    describe('DomHelper', function () {

        var domHelper = null;
        before(function () {
            domHelper = new DomHelper();
        });


        it('should scan divs of class brix', function () {
            var items = domHelper.scanElements('brix', 'div');

            var expectedResult = [
                {
                    id: "some_habitat_id1",
                    itemid: "http://content.api.pearson.com/resources/activity/11001",
                    assignmentid: "http://content.api.pearson.com/resources/activity/12001",
                    containerid: "imgReactor",
                    type: "brix"
                },
                {
                    id: "some_habitat_id2",
                    itemid: "http://content.api.pearson.com/resources/activity/11002",
                    assignmentid: "http://content.api.pearson.com/resources/activity/12002",
                    containerid: "steps",
                    type: "brix"
                }
            ];
            expect(items).to.deep.equal(expectedResult);
        });


        it('should scan objects of class brix', function () {
            var items = domHelper.scanObjects('brix');

            var expectedResult = [
                {
                    id: "some_habitat_id1",
                    itemid: "http://content.api.pearson.com/resources/activity/21001",
                    assignmentid: "http://content.api.pearson.com/resources/activity/22001",
                    containerid: "imgReactor",
                    type: "brix"
                },
                {
                    id: "some_habitat_id2",
                    itemid: "http://content.api.pearson.com/resources/activity/21002",
                    assignmentid: "http://content.api.pearson.com/resources/activity/22002",
                    containerid: "steps",
                    type: "brix"
                }
            ];
            console.log("RES:"+JSON.stringify(items));
            console.log("EXP:"+JSON.stringify(expectedResult));

            expect(items).to.deep.equal(expectedResult);
        });
    });

})();
