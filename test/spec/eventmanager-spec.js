// sample test for widget-base
'use strict';
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

    function subscribeCounter(eventManager, topic, counterTable) {
        eventManager.subscribe(topic, function() {
            if (counterTable[topic] == undefined)
                counterTable[topic] = 1;
            else
                counterTable[topic] = counterTable[topic] + 1;
        });
    }

    function publishNTimes(eventManager, topic, times) {
        if (times == undefined)
            times = 1;
        for (var i=0; i < times; i++) {
            eventManager.publish(topic, "dummy-data");    
        }
    }

    describe('EventManager', function () {

        before(function () {
        });
        
        /**
         * Test the functionality of EventManager as local PubSub
         * Two subscribers are set up: one listening for topic 'UNO' and 
         * another listening for topic 'TRES'.
         * UNO shall  receive one message whereas TRES shall receive three
         * messages.
         */
        describe('EventManager stand alone', function () {
            var eventManager = null;
            var topicRcvCounter = {};
            before(function () {
                eventManager = new EventManager(false); // false to disable communication to MessageBro

                subscribeCounter(eventManager, 'UNO', topicRcvCounter);
                subscribeCounter(eventManager, 'TRES', topicRcvCounter);
                publishNTimes(eventManager, 'UNO', 1);
                publishNTimes(eventManager, 'TRES', 3);
            });

            it('Topic [UNO] should have received 1 message', function () {
                // Wait 1 second until test assertion
                expect(topicRcvCounter['UNO']).to.equal(1);
            });

            it('topic [TRES] should have received 3 messages', function () {
                expect(topicRcvCounter['TRES']).to.equal(3);
            });
        });
        
         

        /**
         * Test the functionality of EventManager with MessageBroker.
         * There are 2 iframes which use iframe_brickmock.html as source.
         * Whenever the iframes are loaded, they trigger
         */
        describe('EventManager with MessageBroker', function () {

            var messageBroker = null;
            var containerDiv = null; // The container div is used to facilitate the removal of the object(iframes) elements

            var iframeRcvCounter = {};

            before(function () {
                console.log("## TEST/EventManager/before:");
                // Message Listener to collect number of bric messages received by iframes
                window.addEventListener('message', function(evt){
                    if (evt.data.channel === 'unittest') {
                        iframeRcvCounter[evt.data.originId] = evt.data.rcvCounter;
                    } 
                });
 
                containerDiv = helper.createNewDiv();
                var objNode1 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=ALPHA");
                var objNode2 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=BETA");

                messageBroker = new MessageBroker();
                messageBroker.initialize({logLevel:4});
            });

            after(function () {
                console.log("## TEST/EventManager/after:");
                // Clean up test modifications to the DOM
                helper.removeAllChildren(containerDiv);
                // Releasing reference and registered event listeners in the Message Bro 
                messageBroker.dispose();
            });

            it('iframe ALPHA should have received 1 message', function (done) {
                // Wait 1 second until test assertion
                setTimeout(function(){
                    asyncCheck(done, function(){
                        expect(iframeRcvCounter['ALPHA?']).to.equal(1);
                    } )
                },200)
            });

            it('iframe BETA should have received 1 message', function (done) {
                // Wait 1 second until test assertion
                setTimeout(function(){
                    asyncCheck(done, function(){
                        expect(iframeRcvCounter['BETA?']).to.equal(1);
                    } )                    
                },200)
            });
        });
    });
    
    
})();
