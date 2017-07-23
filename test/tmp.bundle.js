(function () {
'use strict';

var isInitialized = false;
var noop = function () {};

var app = {
	state: {},
	actions: {},
	onUpdate: noop
};

function blixt(opts) {

	if (isInitialized) {
		throw Error('Blixt has already been initialized');
	}

	isInitialized = true;
	app.onUpdate = opts.onUpdate || app.onUpdate;
	var modules = opts.modules || {};
	Object.keys(modules).forEach(function(namespace) {
		app.state[namespace] = modules[namespace].state || {};
		app.actions[namespace] = modules[namespace].actions || {};
	});

	// return app.actions, so user can run app[namespace][action](args);
	return app.actions;

}

function update(label, state) {
	if ( label === void 0 ) label = '[Anonymous update]';
	if ( state === void 0 ) state = null;

	app.onUpdate(app.state, label, state);
}

function getState() {
	var path = [], len = arguments.length;
	while ( len-- ) path[ len ] = arguments[ len ];

	return path.reduce(function (state, segment) { return state[segment]; }, app.state);
}

function getContext(state, boundActions) {
	return {
		state: state,
		actions: boundActions
	};
}

var isPromise = function (x) { return x && x.constructor && (typeof x.then === 'function'); };

function maybeUpdate(result, callerName, state) {
	if (result && result.update === false) { return; }
	update(callerName, state);
}

function actions(actionsObj, fn) {
	if ( fn === void 0 ) fn = noop;

	return {
		bindTo: function bindTo(state) {
			fn(state);
			var boundActions = {};
			Object.keys(actionsObj).forEach(function(key) {
				var action = actionsObj[key];
				boundActions[key] = function() {
					var args = [], len = arguments.length;
					while ( len-- ) args[ len ] = arguments[ len ];

					// what if:
					// result = action.apply(getContext(state, boundActions), args)
					var result = action.apply(action, [getContext(state, boundActions)].concat(args));
					if (isPromise(result)) {
						return result.then(function(value) {
							fn(state);
							maybeUpdate(value, action.name, state);
						});
					}
					fn(state);
					maybeUpdate(result, action.name, state);
					return result;
				};
			});
			return boundActions;
		}
	};
}

blixt.getState = getState;
blixt.update = update;
blixt.actions = actions;

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) { keys.push(key); }
  return keys;
}
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}
});

var index$2 = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;



var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) { opts = {}; }
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') { return false; }
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') { return false; }
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    { return false; }
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) { return false; }
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (is_arguments(a)) {
    if (!is_arguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }
  try {
    var ka = keys(a),
        kb = keys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    { return false; }
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      { return false; }
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) { return false; }
  }
  return typeof a === typeof b;
}
});

var functionQueue = [];
var nestDepth = 0;

function makeGroup(label) {
	nestDepth++;
	console.group(label);
}

function endGroup() {
	nestDepth--;
	console.groupEnd();
}

window.addEventListener('error', function() {
	while (nestDepth > 0) {
		endGroup();
	}
});

var makeNoop = function () { return function () {}; };

var globalStartTime = performance.now();
var passCount = 0;
var failCount = 0;
var pendingCount = 0;

function it(label, fn) {
	var isPlaceholder = typeof fn !== 'function';
	var labeledFn = isPlaceholder ? makeNoop() : fn;
	labeledFn.label = label;
	labeledFn.isPlaceholder = isPlaceholder;
	functionQueue.push(labeledFn);
}

function safeStringify(obj) {
	var cache = [];
	var returnValue = JSON.stringify(obj, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) === -1) {
				cache.push(value);
				return value;
			}
			return '[CIRCULAR]';
		}
		return value;
	}, 2);
	cache = null;
	return returnValue;
}

function line(str) {
	return '\n\n' + str;
}

function assert(ref) {
	var condition = ref.condition;
	var label = ref.label;
	var source = ref.source;
	var type = ref.type;
	var value = ref.value;

	console.assert(
		condition,
		line('Expected:') +
		line(safeStringify(source)) +
		line('to ' + type + ':') +
		line(safeStringify(value)) +
		line('in "' + label + '"')
	);
}

function oneLineAssert(ref, hasValue) {
	var condition = ref.condition;
	var label = ref.label;
	var source = ref.source;
	var type = ref.type;
	var value = ref.value;

	var val = hasValue ? (value + ' ') : '';
	console.assert(
		condition,
		'Expected ' + source + ' to ' + type + ' ' + val + 'in "' + label + '"'
	);
}

function isSimple(x) {
	return (typeof x === 'boolean') || (typeof x === 'number') || (typeof x === 'string') || (x === null) || (x === undefined);
}

function logError(assertion) {
	failCount++;
	console.groupCollapsed(
		'%c[ ✗ ] %c' + assertion.label,
		'color: #e71600',
		'color: inherit; font-weight: 400'
	);
	if (Object.prototype.hasOwnProperty.call(assertion, 'value')) {
		if (isSimple(assertion.source) && isSimple(assertion.value)) {
			oneLineAssert(assertion, true);
		}
		else {
			assert(assertion);
		}
	}
	else {
		oneLineAssert(assertion, false);
	}
	if (assertion.error) {
		console.error(assertion.error);
	}
	console.groupEnd();
}

function logSuccess(label, time) {
	passCount++;
	console.log(
		'%c[ ✓ ] %c' + label + '%c' + (time ? (' [' + time + 'ms]') : ''),
		'color: #27ae60',
		'color: inherit',
		'color: #f39c12; font-style: italic'
	);
}

function callWithExpect(fn, cb) {

	var label = fn.label;
	if (!label) {
		fn();
		return;
	}

	if (fn.isPlaceholder) {
		pendingCount++;
		console.log(
			'%c[ i ] %c' + fn.label,
			'color: #3498db',
			'color: #3498db; font-weight: bold; font-style: italic'
		);
		return;
	}

	var assertions = [];
	function expect(source) {

		var negate = false;
		var deep = false;

		var handlers = {
			get to() {
				return handlers;
			},
			get not() {
				negate = !negate;
				return handlers;
			},
			get deep() {
				deep = true;
				return handlers;
			},
			equal: function equal(value) {
				var isEqual = false;
				if (deep) { isEqual = index$2(source, value, { strict: true }); }
				else { isEqual = value === source; }
				var condition = negate ? !(isEqual) : isEqual;
				var type = [
					negate ? 'not ' : '',
					deep ? 'deep ' : '',
					'equal'
				].join('');
				assertions.push({
					type: type,
					label: label,
					condition: condition,
					source: source,
					value: value
				});
			},
			explode: function explode() {
				if (typeof source !== 'function') {
					console.warn(
						'You are calling expect::explode without passing it a function in "' +
						label + '".\n\n' +
						'You passed:\n\n' +
						safeStringify(source) +
						'\n\n' +
						'Correct usage:\n\n' +
						'expect(function() { /* ... */ }).to.explode()'
					);
				}
				var threw = false;
				var error = null;
				try { source(); }
				catch (err) { threw = true; error = err; }
				var condition = negate ? !(threw) : threw;
				var type = [
					negate ? 'not ' : '',
					'throw'
				].join('');
				assertions.push({
					type: type,
					label: label,
					condition: condition,
					error: error,
					source: '[Function ' + (source.name || '(Anonymous function)') + ']'
				});
			}
		};

		return handlers;

	}

	function runAssertions(time) {
		var error = null;
		var i = 0;
		while (i < assertions.length) {
			if (!assertions[i].condition) {
				error = assertions[i];
				break;
			}
			i++;
		}
		if (error) { logError(error); }
		else { logSuccess(label, time); }
	}

	var isAsync = typeof cb === 'function';
	if (isAsync) {
		var calledDone = false;
		var start = performance.now();
		fn(expect, function done() {
			if (!calledDone) {
				calledDone = true;
				var end = performance.now();
				runAssertions((end - start).toFixed());
				cb();
			}
		});
		setTimeout(function() {
			if (!calledDone) {
				calledDone = true;
				logError({
					label: label + ' [' + test.timeout + 'ms timeout]',
					type: 'complete within ' + test.timeout + 'ms',
					condition: false,
					source: 'async assertion'
				});
				cb();
			}
		}, test.timeout);
	}
	else {
		fn(expect);
		runAssertions();
	}

}

function unwindQueue(queue) {

	if (queue.length === 0) {
		var time = performance.now() - globalStartTime;
		var timeStr = time > 9999 ? (time / 1000).toFixed(2) + 's' : time.toFixed() + 'ms';
		console.log(
			'%c%d passed%c [%s]',
			'color: #27ae60',
			passCount,
			'color: #f39c12; font-style: italic',
			timeStr
		);
		if (failCount > 0) {
			console.log('%c%d failed', 'color: #e71600', failCount);
		}
		if (pendingCount > 0) {
			console.log('%c%d pending', 'color: #3498db', pendingCount);
		}
		return;
	}

	var fn = queue.shift();
	var isAsync = fn.length === 2; // function(expect, done) { ... }
	if (isAsync) {
		callWithExpect(fn, function() {
			unwindQueue(queue);
		});
	}
	else {
		callWithExpect(fn);
		unwindQueue(queue);
	}
}

function test(label, fn) {
	functionQueue.push(makeGroup.bind(null, label));
	fn(it);
	functionQueue.push(endGroup);
	return function () { return setTimeout(function () { return unwindQueue(functionQueue); }, 0); };
}

test.timeout = 2000;

var index$1 = test;

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

function getType(x) {
	var currentType = toStr.call(x).slice(8, -1).toLowerCase();
	if (currentType === 'array' && x.length > 0) {
		return '[array of ' + getType(x[0]) + 's]';
	}
	return currentType;
}

function typeStringFromArray(arr) {
	if (arr.length === 1) {
		return arr[0].type;
	}
	return arr.map(function(typeCheckFn) {
		return typeCheckFn.type;
	}).join(' || ');
}

function T$1(schema) {

	return function(props, label) {

		if (T$1.disabled) { return; }

		var loop = function ( key ) {

			if (hasOwn.call(schema, key)) {

				var rules = Array.isArray(schema[key]) ? schema[key] : [schema[key]];
				var success = rules.reduce(function(prev, rule) {
					return prev || rule(props[key], label);
				}, false);

				if (!success) {

					var errorMessage =
						'Failed type check in ' + (label || 'unknown object') + '\n' +
						'Expected prop \'' + key + '\' of type ' + typeStringFromArray(rules) + '\n' +
						'You provided \'' + key + '\' of type ' + getType(props[key]);

					if (T$1.throws) {
						throw new TypeError(errorMessage);
					}

					// recursive call will report errors in next round of checks
					if (typeStringFromArray(rules).indexOf('interface') > -1) {
						return;
					}

					console.error(errorMessage);
					return { v: errorMessage };
				}
			
			}

		};

		for (var key in schema) {
			var returned = loop( key );

			if ( returned ) return returned.v;
		}

		for (var key$1 in props) {
			if (hasOwn.call(props, key$1) && !hasOwn.call(schema, key$1)) {
				var errorMessage$1 = 'Did not expect to find prop \'' + key$1 + '\' in ' + label;
				console.error(errorMessage$1);
				return errorMessage$1;
			}
		}

		return null;

	};

}

T$1.fn = T$1['function'] = function(x) {
	return typeof x === 'function';
};

T$1.fn.type = 'function';

T$1.str = T$1.string = function(x) {
	return typeof x === 'string';
};

T$1.str.type = 'string';

T$1.num = T$1.number = function(x) {
	return typeof x === 'number';
};

T$1.num.type = 'number';

T$1.date = function(x) {
	return getType(x) === 'date';
};

T$1.date.type = 'date';

T$1.NULL = T$1['null'] = function(x) {
	return getType(x) === 'null';
};

T$1.NULL.type = 'null';

T$1.nil = function(x) {
	return typeof x === 'undefined' || getType(x) === 'null';
};

T$1.nil.type = 'nil';

T$1.obj = T$1.object = function(x) {
	return getType(x) === 'object';
};

T$1.obj.type = 'object';

T$1.arr = T$1.array = function(x) {
	return Array.isArray(x);
};

T$1.arr.type = 'array';

T$1.arrayOf = function(propType) {

	var arrayOfType = function(x) {

		if (!Array.isArray(x)) {
			return false;
		}

		for (var i = 0; i < x.length; i++) {
			if (!propType(x[i])) {
				return false;
			}
		}

		return true;

	};

	arrayOfType.type = '[array of ' + propType.type + 's]';

	return arrayOfType;

};

T$1.not = function(propType) {

	var notType = function(x) {
		return !propType(x);
	};

	notType.type = 'not(' + propType.type + ')';

	return notType;

};

T$1['int'] = T$1.integer = function(x) {
	return typeof x === 'number' && isFinite(x) && Math.floor(x) === x;
};


T$1.integer.type = 'integer';

T$1.optional = T$1.undefined = function(x) {
	return typeof x === 'undefined';
};

T$1.optional.type = 'undefined';

T$1.bool = T$1['boolean'] = function(x) {
	return typeof x === 'boolean';
};

T$1.bool.type = 'boolean';

function quoteIfString(x) {
	return typeof x === 'string' ? ('"' + x + '"') : x;
}

T$1.exact = function(exactValue) {
	var exactType = function(x) {
		return x === exactValue;
	};
	var formattedValue = quoteIfString(exactValue);
	exactType.type = 'exact(' + formattedValue + ')';
	return exactType;
};

T$1.oneOf = function(values) {
	var oneOfType = function(x) {
		return values.reduce(function (success, next) { return success || (x === next); }, false);
	};
	var formattedValue = '[' + values.map(quoteIfString).join(', ') + ']';
	oneOfType.type = 'oneOf(' + formattedValue + ')';
	return oneOfType;
};

T$1.any = function() {
	return true;
};

T$1.any.type = 'any';

// recursive
T$1.schema = T$1['interface'] = function(schema) {
	var schemaType = function(prop, label) {
		return !T$1(schema)(prop, label || 'nested interface'); // returns null if success, so invert as boolean
	};
	schemaType.type = 'interface';
	return schemaType;
};

T$1.disabled = false;
T$1.throws = false;

var index$5 = T$1;

var index$4 = index$5;

function batch(fn) {
	var updateScheduled = false;
	return function batchUpdate() {
		var args = [], len = arguments.length;
		while ( len-- ) args[ len ] = arguments[ len ];

		if (updateScheduled) { return; }
		updateScheduled = true;
		setTimeout(function() {
			updateScheduled = false;
			fn.apply(fn, args);
		}, 0);
	};
}

function Vnode(tag, key, attrs, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: undefined, _state: undefined, events: undefined, instance: undefined, skip: false}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) { return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined) }
	if (node != null && typeof node !== "object") { return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined) }
	return node
};
Vnode.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Vnode.normalize(children[i]);
	}
	return children
};

var vnode = Vnode;

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
var selectorCache = {};
var hasOwn$1 = {}.hasOwnProperty;

function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {};
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2];
		if (type === "" && value !== "") { tag = value; }
		else if (type === "#") { attrs.id = value; }
		else if (type === ".") { classes.push(value); }
		else if (match[3][0] === "[") {
			var attrValue = match[6];
			if (attrValue) { attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\"); }
			if (match[4] === "class") { classes.push(attrValue); }
			else { attrs[match[4]] = attrValue || true; }
		}
	}
	if (classes.length > 0) { attrs.className = classes.join(" "); }
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}

function execSelector(state, attrs, children) {
	var hasAttrs = false, childList, text;
	var className = attrs.className || attrs.class;

	for (var key in state.attrs) {
		if (hasOwn$1.call(state.attrs, key)) {
			attrs[key] = state.attrs[key];
		}
	}

	if (className !== undefined) {
		if (attrs.class !== undefined) {
			attrs.class = undefined;
			attrs.className = className;
		}

		if (state.attrs.className != null) {
			attrs.className = state.attrs.className + " " + className;
		}
	}

	for (var key in attrs) {
		if (hasOwn$1.call(attrs, key) && key !== "key") {
			hasAttrs = true;
			break
		}
	}

	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		text = children[0].children;
	} else {
		childList = children;
	}

	return vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
}

function hyperscript(selector) {
	var arguments$1 = arguments;

	// Because sloppy mode sucks
	var attrs = arguments[1], start = 2, children;

	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}

	if (typeof selector === "string") {
		var cached = selectorCache[selector] || compileSelector(selector);
	}

	if (attrs == null) {
		attrs = {};
	} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
		attrs = {};
		start = 1;
	}

	if (arguments.length === start + 1) {
		children = arguments[start];
		if (!Array.isArray(children)) { children = [children]; }
	} else {
		children = [];
		while (start < arguments.length) { children.push(arguments$1[start++]); }
	}

	var normalized = vnode.normalizeChildren(children);

	if (typeof selector === "string") {
		return execSelector(cached, attrs, normalized)
	} else {
		return vnode(selector, attrs.key, attrs, normalized)
	}
}

var hyperscript_1$1 = hyperscript;

var trust = function(html) {
	if (html == null) { html = ""; }
	return vnode("<", undefined, undefined, html, undefined, undefined)
};

var fragment = function(attrs, children) {
	return vnode("[", attrs.key, attrs, vnode.normalizeChildren(children), undefined, undefined)
};

hyperscript_1$1.trust = trust;
hyperscript_1$1.fragment = fragment;

var hyperscript_1 = hyperscript_1$1;

var render$2 = function($window) {
	var $doc = $window.document;
	var $emptyFragment = $doc.createDocumentFragment();

	var onevent;
	function setEventCallback(callback) {return onevent = callback}

	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				createNode(parent, vnode$$1, hooks, ns, nextSibling);
			}
		}
	}
	function createNode(parent, vnode$$1, hooks, ns, nextSibling) {
		var tag = vnode$$1.tag;
		if (typeof tag === "string") {
			vnode$$1.state = {};
			if (vnode$$1.attrs != null) { initLifecycle(vnode$$1.attrs, vnode$$1, hooks); }
			switch (tag) {
				case "#": return createText(parent, vnode$$1, nextSibling)
				case "<": return createHTML(parent, vnode$$1, nextSibling)
				case "[": return createFragment(parent, vnode$$1, hooks, ns, nextSibling)
				default: return createElement(parent, vnode$$1, hooks, ns, nextSibling)
			}
		}
		else { return createComponent(parent, vnode$$1, hooks, ns, nextSibling) }
	}
	function createText(parent, vnode$$1, nextSibling) {
		vnode$$1.dom = $doc.createTextNode(vnode$$1.children);
		insertNode(parent, vnode$$1.dom, nextSibling);
		return vnode$$1.dom
	}
	function createHTML(parent, vnode$$1, nextSibling) {
		var match = vnode$$1.children.match(/^\s*?<(\w+)/im) || [];
		var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match[1]] || "div";
		var temp = $doc.createElement(parent1);

		temp.innerHTML = vnode$$1.children;
		vnode$$1.dom = temp.firstChild;
		vnode$$1.domSize = temp.childNodes.length;
		var fragment = $doc.createDocumentFragment();
		var child;
		while (child = temp.firstChild) {
			fragment.appendChild(child);
		}
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createFragment(parent, vnode$$1, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment();
		if (vnode$$1.children != null) {
			var children = vnode$$1.children;
			createNodes(fragment, children, 0, children.length, hooks, null, ns);
		}
		vnode$$1.dom = fragment.firstChild;
		vnode$$1.domSize = fragment.childNodes.length;
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createElement(parent, vnode$$1, hooks, ns, nextSibling) {
		var tag = vnode$$1.tag;
		switch (vnode$$1.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}

		var attrs = vnode$$1.attrs;
		var is = attrs && attrs.is;

		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag);
		vnode$$1.dom = element;

		if (attrs != null) {
			setAttrs(vnode$$1, attrs, ns);
		}

		insertNode(parent, element, nextSibling);

		if (vnode$$1.attrs != null && vnode$$1.attrs.contenteditable != null) {
			setContentEditable(vnode$$1);
		}
		else {
			if (vnode$$1.text != null) {
				if (vnode$$1.text !== "") { element.textContent = vnode$$1.text; }
				else { vnode$$1.children = [vnode("#", undefined, undefined, vnode$$1.text, undefined, undefined)]; }
			}
			if (vnode$$1.children != null) {
				var children = vnode$$1.children;
				createNodes(element, children, 0, children.length, hooks, null, ns);
				setLateAttrs(vnode$$1);
			}
		}
		return element
	}
	function initComponent(vnode$$1, hooks) {
		var sentinel;
		if (typeof vnode$$1.tag.view === "function") {
			vnode$$1.state = Object.create(vnode$$1.tag);
			sentinel = vnode$$1.state.view;
			if (sentinel.$$reentrantLock$$ != null) { return $emptyFragment }
			sentinel.$$reentrantLock$$ = true;
		} else {
			vnode$$1.state = void 0;
			sentinel = vnode$$1.tag;
			if (sentinel.$$reentrantLock$$ != null) { return $emptyFragment }
			sentinel.$$reentrantLock$$ = true;
			vnode$$1.state = (vnode$$1.tag.prototype != null && typeof vnode$$1.tag.prototype.view === "function") ? new vnode$$1.tag(vnode$$1) : vnode$$1.tag(vnode$$1);
		}
		vnode$$1._state = vnode$$1.state;
		if (vnode$$1.attrs != null) { initLifecycle(vnode$$1.attrs, vnode$$1, hooks); }
		initLifecycle(vnode$$1._state, vnode$$1, hooks);
		vnode$$1.instance = vnode.normalize(vnode$$1._state.view.call(vnode$$1.state, vnode$$1));
		if (vnode$$1.instance === vnode$$1) { throw Error("A view cannot return the vnode it received as argument") }
		sentinel.$$reentrantLock$$ = null;
	}
	function createComponent(parent, vnode$$1, hooks, ns, nextSibling) {
		initComponent(vnode$$1, hooks);
		if (vnode$$1.instance != null) {
			var element = createNode(parent, vnode$$1.instance, hooks, ns, nextSibling);
			vnode$$1.dom = vnode$$1.instance.dom;
			vnode$$1.domSize = vnode$$1.dom != null ? vnode$$1.instance.domSize : 0;
			insertNode(parent, element, nextSibling);
			return element
		}
		else {
			vnode$$1.domSize = 0;
			return $emptyFragment
		}
	}

	//update
	function updateNodes(parent, old, vnodes, recycling, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) { return }
		else if (old == null) { createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, undefined); }
		else if (vnodes == null) { removeNodes(old, 0, old.length, vnodes); }
		else {
			if (old.length === vnodes.length) {
				var isUnkeyed = false;
				for (var i = 0; i < vnodes.length; i++) {
					if (vnodes[i] != null && old[i] != null) {
						isUnkeyed = vnodes[i].key == null && old[i].key == null;
						break
					}
				}
				if (isUnkeyed) {
					for (var i = 0; i < old.length; i++) {
						if (old[i] === vnodes[i]) { continue }
						else if (old[i] == null && vnodes[i] != null) { createNode(parent, vnodes[i], hooks, ns, getNextSibling(old, i + 1, nextSibling)); }
						else if (vnodes[i] == null) { removeNodes(old, i, i + 1, vnodes); }
						else { updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns); }
					}
					return
				}
			}
			recycling = recycling || isRecyclable(old, vnodes);
			if (recycling) {
				var pool = old.pool;
				old = old.concat(old.pool);
			}

			var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map;
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldStart], v = vnodes[start];
				if (o === v && !recycling) { oldStart++, start++; }
				else if (o == null) { oldStart++; }
				else if (v == null) { start++; }
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldStart >= old.length - pool.length) || ((pool == null) && recycling);
					oldStart++, start++;
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) { insertNode(parent, toFragment(o), nextSibling); }
				}
				else {
					var o = old[oldEnd];
					if (o === v && !recycling) { oldEnd--, start++; }
					else if (o == null) { oldEnd--; }
					else if (v == null) { start++; }
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
						if (recycling || start < end) { insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling)); }
						oldEnd--, start++;
					}
					else { break }
				}
			}
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldEnd], v = vnodes[end];
				if (o === v && !recycling) { oldEnd--, end--; }
				else if (o == null) { oldEnd--; }
				else if (v == null) { end--; }
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) { insertNode(parent, toFragment(o), nextSibling); }
					if (o.dom != null) { nextSibling = o.dom; }
					oldEnd--, end--;
				}
				else {
					if (!map) { map = getKeyMap(old, oldEnd); }
					if (v != null) {
						var oldIndex = map[v.key];
						if (oldIndex != null) {
							var movable = old[oldIndex];
							var shouldRecycle = (pool != null && oldIndex >= old.length - pool.length) || ((pool == null) && recycling);
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns);
							insertNode(parent, toFragment(movable), nextSibling);
							old[oldIndex].skip = true;
							if (movable.dom != null) { nextSibling = movable.dom; }
						}
						else {
							var dom = createNode(parent, v, hooks, undefined, nextSibling);
							nextSibling = dom;
						}
					}
					end--;
				}
				if (end < start) { break }
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
			removeNodes(old, oldStart, oldEnd + 1, vnodes);
		}
	}
	function updateNode(parent, old, vnode$$1, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode$$1.tag;
		if (oldTag === tag) {
			vnode$$1.state = old.state;
			vnode$$1._state = old._state;
			vnode$$1.events = old.events;
			if (!recycling && shouldNotUpdate(vnode$$1, old)) { return }
			if (typeof oldTag === "string") {
				if (vnode$$1.attrs != null) {
					if (recycling) {
						vnode$$1.state = {};
						initLifecycle(vnode$$1.attrs, vnode$$1, hooks);
					}
					else { updateLifecycle(vnode$$1.attrs, vnode$$1, hooks); }
				}
				switch (oldTag) {
					case "#": updateText(old, vnode$$1); break
					case "<": updateHTML(parent, old, vnode$$1, nextSibling); break
					case "[": updateFragment(parent, old, vnode$$1, recycling, hooks, nextSibling, ns); break
					default: updateElement(old, vnode$$1, recycling, hooks, ns);
				}
			}
			else { updateComponent(parent, old, vnode$$1, hooks, nextSibling, recycling, ns); }
		}
		else {
			removeNode(old, null);
			createNode(parent, vnode$$1, hooks, ns, nextSibling);
		}
	}
	function updateText(old, vnode$$1) {
		if (old.children.toString() !== vnode$$1.children.toString()) {
			old.dom.nodeValue = vnode$$1.children;
		}
		vnode$$1.dom = old.dom;
	}
	function updateHTML(parent, old, vnode$$1, nextSibling) {
		if (old.children !== vnode$$1.children) {
			toFragment(old);
			createHTML(parent, vnode$$1, nextSibling);
		}
		else { vnode$$1.dom = old.dom, vnode$$1.domSize = old.domSize; }
	}
	function updateFragment(parent, old, vnode$$1, recycling, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode$$1.children, recycling, hooks, nextSibling, ns);
		var domSize = 0, children = vnode$$1.children;
		vnode$$1.dom = null;
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				if (child != null && child.dom != null) {
					if (vnode$$1.dom == null) { vnode$$1.dom = child.dom; }
					domSize += child.domSize || 1;
				}
			}
			if (domSize !== 1) { vnode$$1.domSize = domSize; }
		}
	}
	function updateElement(old, vnode$$1, recycling, hooks, ns) {
		var element = vnode$$1.dom = old.dom;
		switch (vnode$$1.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}
		if (vnode$$1.tag === "textarea") {
			if (vnode$$1.attrs == null) { vnode$$1.attrs = {}; }
			if (vnode$$1.text != null) {
				vnode$$1.attrs.value = vnode$$1.text; //FIXME handle multiple children
				vnode$$1.text = undefined;
			}
		}
		updateAttrs(vnode$$1, old.attrs, vnode$$1.attrs, ns);
		if (vnode$$1.attrs != null && vnode$$1.attrs.contenteditable != null) {
			setContentEditable(vnode$$1);
		}
		else if (old.text != null && vnode$$1.text != null && vnode$$1.text !== "") {
			if (old.text.toString() !== vnode$$1.text.toString()) { old.dom.firstChild.nodeValue = vnode$$1.text; }
		}
		else {
			if (old.text != null) { old.children = [vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]; }
			if (vnode$$1.text != null) { vnode$$1.children = [vnode("#", undefined, undefined, vnode$$1.text, undefined, undefined)]; }
			updateNodes(element, old.children, vnode$$1.children, recycling, hooks, null, ns);
		}
	}
	function updateComponent(parent, old, vnode$$1, hooks, nextSibling, recycling, ns) {
		if (recycling) {
			initComponent(vnode$$1, hooks);
		} else {
			vnode$$1.instance = vnode.normalize(vnode$$1._state.view.call(vnode$$1.state, vnode$$1));
			if (vnode$$1.instance === vnode$$1) { throw Error("A view cannot return the vnode it received as argument") }
			if (vnode$$1.attrs != null) { updateLifecycle(vnode$$1.attrs, vnode$$1, hooks); }
			updateLifecycle(vnode$$1._state, vnode$$1, hooks);
		}
		if (vnode$$1.instance != null) {
			if (old.instance == null) { createNode(parent, vnode$$1.instance, hooks, ns, nextSibling); }
			else { updateNode(parent, old.instance, vnode$$1.instance, hooks, nextSibling, recycling, ns); }
			vnode$$1.dom = vnode$$1.instance.dom;
			vnode$$1.domSize = vnode$$1.instance.domSize;
		}
		else if (old.instance != null) {
			removeNode(old.instance, null);
			vnode$$1.dom = undefined;
			vnode$$1.domSize = 0;
		}
		else {
			vnode$$1.dom = old.dom;
			vnode$$1.domSize = old.domSize;
		}
	}
	function isRecyclable(old, vnodes) {
		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0;
			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0;
			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0;
			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
				return true
			}
		}
		return false
	}
	function getKeyMap(vnodes, end) {
		var map = {}, i = 0;
		for (var i = 0; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				var key = vnode$$1.key;
				if (key != null) { map[key] = i; }
			}
		}
		return map
	}
	function toFragment(vnode$$1) {
		var count = vnode$$1.domSize;
		if (count != null || vnode$$1.dom == null) {
			var fragment = $doc.createDocumentFragment();
			if (count > 0) {
				var dom = vnode$$1.dom;
				while (--count) { fragment.appendChild(dom.nextSibling); }
				fragment.insertBefore(dom, fragment.firstChild);
			}
			return fragment
		}
		else { return vnode$$1.dom }
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) { return vnodes[i].dom }
		}
		return nextSibling
	}

	function insertNode(parent, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) { parent.insertBefore(dom, nextSibling); }
		else { parent.appendChild(dom); }
	}

	function setContentEditable(vnode$$1) {
		var children = vnode$$1.children;
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children;
			if (vnode$$1.dom.innerHTML !== content) { vnode$$1.dom.innerHTML = content; }
		}
		else if (vnode$$1.text != null || children != null && children.length !== 0) { throw new Error("Child node of a contenteditable must be trusted") }
	}

	//remove
	function removeNodes(vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				if (vnode$$1.skip) { vnode$$1.skip = false; }
				else { removeNode(vnode$$1, context); }
			}
		}
	}
	function removeNode(vnode$$1, context) {
		var expected = 1, called = 0;
		if (vnode$$1.attrs && typeof vnode$$1.attrs.onbeforeremove === "function") {
			var result = vnode$$1.attrs.onbeforeremove.call(vnode$$1.state, vnode$$1);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onbeforeremove === "function") {
			var result = vnode$$1._state.onbeforeremove.call(vnode$$1.state, vnode$$1);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		continuation();
		function continuation() {
			if (++called === expected) {
				onremove(vnode$$1);
				if (vnode$$1.dom) {
					var count = vnode$$1.domSize || 1;
					if (count > 1) {
						var dom = vnode$$1.dom;
						while (--count) {
							removeNodeFromDOM(dom.nextSibling);
						}
					}
					removeNodeFromDOM(vnode$$1.dom);
					if (context != null && vnode$$1.domSize == null && !hasIntegrationMethods(vnode$$1.attrs) && typeof vnode$$1.tag === "string") { //TODO test custom elements
						if (!context.pool) { context.pool = [vnode$$1]; }
						else { context.pool.push(vnode$$1); }
					}
				}
			}
		}
	}
	function removeNodeFromDOM(node) {
		var parent = node.parentNode;
		if (parent != null) { parent.removeChild(node); }
	}
	function onremove(vnode$$1) {
		if (vnode$$1.attrs && typeof vnode$$1.attrs.onremove === "function") { vnode$$1.attrs.onremove.call(vnode$$1.state, vnode$$1); }
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onremove === "function") { vnode$$1._state.onremove.call(vnode$$1.state, vnode$$1); }
		if (vnode$$1.instance != null) { onremove(vnode$$1.instance); }
		else {
			var children = vnode$$1.children;
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child != null) { onremove(child); }
				}
			}
		}
	}

	//attrs
	function setAttrs(vnode$$1, attrs, ns) {
		for (var key in attrs) {
			setAttr(vnode$$1, key, null, attrs[key], ns);
		}
	}
	function setAttr(vnode$$1, key, old, value, ns) {
		var element = vnode$$1.dom;
		if (key === "key" || key === "is" || (old === value && !isFormAttribute(vnode$$1, key)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) { return }
		var nsLastIndex = key.indexOf(":");
		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value);
		}
		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") { updateEvent(vnode$$1, key, value); }
		else if (key === "style") { updateStyle(element, old, value); }
		else if (key in element && !isAttribute(key) && ns === undefined && !isCustomElement(vnode$$1)) {
			//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
			if (vnode$$1.tag === "input" && key === "value" && vnode$$1.dom.value == value && vnode$$1.dom === $doc.activeElement) { return }
			//setting select[value] to same value while having select open blinks select dropdown in Chrome
			if (vnode$$1.tag === "select" && key === "value" && vnode$$1.dom.value == value && vnode$$1.dom === $doc.activeElement) { return }
			//setting option[value] to same value while having select open blinks select dropdown in Chrome
			if (vnode$$1.tag === "option" && key === "value" && vnode$$1.dom.value == value) { return }
			// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
			if (vnode$$1.tag === "input" && key === "type") {
				element.setAttribute(key, value);
				return
			}
			element[key] = value;
		}
		else {
			if (typeof value === "boolean") {
				if (value) { element.setAttribute(key, ""); }
				else { element.removeAttribute(key); }
			}
			else { element.setAttribute(key === "className" ? "class" : key, value); }
		}
	}
	function setLateAttrs(vnode$$1) {
		var attrs = vnode$$1.attrs;
		if (vnode$$1.tag === "select" && attrs != null) {
			if ("value" in attrs) { setAttr(vnode$$1, "value", null, attrs.value, undefined); }
			if ("selectedIndex" in attrs) { setAttr(vnode$$1, "selectedIndex", null, attrs.selectedIndex, undefined); }
		}
	}
	function updateAttrs(vnode$$1, old, attrs, ns) {
		if (attrs != null) {
			for (var key in attrs) {
				setAttr(vnode$$1, key, old && old[key], attrs[key], ns);
			}
		}
		if (old != null) {
			for (var key in old) {
				if (attrs == null || !(key in attrs)) {
					if (key === "className") { key = "class"; }
					if (key[0] === "o" && key[1] === "n" && !isLifecycleMethod(key)) { updateEvent(vnode$$1, key, undefined); }
					else if (key !== "key") { vnode$$1.dom.removeAttribute(key); }
				}
			}
		}
	}
	function isFormAttribute(vnode$$1, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode$$1.dom === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function isCustomElement(vnode$$1){
		return vnode$$1.attrs.is || vnode$$1.tag.indexOf("-") > -1
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}

	//style
	function updateStyle(element, old, style) {
		if (old === style) { element.style.cssText = "", old = null; }
		if (style == null) { element.style.cssText = ""; }
		else if (typeof style === "string") { element.style.cssText = style; }
		else {
			if (typeof old === "string") { element.style.cssText = ""; }
			for (var key in style) {
				element.style[key] = style[key];
			}
			if (old != null && typeof old !== "string") {
				for (var key in old) {
					if (!(key in style)) { element.style[key] = ""; }
				}
			}
		}
	}

	//event
	function updateEvent(vnode$$1, key, value) {
		var element = vnode$$1.dom;
		var callback = typeof onevent !== "function" ? value : function(e) {
			var result = value.call(element, e);
			onevent.call(element, e);
			return result
		};
		if (key in element) { element[key] = typeof value === "function" ? callback : null; }
		else {
			var eventName = key.slice(2);
			if (vnode$$1.events === undefined) { vnode$$1.events = {}; }
			if (vnode$$1.events[key] === callback) { return }
			if (vnode$$1.events[key] != null) { element.removeEventListener(eventName, vnode$$1.events[key], false); }
			if (typeof value === "function") {
				vnode$$1.events[key] = callback;
				element.addEventListener(eventName, vnode$$1.events[key], false);
			}
		}
	}

	//lifecycle
	function initLifecycle(source, vnode$$1, hooks) {
		if (typeof source.oninit === "function") { source.oninit.call(vnode$$1.state, vnode$$1); }
		if (typeof source.oncreate === "function") { hooks.push(source.oncreate.bind(vnode$$1.state, vnode$$1)); }
	}
	function updateLifecycle(source, vnode$$1, hooks) {
		if (typeof source.onupdate === "function") { hooks.push(source.onupdate.bind(vnode$$1.state, vnode$$1)); }
	}
	function shouldNotUpdate(vnode$$1, old) {
		var forceVnodeUpdate, forceComponentUpdate;
		if (vnode$$1.attrs != null && typeof vnode$$1.attrs.onbeforeupdate === "function") { forceVnodeUpdate = vnode$$1.attrs.onbeforeupdate.call(vnode$$1.state, vnode$$1, old); }
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onbeforeupdate === "function") { forceComponentUpdate = vnode$$1._state.onbeforeupdate.call(vnode$$1.state, vnode$$1, old); }
		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
			vnode$$1.dom = old.dom;
			vnode$$1.domSize = old.domSize;
			vnode$$1.instance = old.instance;
			return true
		}
		return false
	}

	function render(dom, vnodes) {
		if (!dom) { throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.") }
		var hooks = [];
		var active = $doc.activeElement;

		// First time rendering into a node clears it out
		if (dom.vnodes == null) { dom.textContent = ""; }

		if (!Array.isArray(vnodes)) { vnodes = [vnodes]; }
		updateNodes(dom, dom.vnodes, vnode.normalizeChildren(vnodes), false, hooks, null, undefined);
		dom.vnodes = vnodes;
		for (var i = 0; i < hooks.length; i++) { hooks[i](); }
		if ($doc.activeElement !== active) { active.focus(); }
	}

	return {render: render, setEventCallback: setEventCallback}
};

var render$1 = render$2(window);

function Game() {
  app$1.game.start();
  var colors = blixt.getState('game', 'colors');
  return {
    view: function view() {
      var state = blixt.getState('game');
      var score = 'Score: ' + state.score;
      var highScore = 'High score: ' + state.highScore;
      var gameOver = state.gameOver ? hyperscript_1('.GameOver', 'Game over', hyperscript_1('button.right', { onclick: app$1.game.start }, 'Play again')) : null;
      return [
        hyperscript_1('.Game',
          hyperscript_1('h1.left', score),
          hyperscript_1('h1.right', highScore),
          hyperscript_1('.Colors',
            colors.map(function(color, i) {
              var className = [
                color,
                color === state.activeChoice ? 'active' : '',
                state.isDisabled ? 'disabled' : '' ].join(' ');
              return hyperscript_1('.Color', {
                className: className,
                onclick: function onclick() {
                  if (!state.isDisabled) {
                    app$1.game.activateSquare(color);
                  }
                },
              }, i + 1);
            })
          ),
          gameOver
        ) ];
    },
  };
}

var ACTIVE_TIME = 150;
var BETWEEN_TIME = 100;
var GAME_STARTUP_TIME = 400;
var LEVEL_STARTUP_TIME = 750;

function audioContextType(x) {
  return x instanceof AudioContext;
}

function gainNodeType(x) {
  return x instanceof GainNode;
}

var gameType = index$4({
  colors: index$4.arrayOf(index$4.string),
  activeChoice: [index$4.string, index$4.NULL],
  highScore: index$4.int,
  score: index$4.int,
  history: index$4.arrayOf(index$4.string),
  playerHistory: index$4.arrayOf(index$4.string),
  gameOver: index$4.bool,
  isDisabled: index$4.bool,
  audio: index$4.schema({
    ctx: audioContextType,
    gainNode: gainNodeType,
  }),
}, 'Game');

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

var keyMap = {
  49: 'a',
  50: 'b',
  51: 'c',
  52: 'd',
};

var freqMap = {
  a: 392,
  b: 523.25,
  c: 659.25,
  d: 783.99,
};

var RAMP_DOWN_TIME = 0.01;


function onKeyOnce(fn) {
  var lastFired = null;
  window.onkeydown = function(e) {
    if (lastFired !== e.which) {
      lastFired = e.which;
      fn(e);
    }
  };
  window.onkeyup = function(e) {
    if (e.which === lastFired) {
      lastFired = null;
    }
  };
}

var gameActions = blixt.actions({
  start: function start(ref) {
    var actions$$1 = ref.actions;
    var state = ref.state;

    state.gameOver = false;
    state.score = 0;
    state.history.length = 0;
    state.playerHistory.length = 0;
    state.activeChoice = null;
    state.isDisabled = true;
    setTimeout(actions$$1.levelUp, GAME_STARTUP_TIME);
  },
  playLevel: function playLevel(ref, index) {
    var state = ref.state;
    var actions$$1 = ref.actions;
    if ( index === void 0 ) index = 0;

    if (index < state.history.length) {
      state.activeChoice = state.history[index];
      actions$$1.playSound(state.activeChoice);
      setTimeout(function() {
        state.activeChoice = null;
        blixt.update('Set active to null');
        setTimeout(actions$$1.playLevel, BETWEEN_TIME, index + 1);
      }, ACTIVE_TIME);
    }
    else {
      actions$$1.awaitPlayerAction();
    }
  },
  levelUp: function levelUp(ref) {
    var actions$$1 = ref.actions;
    var state = ref.state;

    state.playerHistory.length = 0;
    state.history.push(randomChoice(state.colors));
    state.score = state.history.length - 1;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('highScore', state.highScore);
    }
    setTimeout(actions$$1.playLevel, LEVEL_STARTUP_TIME);
  },
  awaitPlayerAction: function awaitPlayerAction(ref) {
    var state = ref.state;
    var actions$$1 = ref.actions;

    state.isDisabled = false;
    onKeyOnce(function(e) {
      var key = keyMap[e.which];
      if (key) {
        actions$$1.activateSquare(key);
      }
    });
  },
  gameOver: function gameOver(ref) {
    var state = ref.state;

    state.gameOver = true;
  },
  activateSquare: function activateSquare(ref, key) {
    var state = ref.state;
    var actions$$1 = ref.actions;

    var index = state.playerHistory.length;
    state.playerHistory.push(key);
    actions$$1.playSound(key);
    state.activeChoice = key;
    setTimeout(function() {
      state.activeChoice = null;
      blixt.update('activateSquare [done]');
    }, ACTIVE_TIME);

    if (state.playerHistory[index] !== state.history[index]) {
      window.onkeydown = null;
      window.onkeyup = null;
      actions$$1.gameOver();
    }
    if (state.playerHistory.length === state.history.length) {
      window.onkeydown = null;
      window.onkeyup = null;
      if (!state.gameOver) {
        state.isDisabled = true;
        actions$$1.levelUp();
      }
    }
  },
  playSound: function playSound(ref, color) {
    var state = ref.state;

    var audio = state.audio;
    var osc = audio.ctx.createOscillator();
    osc.connect(audio.gainNode);
    osc.type = 'sine';
    osc.frequency.value = freqMap[color];
    audio.gainNode.connect(audio.ctx.destination);
    osc.start();
    audio.gainNode.gain.setValueAtTime(0.4, audio.ctx.currentTime);
    setTimeout(function() {
      audio.gainNode.gain.setValueAtTime(audio.gainNode.gain.value, audio.ctx.currentTime);
      audio.gainNode.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + RAMP_DOWN_TIME);
      setTimeout(function() {
        audio.gainNode.disconnect();
        osc.stop(audio.ctx.currentTime);
      }, RAMP_DOWN_TIME * 1000);
    }, ACTIVE_TIME - RAMP_DOWN_TIME * 1000);
  },

}, gameType);

function initAudio() {
  var ctx = new AudioContext();
  var gainNode = ctx.createGain();
  gainNode.gain.value = 0.0001;
  return {
    ctx: ctx,
    gainNode: gainNode,
  };
}

function gameFactory() {
  return {
    colors: ['a', 'b', 'c', 'd'],
    activeChoice: null,
    highScore: parseInt(localStorage.getItem('highScore'), 10) || 0,
    score: 0,
    history: [],
    playerHistory: [],
    gameOver: false,
    isDisabled: true,
    audio: initAudio(),
  };
}

var gameState = gameFactory();

var game = {
  state: gameState,
  actions: gameActions.bindTo(gameState),
};

index$4.disabled = undefined === 'production';

var mountNode = document.getElementById('app');
var render = function () { return render$1.render(mountNode, hyperscript_1(Game)); };

var app$1 = blixt({
  modules: {
    game: game,
  },
  onUpdate: function onUpdate(appState, actionName) {
    if (undefined !== 'production') {
      console.log('Action: ' + actionName);
    }
    batch(render)();
  },
});

render();

index$4.throws = true;

index$1('game', function(it) {

  it('initializes game', function(expect) {
    expect(blixt.getState('game', 'activeChoice')).to.equal(null);
    expect(blixt.getState('game', 'score')).to.equal(0);
    expect(blixt.getState('game', 'history')).to.deep.equal([]);
    expect(blixt.getState('game', 'playerHistory')).to.deep.equal([]);
    expect(blixt.getState('game', 'gameOver')).to.equal(false);
    expect(blixt.getState('game', 'isDisabled')).to.equal(true);
  });

})();

}());
