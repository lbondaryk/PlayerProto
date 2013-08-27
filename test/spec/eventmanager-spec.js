// sample test for widget-base
'use strict';
(function () {
    var expect = chai.expect;

    /**
     * Subscribes to a topic with a a simple handler that counts the number of received messages 
     */
    function subscribeCounter(eventManager, topic, counterTable) {
        var handler = function() {
            if (counterTable[topic] == undefined)
                counterTable[topic] = 1;
            else
                counterTable[topic] = counterTable[topic] + 1;
        }

        eventManager.subscribe(topic, handler);

        return handler;
    }

    /**
     * Publishes messages n-number of times to a specific topic.
     */
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
                eventManager = new pearson.utils.EventManager(false); // false to disable communication to MessageBro

                subscribeCounter(eventManager, 'UNO', topicRcvCounter);
                var dosHandler = subscribeCounter(eventManager, 'DOS', topicRcvCounter);
                subscribeCounter(eventManager, 'TRES', topicRcvCounter);

                // Double subscribe should result in one single subscription
                // I.e. Do not receive duplicate events
                eventManager.subscribe('DOS', dosHandler);

                publishNTimes(eventManager, 'UNO', 1);
                publishNTimes(eventManager, 'DOS', 2);
                eventManager.unsubscribe('DOS', dosHandler);
                publishNTimes(eventManager, 'DOS', 2);
                publishNTimes(eventManager, 'TRES', 3);

            });

            it('Topic [UNO] should have received 1 message', function () {
                // Wait 1 second until test assertion
                expect(topicRcvCounter['UNO']).to.equal(1);
            });

            it('Topic [DOS] should have received 2 messages (2 messages after ununsuscribe are dropped)', function () {
                // Wait 1 second until test assertion
                expect(topicRcvCounter['DOS']).to.equal(2);
            });

            it('topic [TRES] should have received 3 messages', function () {
                expect(topicRcvCounter['TRES']).to.equal(3);
            });

        });
        
         

        /**
         * Test the functionality of EventManager with MessageBroker.
         * There are 3 iframes which use iframe_brickmock.html as source.
         * Each iframe subscribes to a topic of same name in lowercase.
         * iframe ALPHA publishes to alpha.
         * iframe BETA publishes to alpha as well.
         * iframe GAMMA publishes to beta.
         * THerefore ALPHA should receive 2 messages, BETA one, and GAMMA none.
         */
        describe('EventManager with MessageBroker', function () {

            var messageBroker = null;
            var containerDiv = null; // The container div is used to facilitate the removal of the object(iframes) elements

            var iframeRcvCounter = {};

            before(function (done) {
                console.log("## TEST/EventManager/before:");
                // Message Listener to collect number of bric messages received by iframes
                window.addEventListener('message', function(evt){
                    if (evt.data.type === 'unittest') {
                        iframeRcvCounter[evt.data.originId] = evt.data.rcvCounter;
                    } 
                });
 
                containerDiv = helper.createNewDiv();
                var objNode1 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=ALPHA&sub=alpha&pub=alpha");
                var objNode2 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=BETA&sub=beta&pub=alpha");
                var objNode2 = helper.createNewObject(containerDiv, "bric", "iframe_bricmock.html?id=GAMMA&sub=GAMMA&pub=beta");

                messageBroker = new MessageBroker();
                messageBroker.initialize({logLevel:5});

                // Wait for some time for message being passed around
                setTimeout(function(){
                    console.log("## Waiting for a while until all messages being sent.");
                    done();
                    console.log("## Finished waiting for all messages being sent.");
             
                }, 1000);
            });

            after(function () {
                console.log("## TEST/EventManager/after:");
                // Clean up test modifications to the DOM
                helper.removeAllChildren(containerDiv);
                // Releasing reference and registered event listeners in the Message Bro 
                messageBroker.dispose();
            });

            it('iframe ALPHA should have received 2 message', function () {
                expect(iframeRcvCounter['ALPHA']).to.equal(2);
            });

            it('iframe BETA should have received 1 message', function () {
                expect(iframeRcvCounter['BETA']).to.equal(1);
            });
            it('iframe GAMMA should not have received any message', function () {
                expect(iframeRcvCounter['GAMMA']).to.equal(undefined);
            });
        });
    });
    
    
})();
