// sample test for widget-base
'use strict';

var iframeMessageCounter = {};

(function () {
    var expect = chai.expect;

    /**
     * Wrapper function to do delayed check
     * @see http://stackoverflow.com/questions/11235815/is-there-a-way-to-get-chai-working-with-asynchronous-mocha-tests
     */
    function asyncCheck( done, func ) {
        try {
            func();
            done();
        } catch( e ) {
            done( e )
        }
    }

    describe('MessageBroker', function () {

        var messageBroker = null;

        var containerDiv = null; // The container div is used to facilitate the removal of the object(iframes) elements

        before(function () {
            console.log("## TEST/MessageBroker/before:");
            containerDiv = helper.createNewDiv();
            var objNode1 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=ONE");
            var objNode2 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=TWO");
            var resizeNode = helper.createNewObject(containerDiv, "bric", "iframe_resize.html");

            messageBroker = new MessageBroker();
            messageBroker.initialize({logLevel:4});
            console.log("## MessageBroker instantiated & inited.");
        });

        // @todo: when this spec is run after eventmanager-spec.js
        // this block seems to be executed even when not done.
        // Perhaps I have to reset the done()?
        after(function () {
            console.log("## TEST/MessageBroker/after:");
            // Clean up test modifications to the DOM
            helper.removeAllChildren(containerDiv);
            // Releasing reference and registered event listeners in the Message Bro 
            messageBroker.dispose();
        });

        it('should initialize the list of bricIframes with 3 iframes', function (done) {
            // Wait 1 second until test assertion
            setTimeout(function(){
                asyncCheck(done, function(){
                    // @todo: find out what's the correct method for bricIframeMap
                    expect(messageBroker.domHelper.cachedFrameMap.size).to.equal(undefined);
                } )
            },100)
            
        });

        it('should have received 2 bric messages', function (done) {
             setTimeout(function(){
                asyncCheck(done, function(){
                    expect(messageBroker.bricMessageCounter).to.equal(2);
                } )
            },100)
            
        });

        it('should have received 1 resize messages', function (done) {
            setTimeout(function(){
                asyncCheck(done, function(){
                    expect(messageBroker.resizeMessageCounter).to.equal(1);

                    var reziedNode = containerDiv.getElementsByTagName("iframe")[2];
                    expect(reziedNode.style.width).to.equal("150px");
                    expect(reziedNode.style.height).to.equal("250px");
                } )
            },100)
            
        });

    });
    
    
})();
