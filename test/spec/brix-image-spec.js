/* **************************************************************************
 * brix-image-spec.js                                                  $
 * **********************************************************************//**
 *
 * @fileoverview image and captioned image brix unit tests
 *
 * Created on		Oct 1, 2013
 * @author			Leslie Bondaryk
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';


(function () {
  	var expect = chai.expect;

	var EventManager = pearson.utils.EventManager;
	var Carousel = pearson.brix.Carousel;
	var Image = pearson.brix.Image;


    describe('Images wif and wifout captions: you want fries with that?', function () {
		var eventManager = null;

        describe('Creating an image bric', function () {
			var configImg =
				[
					{
						id: 'foo',
						URI: 'img/test1.jpg',
						caption: "The seasons",
						actualSize: {height: 366, width: 443}
					},
				];
			var myImage = null;
			
			before(function () {
				myImage = new Image(configImg);
			});
			
            it('should have the id specified in the config', function () {
                expect(myImage.id).to.equal(configImg.id);
            });

			it('should have an uninitialized lastdrawn property', function () {
                expect(myImage.lastdrawn).to.have.property('container').that.is.null;
                expect(myImage.lastdrawn).to.have.deep.property('size.height', 0);
                expect(myImage.lastdrawn).to.have.deep.property('size.width', 0);
                expect(myImage.lastdrawn).to.have.property('widgetGroup').that.is.null;
            });
 

        describe('DOM manipulation (create/update elements) tests', function () {
				var configCntr = {
					node: null,
					maxSize: {width: 477, height: 300}
				};
				var targetEl = null;
				var cntr = null;

				after(function () {
					// Clean up test modifications to the DOM
					configCntr.node && configCntr.node.remove();
				});
					
				describe('draw()', function () {
					before(function () {
						cntr = helper.createNewSvgContainer(configCntr);
						// append will call draw()
						cntr.append(myImage);
					});
					
					it('should set the lastdrawn container and size properties to the values passed in', function () {
						// get the last element of the container
						// note: this uses internal knowledge of SVGContainer.append which may change. -mjl
						var cntrArg = cntr.svgObj.select("g.brix:last-child");
						var sizeArg = {height: 300, width: 477};
						expect(myImage.lastdrawn.container.node()).to.deep.equal(cntrArg.node());
						expect(myImage.lastdrawn.size).to.deep.equal(sizeArg);
					});

					it('should have appended a group element with class \'brixImage\' to the container' +
					   'and set the lastdrawn.widgetGroup to that d3 selection', function () {
						// get the last element of the container
						// note: this uses internal knowledge of SVGContainer.append which may change. -mjl
						var last = cntr.svgObj.select("g.brix:last-child :last-child");
						expect(last.node().nodeName).to.equal('g');
						expect(last.classed('brixImage')).to.be.true;
						expect(myImage.lastdrawn.widgetGroup.node()).to.deep.equal(last.node());
					});

					it('should create a background rect, an image tag, and a highlight rect', function () {
						/*
						 g.brixImage
						 	rect.background
						 	image
								desc
							rect.highlight
						 */
						var tree =
							{ name: 'g', class: 'brixImage', children:
								[ 
								{ name: 'rect', class: 'background'},
								{ name: 'image', children: [ { name: 'desc' } ] },
								{ name: 'rect', class: 'highlight'} ],
							};

						helper.expectElementTree(myImage.lastdrawn.widgetGroup, tree);
					});
				});
			});
		});
	});
})();
