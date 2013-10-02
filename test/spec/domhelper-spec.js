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

        var divAttrs = [
            {
                id: "some_habitat_id1",
                class: "brix"
            },
            {
                id: "some_habitat_id2",
                class: "brix"
            }
        ];
        var expectedItems = [
            {
                activityurl: "http://content.api.pearson.com/resources/activity/11001",
                assignmenturl: "http://content.api.pearson.com/resources/activity/12001",
                containerid: "imgReactor",
                type: "brix",
            },
            {
                activityurl: "http://content.api.pearson.com/resources/activity/11002",
                assignmenturl: "http://content.api.pearson.com/resources/activity/12002",
                containerid: "steps",
                type: "brix",
            }
        ];

        var containerDiv;
        var div1, div2;

        before(function () {
            containerDiv = helper.createNewDiv();
            div1 = helper.createNewDiv(divAttrs[0], expectedItems[0]);
            div2 = helper.createNewDiv(divAttrs[1], expectedItems[1]);

            helper.createNewObject(containerDiv, 'brix', null, expectedItems[0]);
            helper.createNewObject(containerDiv, 'brix', null, expectedItems[1]);

            domHelper = new DomHelper();
        });
        after(function () {
            // Remove the crated divs and objects
            var bodyEl = document.getElementsByTagName('body')[0];
            bodyEl.removeChild(div1);
            bodyEl.removeChild(div2);
            helper.removeAllChildren(containerDiv);
        });

        it('should scan divs of class \'brix\'', function () {
            var items = domHelper.scanElements('brix', 'div');

            expect(items).to.deep.equal(expectedItems);
        });


        it('should scan objects of class brix', function () {
            var items = domHelper.scanObjects('brix');

            expect(items).to.deep.equal(expectedItems);
        });

        
    });

})();
