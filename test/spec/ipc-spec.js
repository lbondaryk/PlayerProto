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

    var eventManager;
    var domHelper;
    var ipc;

    describe('IPC', function () {

        var domHelper = null;
        before(function () {
            eventManager = new pearson.utils.EventManager();
            domHelper = new DomHelper();
            ipc = new pearson.brix.Ipc({}, eventManager);
        });


        it('should scan properly initialize on DIV mode', function () {
            var items = domHelper.scanElements('brix', 'div');
            ipc.init(items);

            var expectedItems = [
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

            expect(ipc.items).to.deep.equal(expectedItems);


            
        });



        it('should properly initialize on IFRAME mode', function () {
            var items = domHelper.scanObjects('brix');

            
        });
    });

})();
