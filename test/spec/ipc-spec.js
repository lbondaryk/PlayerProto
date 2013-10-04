/*****************************************************************************
 * Unit test for IPC.
 *
 *
 * @author Young-Suk Ahn Park 
 */

'use strict';

(function () {
    var expect = chai.expect;

    var DomHelper = pearson.utils.DomHelper;

    describe('IPC', function () {

        var ipcConfig = {ipsBaseUrl:"http://localhost:8088"};

        // For the creation of test divs
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

        // For the creation of test divs, as well as testing the expected json from scan method 
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

        
        var div1, div2;
        before(function () {
            div1 = helper.createNewDiv(divAttrs[0], expectedItems[0]);
            div2 = helper.createNewDiv(divAttrs[1], expectedItems[1]);
        });

        after(function () {
            // Remove the crated divs 
            var bodyEl = document.getElementsByTagName('body')[0];
            bodyEl.removeChild(div1);
            bodyEl.removeChild(div2);
        });


        it('should properly initialize by subscribing to init topics (div & iframe mode)', function () {
            var eventManager = new pearson.utils.EventManager();
            var ipc = new pearson.brix.Ipc(ipcConfig, eventManager);
            var items = DomHelper.scanElements('brix', 'div');

            // Both should be set to true after init();
            var topicsSubscribed = [false,false];

            sinon.stub(eventManager, 'subscribe', function(topic, handler){
                // This stub method marks subscribed topics.
                //console.log("SUBS:"+topic);
                for (var i=0; i < expectedItems.length; i++)
                {
                    if (ipc.activityBindingReplyTopic(expectedItems[i]) == topic)
                    {
                        topicsSubscribed[i] = true;
                    }
                }
            });

            ipc.init(items);

            expect(ipc.items).to.deep.equal(expectedItems);
            expect(topicsSubscribed).to.deep.equal([true, true]);
        });


        it('should handle init messages (div & iframe mode)', function () {
            var eventManager = new pearson.utils.EventManager();
            var ipc = new pearson.brix.Ipc(ipcConfig, eventManager);
            var items = DomHelper.scanElements('brix', 'div');
            
            // Both should be set to true after init();
            var topicsUnsubscribed = [false,false];
            // Stubing the EM to monitor the unsubscription.
            sinon.stub(eventManager, 'unsubscribe', function(topic, handler){
                // This stub method marks unsubscribed topics.
                for (var i=0; i < expectedItems.length; i++)
                {
                    if (ipc.activityBindingReplyTopic(expectedItems[i]) == topic)
                    {
                        topicsUnsubscribed[i] = true;
                    }
                }
            });
            // Stubing the ipsProxy to return a test SequenceNode's targetActivity.
            sinon.stub(ipc.ipsProxy, "retrieveSequenceNode", function(seqNodeIdntifier, containerId){
                return testSeqNodeBody.targetActivity;
            });

            // Mocking the BrickLayer to count the invocations to 'build' method.
            // Notice we are using mock and not stub because we don't care about the behavior.
            // We only care that the function has been called once per item.
            var mockBrickLayer = sinon.mock(ipc.bricLayer);
            mockBrickLayer.expects('build').twice();

            ipc.init(items);

            // Sending fake messages to trigger init-topic subscribers
            for (var i=0; i < expectedItems.length; i++)
            {
                var currTopic = ipc.activityBindingReplyTopic(expectedItems[i]);

                var initMessage = {
                    status: "success",
                    data: {
                        asrequest: testSeqNodeReqMessage
                    }
                };
                eventManager.publish(currTopic, initMessage);
            }
            
            expect(topicsUnsubscribed).to.deep.equal([true, true]);

            // Verifying the expectation set in the mock object
            mockBrickLayer.verify();
        });


        it('should publish to AMC requesting sequence node identifier (iframe mode only)', function () {
            var eventManager = new pearson.utils.EventManager();
            var ipc = new pearson.brix.Ipc(ipcConfig, eventManager);
            var items = [ expectedItems[0] ];
            
            var itemChecklist = [false,false];
            // Stubing the EM to monitor the publishing.
            var originalPublishMethod = eventManager.publish;
            sinon.stub(eventManager, 'publish', function(topic, message)
            {
                //console.log('PUB('+topic+'):' + JSON.stringify(message));
                if (topic == '__system_pageLoaded')
                {
                    // We want this message to actually go through the real behavior
                    // to trigger the event (AMC topic) what we are actually interested.
                    originalPublishMethod.call(eventManager, topic, message);
                    return; // ignore the 
                }
                expect(topic).to.equal('AMC');

                for (var i=0; i < expectedItems.length; i++)
                {
                    if (expectedItems[i].assignmenturl == message.data.assignmenturl
                        && expectedItems[i].activityurl == message.data.activityurl)
                    {
                        itemChecklist[i] = true;
                    }
                }
            });

            ipc.init(items, "dummyContainerId");
            eventManager.publish('__system_pageLoaded');

            expect(itemChecklist).to.deep.equal([true, false]);
        });
    });


})();
