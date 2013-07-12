/* Message Broker
 */

/**$
 *
 * 
 Event = {
 	source: <source>,
 	data: {
 		messageType: <bricevent, resize>
 		#case bricevent, this is what actually sent at EventManager scope
	 	payload: {
	 		sendTime: <time was sent in unix format>
	 		topic: <the event manager's topic>
			sourceObjectId: <object Id where the event was originated>
			eventName: <changed, submitted, control, error, etc> 
			eventData: <specific data, usually collection of key-value pairs> 
	 	}

	 	#case resize
	 	payload: {
			width:<w>,
			height: <h>
	 	}
	 }
 }
 */
var MessageBroker = function(options) {

	// 
	this.bricIframes = null;


	// Centralize the initialization login in one single function
 	this.initialize = function (options) {

 		this.convertObjectTagToIframeTag();

		//var widgetsOnPage = document.querySelectorAll('iframe');
		this.bricIframes = $("iframe.bric");

		// Handle events.
        window.addEventListener('message', function(e){
            if (e.data.messageType === 'bricevent') this.relay(e);
            if (e.data.messageType === 'resize') resize(e);
        });
	}


	////////// The rest of methods //////////

	// Relay the message to the rest of iframes
	this.relay = function (source, message) {
		
        [].forEach.call(this.bricIframes, function(bricIframes){
            // Skip over the widget that sent the message.
            if (source === bricIframes.contentWindow) return;

            bricIframes.contentWindow.postMessage(message, '*')
        });
	}

	this.resize = function (e) {
        var sourceObject = findIFrameWithWindow(e.source);
        sourceObject.style.width = e.data.width + 'px';
        sourceObject.style.height = e.data.height + 'px';
    }

    this.findIFrameWithWindow = function (win){
        for (var i = 0; i < this.bricIframes.length; i++){
            if (win === this.bricIframes[i].contentWindow) return this.bricIframes[i];
        }
    }

    ////////// methods related to DOM
    // Probably will be refactored to MasterDocumentManager

    // Method returns a queryString from <param> tags inside and <object>.
    this.buildQueryStringFromParams = function (objectNode){
        var params = objectNode.querySelectorAll('param');
        var queryString = [].reduce.call(params, function(acc, paramNode){
            var name = paramNode.getAttribute('name');
            var value = paramNode.getAttribute('value');

            if (acc) acc += '&';
            return acc + encodeURIComponent(name) + '=' + encodeURIComponent(value);
        }, '');
        return queryString;
    }
    
    this.convertObjectTagToIframeTag = function () {
		// Turn the <object> tags into <iframe> tags to work around webkit bug https://bugs.webkit.org/show_bug.cgi?id=75395.
	    // Also append parameters to iframe url so they're accessible to the iframe implementation.
	    // To prevent the flicker when loading, you might want to do this transformation work before rendering the HTML in your player.
	    var objectNodes = document.querySelectorAll('object.bric');
	    [].forEach.call(objectNodes, function(objectNode){
	        var iframeNode = document.createElement('iframe');
	        iframeNode.setAttribute('sandbox', 'allow-scripts');

	        // Copy over whitelisted attributes from the <object> to the <iframe>.
	        ['height','width','class','style'].forEach(function(attrName){
	            var attrValue = objectNode.getAttribute(attrName);
	            if (attrValue !== null) iframeNode.setAttribute(attrName, attrValue);
	        });

	        var queryString = this.buildQueryStringFromParams(objectNode);
	        var url = objectNode.getAttribute('data') + '?' + queryString;
	        iframeNode.setAttribute('src', url);
	        // Swap the <object> for the <iframe> node.
	        objectNode.parentNode.replaceChild(iframeNode, objectNode);
	    });
    }
    


	// Perform the actual call to the initialization method.
	// (Remember that we are already in constructor scope)
	this.initialize.apply(this, arguments);

}
