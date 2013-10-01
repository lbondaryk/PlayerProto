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
            ipc = new pearson.brix.Ipc(eventManager);

            items = domHelper.scan(); // Where items = [ {assignmentId, itemId, type}, {assignmentId, itemId, type},... ]
            ipc.init(items); // so the ipc can set up the subscriptions for getting the sequence nodes ids in order to request the config from the sequence node from the IPS
        });


        it('should scan properly initialize on DIV mode', function () {
            var items = domHelper.scanElements('brix', 'div');
            ipc
            
        });


        skip('should properly initialize on IFRAME mode', function () {
            var items = domHelper.scanObjects('brix');

            
        });
    });

})();
