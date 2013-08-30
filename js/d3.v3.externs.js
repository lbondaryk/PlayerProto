/* **************************************************************************
 * $Workfile:: d3.v3.externs.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Externs for d3 version 3
 *
 * Note that some functions use different return types depending on the number
 * of parameters passed in. In these cases, you may need to annotate the type
 * of the result in your code, so the JSCompiler understands which type you're
 * expecting. For example:
 *    <code>var elt = /** @type {Element} * / (foo.get(0));</code>
 *
 *
 * @see https://github.com/mbostock/d3/wiki/API-Reference
 * @externs
 *
 * **************************************************************************/

/**
 * An html string is expected to contain valid html, although it isn't enforced.
 *
 * @typedef {string} htmlString
 */
var htmlString;

/**
 * D3 uses CSS3 to select elements. For example, you can select by tag ("div"),
 * class (".awesome"), unique identifier ("#foo"), attribute ("[color=red]"),
 * or containment ("parent child"). Selectors can also be intersected
 * (".this.that" for logical AND) or unioned (".this, .that" for logical OR).
 *
 * @typedef {string} d3Selector
 */
var d3Selector;

/**
 * d3 data function is allowed for most of the d3.selection manipulation methods.
 * The 1st parameter is the datum associated w/ the element (d), the 2nd parameter
 * is the innermost index (i) of the element in the selection, the 3rd argument is
 * the next higher selection nesting index (j).
 * @typedef {function(Object=, ...[number]): (string|number|boolean)} d3DataFunc
 */
var d3DataFunc;

var d3 = {
    "version": {},
    "ascending": function () {},
    "descending": function () {},
    "min": function () {},
    "max": function () {},
    "extent": function () {},
    "sum": function () {},
    "mean": function () {},
    "quantile": function () {},
    "median": function () {},
    "bisector": function () {},
    "bisectLeft": function () {},
    "bisectRight": function () {},
    "bisect": function () {},
    "shuffle": function () {},
    "permute": function () {},
    "zip": function () {},
    "transpose": function () {},
    "keys": function () {},
    "values": function () {},
    "entries": function () {},
    "merge": function () {},
    "range": function () {},
    "map": function () {},
    "nest": function () {},
    "set": function () {},
    "behavior": {
        "drag": function () {},
        "zoom": function () {}
    },
    "rebind": function () {},
    "dispatch": function () {},
    "event": function () {},
    "requote": function () {},

    "ns": {
        "prefix": {
            "svg": {},
            "xhtml": {},
            "xlink": {},
            "xml": {},
            "xmlns": {}
        },
        "qualify": function () {}
    },

	/**
	 * Selects the first element that matches the specified selector string,
	 * returning a single-element selection. If no elements in the current
	 * document match the specified selector, returns the empty selection.
	 * If multiple elements match the selector, only the first matching element
	 * (in document traversal order) will be selected.
	 *
	 * @param {d3Selector|Element} selector
	 * @returns {!d3.selection}
	 */
    "select": function (selector) {},

	/**
	 * Selects all elements that match the specified selector. The elements will
	 * be selected in document traversal order (top-to-bottom). If no elements
	 * in the current document match the specified selector, returns the empty selection.
	 * @param {d3Selector|Array.<Element>} selector
	 * @returns {!d3.selection}
	 */
    "selectAll": function (selector) {},

    "mouse": function () {},
    "touches": function () {},
    "hsl": function () {},
    "hcl": function () {},
    "lab": function () {},
    "rgb": function () {},
    "functor": function () {},
    "xhr": function () {},
    "dsv": function () {},
    "csv": function () {},
    "tsv": function () {},
    "timer": function () {},
    "formatPrefix": function () {},
    "round": function () {},
    "format": function () {},
    "geo": {
        "stream": function () {},
        "area": function () {},
        "bounds": function () {},
        "centroid": function () {},
        "conicEqualArea": function () {},
        "albers": function () {},
        "albersUsa": function () {},
        "path": function () {},
        "projection": function () {},
        "projectionMutator": function () {},
        "equirectangular": function () {},
        "rotation": function () {},
        "circle": function () {},
        "distance": function () {},
        "graticule": function () {},
        "greatArc": function () {},
        "interpolate": function () {},
        "length": function () {},
        "azimuthalEqualArea": function () {},
        "azimuthalEquidistant": function () {},
        "conicConformal": function () {},
        "conicEquidistant": function () {},
        "gnomonic": function () {},
        "mercator": function () {},
        "orthographic": function () {},
        "stereographic": function () {},
        "transverseMercator": function () {}
    },
    "geom": {
        "hull": function () {},
        "polygon": function () {},
        "delaunay": function () {},
        "voronoi": function () {},
        "quadtree": function () {}
    },
    "svg": {
        "line": function () {},
        "arc": function () {},
        "area": function () {},
        "chord": function () {},
        "diagonal": function () {},
        "symbol": function () {},
        "symbolTypes": {
            "0": {},
            "1": {},
            "2": {},
            "3": {},
            "4": {},
            "5": {}
        },
        "axis": function () {},
        "brush": function () {}
    },
    "interpolateRgb": function () {},
    "interpolateObject": function () {},
    "interpolateNumber": function () {},
    "interpolateString": function () {},
    "interpolate": function () {},
    "interpolators": {
        "0": function () {}
    },
    "interpolateArray": function () {},
    "ease": function () {},
    "interpolateHcl": function () {},
    "interpolateHsl": function () {},
    "interpolateLab": function () {},
    "interpolateRound": function () {},
    "transform": function () {},
    "interpolateTransform": function () {},
    "layout": {
        "bundle": function () {},
        "chord": function () {},
        "force": function () {},
        "hierarchy": function () {},
        "partition": function () {},
        "pie": function () {},
        "stack": function () {},
        "histogram": function () {},
        "tree": function () {},
        "pack": function () {},
        "cluster": function () {},
        "treemap": function () {}
    },
    "random": {
        "normal": function () {},
        "logNormal": function () {},
        "irwinHall": function () {}
    },
    "scale": {
        "linear": function () {},
        "log": function () {},
        "pow": function () {},
        "sqrt": function () {},
        "ordinal": function () {},
        "category10": function () {},
        "category20": function () {},
        "category20b": function () {},
        "category20c": function () {},
        "quantile": function () {},
        "quantize": function () {},
        "threshold": function () {},
        "identity": function () {}
    },
    "transition": function () {},
    "time": {
        "year": function () {},
        "years": function () {},
        "day": function () {},
        "days": function () {},
        "dayOfYear": function () {},
        "sunday": function () {},
        "sundays": function () {},
        "sundayOfYear": function () {},
        "monday": function () {},
        "mondays": function () {},
        "mondayOfYear": function () {},
        "tuesday": function () {},
        "tuesdays": function () {},
        "tuesdayOfYear": function () {},
        "wednesday": function () {},
        "wednesdays": function () {},
        "wednesdayOfYear": function () {},
        "thursday": function () {},
        "thursdays": function () {},
        "thursdayOfYear": function () {},
        "friday": function () {},
        "fridays": function () {},
        "fridayOfYear": function () {},
        "saturday": function () {},
        "saturdays": function () {},
        "saturdayOfYear": function () {},
        "week": function () {},
        "weeks": function () {},
        "weekOfYear": function () {},
        "format": function () {},
        "second": function () {},
        "seconds": function () {},
        "minute": function () {},
        "minutes": function () {},
        "hour": function () {},
        "hours": function () {},
        "month": function () {},
        "months": function () {},
        "scale": function () {}
    },
    "text": function () {},
    "json": function () {},
    "html": function () {},
    "xml": function () {}
};

/**
 * Selections are arrays of elements—literally. D3 binds additional methods to
 * the array so that you can apply operators to the selected elements, such as
 * setting an attribute on all the selected elements. One nuance is that
 * selections are grouped: rather than a one-dimensional array, each selection
 * is an array of arrays of elements. This preserves the hierarchical structure
 * of subselections. Most of the time, you can ignore this detail, but that's
 * why a single-element selection looks like [[node]] rather than [node].
 *
 * @constructor
 */
d3.selection = function () {};

/**
 * @param {string} name
 * @param {(string|number|boolean|d3DataFunc)=} value
 * @returns {!d3.selection}
 */
d3.selection.prototype.attr = function (name, value) {};

/**
 * This operator is a convenience routine for setting the "class" attribute;
 * it understands that the "class" attribute is a set of tokens separated by
 * spaces. Under the hood, it will use the classList if available, for convenient
 * adding, removing and toggling of CSS classes.
 *
 * @param {string} name
 * @param {(boolean|function(Object, number=): boolean)=} value
 * @returns {!d3.selection}
 */
d3.selection.prototype.classed = function (name, value) {};

d3.selection.prototype.style = function () {};
d3.selection.prototype.property = function () {};

/**
 * The text operator is based on the textContent property; setting the text
 * content will replace any existing child elements.
 *
 * @param {(string|function(Object, ...[number]): string)=} value
 * @returns {!d3.selection}
 */
d3.selection.prototype.text = function (value) {};

/**
 * @param {(htmlString|function(Object, ...[number]): htmlString)=} value
 * @returns {!d3.selection}
 */
d3.selection.prototype.html = function (value) {};

/**
 * @param {(string|function(): Element)} name
 * @returns {!d3.selection}
 */
d3.selection.prototype.append = function (name) {};

/**
 * Inserts a new element with the specified name before the element matching
 * the specified before selector, for each element in the current selection,
 * returning a new selection containing the inserted elements. If the before
 * selector does not match any elements, then the new element will be the last
 * child as with append.
 *
 * @param {(string|function(): Element)} name
 * @param {(d3Selector|function(): Element)} before
 * @returns {!d3.selection}
 */
d3.selection.prototype.insert = function (name, before) {};

/**
 * Removes the elements in the current selection from the current document.
 * Returns the current selection (the same elements that were removed) which
 * are now "off-screen", detached from the DOM. Note that there is not
 * currently a dedicated API to add removed elements back to the document;
 * however, you can pass a function to selection.append or selection.insert
 * to re-add elements.
 *
 * @returns {!d3.selection}
 */
d3.selection.prototype.remove = function () {};

/**
 * Joins the specified array of data with the current selection. The specified
 * values is an array of data values, such as an array of numbers or objects,
 * or a function that returns an array of values. If a key function is not
 * specified, then the first datum in the specified array is assigned to the
 * first element in the current selection, the second datum to the second
 * selected element, and so on. When data is assigned to an element, it is
 * stored in the property __data__, thus making the data "sticky" so that the
 * data is available on re-selection.
 *
 * @param {Array.<*>=} values
 * @param {(function(*, number=): string)=} key
 * @returns {!d3.dataSelection}
 */
d3.selection.prototype.data = function (values, key) {};

d3.selection.prototype.enter = function () {};
d3.selection.prototype.enter = function () {};
d3.selection.prototype.datum = function () {};
d3.selection.prototype.filter = function () {};
d3.selection.prototype.sort = function () {};
d3.selection.prototype.order = function () {};
d3.selection.prototype.on = function () {};
d3.selection.prototype.transition = function () {};
d3.selection.prototype.interrupt = function () {};

/**
 * Invokes the specified function for each element in the current selection,
 * passing in the current datum d and index i, with the this context of the
 * current DOM element. This operator is used internally by nearly every other
 * operator, and can be used to invoke arbitrary code for each selected element.
 * The each operator can be used to process selections recursively, by using
 * d3.select(this) within the callback function.
 *
 * @param {function(Object=, ...[number])} fn
 * @return {!d3.selection}
 */
d3.selection.prototype.each = function (fn) {};

/**
 * Invokes the specified function once, passing in the current selection along
 * with any optional arguments. The call operator always returns the current
 * selection, regardless of the return value of the specified function. The
 * call operator is identical to invoking a function by hand; but it makes it
 * easier to use method chaining.
 *
 * @param {function(!d3.selection, ...)} fn
 * @param {...} var_args
 * @return {!d3.selection}
 */
d3.selection.prototype.call = function (fn, var_args) {};

/**
 * Returns true if the current selection is empty; a selection is empty
 * if it contains no non-null elements.
 *
 * @returns {boolean}
 */
d3.selection.prototype.empty = function () {};

d3.selection.prototype.node = function () {};
d3.selection.prototype.size = function () {};

/**
 * For each element in the current selection, selects the first descendant
 * element that matches the specified selector string. If no element matches
 * the specified selector for the current element, the element at the current
 * index will be null in the returned selection;
 *
 * @param {d3Selector} selector
 * @returns {!d3.selection}
 */
d3.selection.prototype.select = function (selector) {};

/**
 * For each element in the current selection, selects descendant elements that
 * match the specified selector string. The returned selection is grouped by
 * the ancestor node in the current selection. If no element matches the specified
 * selector for the current element, the group at the current index will be
 * empty in the returned selection. The subselection does not inherit data
 * from the current selection;
 *
 * @param {d3Selector} selector
 * @returns {!d3.selection}
 */
d3.selection.prototype.selectAll = function (selector) {};


/**
 * @constructor
 * @extends {d3.selection}
 */
d3.dataSelection = function () {};

/**
 * @returns {!d3.enterSelection}
 */
d3.dataSelection.prototype.enter = function() {};

/**
 * Returns the exiting selection: existing DOM elements in the current selection
 * for which no new data element was found. 
 * The exiting selection defines all the normal operators, though typically the
 * main one you'll want to use is remove; the other operators exist primarily so
 * you can define an exiting transition as desired.
 *
 * @returns {!d3.selection}
 */
d3.dataSelection.prototype.exit = function() {};

/**
 * @constructor
 */
d3.enterSelection = function () {};

/**
 * @param {(string|function(): Element)} name
 * @returns {!d3.selection}
 */
d3.enterSelection.prototype.append = function(name) {};

/**
 * @param {(string|function(): Element)} name
 * @param {(d3Selector|function(): Element)} before
 * @returns {!d3.selection}
 */
d3.enterSelection.prototype.insert = function(name, before) {};

/**
 * @param {d3Selector} selector
 * @returns {!d3.selection}
 */
d3.enterSelection.prototype.select = function(selector) {};

/** 
 * @param {function(!d3.selection, ...)} fn
 * @param {...} var_args
 * @return {!d3.selection}
 */
d3.enterSelection.prototype.call = function(fn, var_args) {};

/**
 * Returns true if the current selection is empty; a selection is empty
 * if it contains no non-null elements.
 *
 * @returns {boolean}
 */
d3.enterSelection.prototype.empty = function() {};

