/**
 * Highland.js 0.0.1
 * (c) 2012 Caolan McMahon
 * https://github.com/caolan/highland
 *
 * Highland is freely distributable under the MIT license.
 * Some parts of Highland are inspired or borrowed from Underscore,
 * Node.js, and Oliver Steele's Functional.
 */

/**
 * Fixing JavaScript with JavaScript.
 *
 * The [Highland project][1] is an experiment in replacing some of the most
 * dangerous and unpredictable features of JavaScript using one of the
 * language's best assets: Functions. Highland values predictability and
 * expressiveness over speed, knowing that you can break into regular
 * JavaScript when speed is essential, and elsewhere limit your exposure
 * to it's sometimes unpredictable results.
 *
 * This is not a new language that compiles to JavaScript, it is a
 * collection of many small functions to help you write expressive, more
 * functional code with fewer side-effects.
 *
 * [1]: https://github.com/caolan/highland
 *
 * @module
 */


/**
 * Universal module definition
 */

(function (root, factory) {

    if (typeof exports === 'object') {
        module.exports = factory(module.exports); // Node
    }
    else if (typeof define === 'function' && define.amd) {
        define(factory); // AMD
    }
    else {
        root.Highland = factory(); // Browser globals
    }

}(this, function () {

"use strict";

var L = {};

// reference to global object
var root = this; // only works in non-strict mode

// find global object when in strict mode
if (typeof window !== 'undefined') {
    root = window; // browser
}
else if (typeof global !== 'undefined') {
    root = global; // node.js global object
}


// Save bytes in the minified (but not gzipped) version:
var ArrayProto  = Array.prototype,
    FuncProto   = Function.prototype,
    ObjProto    = Object.prototype;

// Create quick reference variables for speed access to core prototypes.
var slice            = ArrayProto.slice,
    unshift          = ArrayProto.unshift,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;


/**
 * @section Functions
 */

/**
 * Transforms a function with specific arity (all arguments must be
 * defined) in a way that it can be called as a chain of functions until
 * the arguments list is saturated.
 *
 * This function is not itself curryable.
 *
 * @name curry f args... -> Function(...)
 * @param {Function} f - the function to curry
 * @param args.. - any number of arguments to pre-apply to the function
 * @api public
 *
 * fn = curry(function (a, b, c) {
 *     return a + b + c;
 * });
 *
 * fn(1)(2)(3) == fn(1, 2, 3)
 * fn(1, 2)(3) == fn(1, 2, 3)
 * fn(1)(2, 3) == fn(1, 2, 3)
 */

L.curry = function (fn /* args... */) {
    var args = slice.call(arguments);
    return L.ncurry.apply(this, [fn.length].concat(args));
};

/**
 * Same as `curry` but with a specific number of arguments. This can be
 * useful when functions do not explicitly define all its parameters.
 *
 * This function is not itself curryable.
 *
 * @name ncurry n fn args... -> Function(...)
 * @param {Number} n - the number of arguments to wait for before apply fn
 * @param {Function} fn - the function to curry
 * @param args... - any number of arguments to pre-apply to the function
 * @api public
 *
 * fn = ncurry(3, function () {
 *     return Array.prototype.join.call(arguments, '.');
 * });
 *
 * fn(1, 2, 3) == '1.2.3';
 * fn(1, 2)(3) == '1.2.3';
 * fn(1)(2)(3) == '1.2.3';
 */

L.ncurry = function (n, fn /* args... */) {
    var largs = slice.call(arguments, 2);
    if (largs.length >= n) {
        return L.apply(fn, largs.slice(0, n));
    }
    return function () {
        var args = largs.concat(slice.call(arguments));
        if (args.length < n) {
            return L.ncurry.apply(this, [n, fn].concat(args));
        }
        return fn.apply(this, args.slice(0, n));
    }
};

/**
 * Creates a composite function, which is the application of function 'a' to
 * the results of function 'b'.
 *
 * @name compose a -> b -> Function(x)
 * @param {Function} a - the function to apply to the result of b(x)
 * @param {Function} b - the function to apply to x
 * @api public
 *
 * var add1 = add(1);
 * var mul3 = mul(3);
 *
 * var add1mul3 = compose(mul3, add1);
 * add1mul3(2) == 9
 */

L.compose = L.curry(function (a, b) {
    return function () { return a(L.apply(b, arguments)); };
});

/**
 * Applies function `f` with arguments array `args`. Same as doing
 * `fn.apply(this, args)`
 *
 * @name apply f -> args -> result
 * @param {Function} f - the function to apply the arguments to
 * @param {Array} args - an array of arguments to apply
 * @api public
 *
 * apply(add, [1,2]) == 3
 * apply(mul)([3,3]) == 9
 */

L.apply = L.curry(function (f, args) { return f.apply(this, args); });

/**
 *
 * Evaluates the function `f` with the argument positions swapped. Only
 * works with functions that accept two arguments.
 *
 * @name flip f -> x -> y -> result
 * @param {Function} f - function to flip argument application for
 * @param x - parameter to apply to the right hand side of f
 * @param y - parameter to apply to the left hand side of f
 * @api public
 *
 * div(2, 4) == 0.5
 * flip(div)(2, 4) == 2
 */

L.flip = L.curry(function (fn, x, y) { return fn(y, x); });


/**
 * @section Operators
 */

// helper for generating operator functions, not public
var operator = function (op) {
    return L.curry(new Function ('a', 'b', 'return a ' + op + ' b;'));
};

/**
 * Tests for equality using `===`
 *
 * @name eq a -> b -> Boolean
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * eq(1,1) == true
 * eq(1,2) == false
 */

L.eq = operator('===');

/**
 * Tests if the values of a and b are equivalent. With objects and arrays
 * this function will recursively test sub-properties in order to determine
 * equivalence. The `eq` function when applied to two instances of the same
 * prototype will return false, this function will return true.
 *
 * @name eqv a -> b -> Boolean
 * @param a - any value
 * @param b - any value
 * @api public
 *
 * eqv({a: 1}, {a: 1}) == true
 * eqv({a: 1, b: {c: 2}}, {a: 1, b: {c: 3}}) == false
 */

// used in Node.js
var hasBuffer = (typeof Buffer !== 'undefined');


// Adapted from the Node.js lib/assert.js module
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Available under the MIT license
// https://github.com/joyent/node/blob/master/LICENSE


L.eqv = L.curry(function (a, b) {
    if (a === b) {
        return true;
    }
    else if (hasBuffer && Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
        if (a.length != b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    else if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source &&
            a.global === b.global &&
            a.multiline === b.multiline &&
            a.lastIndex === b.lastIndex &&
            a.ignoreCase === b.ignoreCase;
    }
    else if (typeof a != 'object' && typeof b != 'object') {
        return a == b;
    }
    else {
        return objEquiv(a, b);
    }
});

function objEquiv(a, b) {
    if ((a === null || a === undefined) || (b === null || b === undefined)) {
        return false;
    }
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (L.isArgumentsObject(a)) {
        if (!L.isArgumentsObject(b)) {
            return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return L.eqv(a, b);
    }
    try {
        var ka = Object.keys(a),
            kb = Object.keys(b),
            key, i;
    }
    catch (e) {
        // happens when one is a string literal and the other isn't
        return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length) {
        return false;
    }
    // the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i]) {
            return false;
        }
    }
    // equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!L.eqv(a[key], b[key])) {
            return false;
        }
    }
    return true;
}

/**
 * Tests for inequality using `!==`
 *
 * @name ne a -> b -> Boolean
 * @param a - any value
 * @param b - any value
 * @api public
 *
 * ne(1,1) == false
 * ne(1,2) == true
 */

L.ne = operator('!==');

/**
 * Tests if a is not truthy using `!`, this only works with Boolean values.
 *
 * @name not a -> Boolean
 * @param {Boolean} a - the boolean value to return the inverse of
 * @api public
 *
 * not(true) == false
 * not(false) == true
 */

L.not = function (a) {
    if (L.isBoolean(a)) {
        return !a;
    }
    throw new TypeError('Expected Boolean value, got: ' + type(a));
};

/**
 * Tests if a is less than b. This is not a simple wrapper for the '<'
 * operator, and will only work with Numbers, Strings and Arrays (containing
 * any of these three types). Both a and b must be of the same data type,
 * you cannot compare a Number with a String, for example. However, you
 * can compare two arrays which both have a Number as the first argument
 * and a String as the second, and so on.
 *
 * @name lt a -> b -> Boolean
 * @param {Number|String|Array} a
 * @param {Number|String|Array} b
 * @api public
 *
 * lt(2,4) == true
 * lt(5,1) == false
 * lt(3,3) == false
 */

L.lt = L.curry(function (a, b) {
    var ta = L.type(a),
        tb = L.type(b);

    if (ta !== tb) {
        throw new TypeError('Cannot compare type ' + ta + ' with type ' + tb);
    }
    if (ta === 'string' || ta === 'number') {
        return a < b;
    }
    if (ta === 'array') {
        var len = L.min(a.length, b.length);
        for (var i = 0; i < len; i++) {
            if (L.lt(a[i], b[i])) {
                return true;
            }
            else if (!L.eqv(a[i], b[i])) {
                return false;
            }
        }
        return a.length < b.length;
    }
    throw new TypeError('Cannot order values of type ' + ta);
});

/**
 * Tests if a is greater than b. This is not a simple wrapper for the '>'
 * operator, and will only work with Numbers, Strings and Arrays (containing
 * any of these three types). Both a and b must be of the same data type,
 * you cannot compare a Number with a String, for example. However, you
 * can compare two arrays which both have a Number as the first argument
 * and a String as the second, and so on.
 *
 * @name gt a -> b -> Boolean
 * @param {Number|String|Array} a
 * @param {Number|String|Array} b
 * @api public
 *
 * gt(2,4) == false
 * gt(5,1) == true
 * gt(3,3) == false
 */

L.gt = L.curry(function (a, b) {
    var ta = L.type(a),
        tb = L.type(b);

    if (ta !== tb) {
        throw new TypeError('Cannot compare type ' + ta + ' with type ' + tb);
    }
    if (ta === 'string' || ta === 'number') {
        return a > b;
    }
    if (ta === 'array') {
        var len = L.min(a.length, b.length);
        for (var i = 0; i < len; i++) {
            if (L.gt(a[i], b[i])) {
                return true;
            }
            else if (!L.eqv(a[i], b[i])) {
                return false;
            }
        }
        return a.length > b.length;
    }
    throw new TypeError('Cannot order values of type ' + ta);
});

/**
 * Tests if a is less than or equivalent to b.
 *
 * @name le a -> b -> Boolean
 * @param {Number|String|Array} a
 * @param {Number|String|Array} b
 * @api public
 *
 * le(2,4) == true
 * le(5,1) == false
 * le(3,3) == true
 */

L.le = L.curry(function (a, b) { return L.not(L.gt(a, b)); });

/**
 * Tests if a is greater than or equivalent to b.
 *
 * @name ge a -> b -> Boolean
 * @param {Number|String|Array} a
 * @param {Number|String|Array} b
 * @api public
 *
 * gt(2,4) == false
 * gt(5,1) == true
 * gt(3,3) == true
 */

L.ge = L.curry(function (a, b) { return L.not(L.lt(a, b)); });

/**
 * Tests if both a and b are `true` using `&&`. However, unlike the
 * `&&` operator, this will only work with Boolean arguments. It has
 * no concept of 'truthy' and 'falsey'.
 *
 * @name and a -> b -> Boolean
 * @param {Boolean} a
 * @param {Boolean} b
 * @api public
 *
 * and(true, true) == true
 * and(false, true) == false
 * and(false, false) == false
 */

L.and = L.curry(function (a, b) {
    if (L.isBoolean(a) &&  L.isBoolean(b)) {
        return a && b;
    }
    throw new TypeError(
        'Expecting two Boolean arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 * Tests if either a or b are `true` using `||`. However, unlike the
 * `||` operator, this will only work with Boolean arguments. It has
 * no concept of 'truthy' and 'falsey'.
 *
 * @name or a -> b -> Boolean
 * @param {Boolean} a
 * @param {Boolean} b
 * @api public
 *
 * or(true, true) == true
 * or(false, true) == true
 * or(false, false) == false
 */

L.or = L.curry(function (a, b) {
    if (L.isBoolean(a) &&  L.isBoolean(b)) {
        return a || b;
    }
    throw new TypeError(
        'Expecting two Boolean arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});


/**
 * Adds a and b using `+`. This only works with Numbers, it does not
 * also perform string concatenation. For that, use the `concat` function.
 *
 * @name add a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * add(1,2) == 3
 * add(5,5) == 10
 */

L.add = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return a + b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 * Subtracts b from a using `-`. This only works with Numbers.
 *
 * @name sub a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * sub(2,1) == 1
 * sub(5,5) == 0
 */

L.sub = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return a - b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 * Multiplies a and b using `*`. This only works with Numbers.
 *
 * @name mul a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * mul(2,1) == 2
 * mul(5,5) == 25
 */

L.mul = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return a * b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 * Divides a by b using `/`. This only works with Numbers.
 *
 * @name div a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * div(4,2) == 2
 * div(15,5) == 3
 */

L.div = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return a / b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 * Returns the amount left over after dividing integer a by integer b.
 * This is the same as the `%` operator, which is in fact the remainder
 * not modulus. However, this function will only work with Number arguments.
 *
 * @name rem a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * rem(-1, 5) == -1
 */

L.rem = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return a % b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});

/**
 *
 * The modulus of a and b, this is NOT the same as the `%` operator in
 * JavaScript, which actually returns the remainder. See the `rem` function
 * if you want compatible behaviour with `%`.
 *
 * @name mod a -> b -> Number
 * @param {Number} a
 * @param {Number} b
 * @api public
 *
 * mod(-1, 5) == 4
 */

L.mod = L.curry(function (a, b) {
    if (L.isNumber(a) && L.isNumber(b)) {
        return ((a % b) + b) % b;
    }
    throw new TypeError(
        'Expecting two Number arguments, got: ' + L.type(a) + ', ' + L.type(b)
    );
});



/**
 * @section Types
 */


/**
 * Thanks to underscore.js for many of these type tests. Some
 * functions may have been modified.
 *
 * Underscore.js 1.3.3
 * (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Underscore is freely distributable under the MIT license.
 * Portions of Underscore are inspired or borrowed from Prototype,
 * Oliver Steele's Functional, and John Resig's Micro-Templating.
 * For all details and documentation:
 * http://documentcloud.github.com/underscore
 */


/**
 * Tests if obj is an array.
 *
 * @name isArray obj -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isArray([1,2,3]) == true
 * isArray({}) == false
 */

L.isArray = Array.isArray || function (x) {
    return toString.call(x) === '[object Array]';
};

/**
 * Tests if obj is an Object. This differs from other isObject
 * implementations in that it does NOT return true for Arrays,
 * Functions or Strings created using the String() constructor function.
 *
 * @name isObject x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isObject({}) == true
 * isObject([]) == false
 * isObject('abc') == false
 * isObject(function(){}) == false
 */

L.isObject = function (x) {
    return x === Object(x) &&
        !L.isArray(x) &&
        !L.isFunction(x) &&
        !L.isString(x);
};

/**
 * Tests if x is a Function.
 *
 * @name isFunction x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isFunction(function(){}) == true
 * isFunction(123) == false
 */

L.isFunction = function (x) {
    return toString.call(x) == '[object Function]';
};

/**
 * Tests if x is a String.
 *
 * @name isString x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isString('abc') == true
 * isString(123) == false
 */

L.isString = function (x) {
    return toString.call(x) == '[object String]';
};

/**
 * Tests if x is a Number (including Infinity).
 *
 * @name isNumber x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isNumber(123) == true
 * isNumber(Infinity) == true
 * isNumber('abc') == false
 */

L.isNumber = function (x) {
    return toString.call(x) == '[object Number]';
};

/**
 * Tests if x is a Boolean.
 *
 * @name isBoolean x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isBoolean(true) == true
 * isBoolean('abc') == false
 */

L.isBoolean = function (x) {
    return x === true || x=== false || toString.call(x) == '[object Boolean]';
};

/**
 * Tests if x is null.
 *
 * @name isNull x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isNull(null) == true
 * isNull(123) == false
 */

L.isNull = function (x) {
    return x === null;
};

/**
 * Tests if x is undefined.
 *
 * @name isUndefined x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isUndefined(undefined) == true
 * isUndefined('abc') == false
 */

L.isUndefined = function (x) {
    return x === void 0;
};

/**
 * Tests if x is NaN. This is not the same as the native isNaN function,
 * which will also return true if the variable is undefined.
 *
 * @name isNaN x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isNaN(NaN) == true
 * isNaN(undefined) == false
 */

L.isNaN = function (x) {
    // `NaN` is the only value for which `===` is not reflexive.
    return x !== x;
};

/**
 * Tests if x is a Date object (also passes isObject test).
 *
 * @name isDateObject x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isDateObject(new Date()) == true
 * isDateObject({}) == false
 */

L.isDateObject = function (x) {
  return toString.call(x) == '[object Date]';
};

/**
 * Tests if x is a RegExp (also passes isObject test).
 *
 * @name isRegExpObject x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * isRegExpObject(new Date()) == true
 * isRegExpObject({}) == false
 */

// Is the given value a regular expression?
L.isRegExpObject = function (x) {
    return toString.call(x) == '[object RegExp]';
};

/**
 * Tests if x is an arguments list (also passes isObject test).
 *
 * @name isArgumentsObject x -> Boolean
 * @param x - the value to test
 * @api public
 *
 * (function () { isArgumentsObject(arguments) == true }());
 * isArgumentsObject({}) == false
 */

// Is a given variable an arguments object?
L.isArgumentsObject = function (x) {
    return toString.call(x) == '[object Arguments]';
};
if (!L.isArgumentsObject(arguments)) {
    L.isArgumentsObject = function (x) {
        return !!(x && L.has(x, 'callee'));
    };
}

/**
 * Returns a string describing the type of x. Possible values: array,
 * function, object, string, boolean, null, undefined.
 *
 * @name type x -> String
 * @param x - the value to test
 * @api public
 *
 * type({}) == 'object'
 * type([]) == 'array'
 * type('abc') == 'string'
 */

L.type = function (x) {
    return (
        (L.isArray(x) && 'array') ||
        (L.isFunction(x) && 'function') ||
        (L.isObject(x) && 'object') ||
        (L.isString(x) && 'string') ||
        (L.isNumber(x) && 'number') ||
        (L.isBoolean(x) && 'boolean') ||
        (L.isNull(x) && 'null') ||
        (L.isUndefined(x) && 'undefined')
    );
};


/**
 * @section Numbers
 */

/** Ordered data methods **/

/**
 * Returns the highest of two values. Works with Numbers, Strings or Arrays.
 *
 * @name max x -> y -> Number
 * @param {Number|String|Array} x
 * @param {Number|String|Array} y
 * @api public
 *
 * max(1,5) == 5
 * max([1,2,3],[2,3,4]) == [2,3,4]
 */

L.max = L.curry(function (x, y) { return L.ge(x, y) ? x: y; });

/**
 * Returns the lowest of two values. Works with Numbers, Strings or Arrays.
 *
 * @name min x -> y -> Number
 * @param {Number|String|Array} x
 * @param {Number|String|Array} y
 * @api public
 *
 * min(1,5) == 1
 * min([1,2,3],[2,3,4]) == [1,2,3]
 */

L.min = L.curry(function (x, y) { return L.le(x, y) ? x: y; });

/**
 * Compares two values, returning -1 if x it less than y, 0 if the values
 * are equivalent, and 1 if x is greater than y. Works with Numbers, Strings
 * or Arrays.
 *
 * @name compare x -> y -> -1 | 0 | 1
 * @param {Number|String|Array} x
 * @param {Number|String|Array} y
 * @api public
 *
 * compare(1,2) == -1
 * compare([1,2,3],[1,2,3]) == 0
 * compare(5,3) == 1
 */

L.compare = L.curry(function (x, y) {
    return L.lt(x, y) ? -1: (L.gt(x, y) ? 1: 0);
});


/**
 * @section Lists
 */

/**
 * Creates a new Array by prepending an element to an existing array.
 * Can also be used with Strings.
 *
 * @name cons x -> xs -> Array | String
 * @param x - the value to prepend to the xs in the new array
 * @param {Array|String} xs - the tail of the new array
 * @api public
 *
 * cons(0, [1,2,3]) == [0,1,2,3]
 */

L.cons = L.curry(function (x, xs) {
    if (L.isString(xs)) {
        if (!L.isString(x)) {
            throw new TypeError(
                'When second argument is String, first argument should also' +
                'be String, got: ' + type(x) + ', ' + type(xs)
            );
        }
        return x + xs;
    }
    return [x].concat(xs);
});

/**
 * Creates a new Array by appending an element to an existing array.
 * Can also be used to append a character to a String.
 *
 * @name append x -> xs -> Array | String
 * @param x - the value to append to the xs in the new array
 * @param {Array|String} xs - the init of the new array
 *
 * append(4, [1,2,3]) == [1,2,3,4]
 */

L.append = L.curry(function (x, xs) {
    if (L.isString(xs)) {
        if (!L.isString(x)) {
            throw new TypeError(
                'When second argument is String, first argument should also' +
                'be String, got: ' + type(x) + ', ' + type(xs)
            );
        }
        return xs + x;
    }
    return xs.concat([x]);
});


/** Basic Functions **/

/**
 * Returns the first element of a non-empty Array.
 * Can also be used with Strings.
 *
 * @name head xs -> x
 * @param {Array|String} xs - the array to return the first element from
 * @api public
 *
 * head([1,2,3,4]) == 1
 */

L.head = function (xs) {
    return L.empty(xs) ? L.error('head of empty array'): xs[0];
};

/**
 * Returns the last element of a non-empty Array.
 * Can also be used with Strings.
 *
 * @name last xs -> x
 * @param {Array|String} xs - the array to return the last element from
 * @api public
 *
 * last([1,2,3,4]) == 4
 */

L.last = function (xs) {
    return L.empty(xs) ? L.error('last of empty array'): xs[xs.length - 1];
};

/**
 * Returns a new Array without the first element of the original
 * non-empty Array. Can also be used with Strings.
 *
 * @name tail xs -> Array
 * @param {Array|String} xs - the array to return the tail of
 * @api public
 *
 * tail([1,2,3,4]) == [2,3,4]
 */

L.tail = function (xs) {
    return L.empty(xs) ? L.error('tail of empty array'): xs.slice(1);
};

/**
 * Returns a new Array without the last element of the original
 * non-empty Array. Can also be used with Strings.
 *
 * @name init xs -> Array
 * @param {Array|String} xs - the array to return the init of
 * @api public
 *
 * init([1,2,3,4]) == [1,2,3]
 */

L.init = function (xs) {
    return L.empty(xs) ?
        L.error('init of empty array'):
        xs.slice(0, xs.length - 1);
};

/**
 * Returns true if the Array or String is empty.
 *
 * @name empty xs -> Boolean
 * @param {Array|String} xs - the array to test
 * @api public
 *
 * empty([]) == true
 * empty([1,2,3]) == false
 */

L.empty  = function (xs) { return xs.length === 0; };

/**
 * Returns the length of an Array or String.
 *
 * @name length xs -> Number
 * @param {Array|String} xs - the array to return the length of
 * @api public
 *
 * length([1,2,3]) == 3
 */

L.length = function (xs) { return xs.length; };

/**
 * Adds the elements of one Array to another, returning a new Array.
 * Also works on strings.
 *
 * @name concat a -> b -> Array | String
 * @param {Array|String} a
 * @param {Array|String} b
 * @api public
 *
 * concat([1,2], [3,4]) == [1,2,3,4]
 * concat('abc', 'def') == 'abcdef'
 */

L.concat = L.curry(function (a, b) {
    if (L.isArray(a) && L.isArray(b)) {
        return ArrayProto.concat.apply(a, b);
    }
    if (L.isString(a) && L.isString(b)) {
        return a + b;
    }
    throw new Error(
        'Cannot concat types "' + (typeof a) + '" and "' + (typeof b) + '"'
    );
});


/** Reducing lists (folds) **/

/**
 * Takes a combining function `f` an Array `xs` and an initial value `z`,
 * and boils down a list of values into a single value. The `z` arguments is
 * the initial state of the reduction, and each successive step of it should
 * be returned by iterator.
 *
 * @name foldl f -> z -> xs -> result
 * @param {Function} f - the combining function
 * @param z - the inital value
 * @param {Array|String} xs - the array to combine
 * @api public
 *
 * foldl(add, 1, [2,3,4]) == 10
 */

L.foldl = L.curry(function (f, z, xs) {
    return (L.isString(xs) ? xs.split(''): xs).reduce(f, z);
});

/**
 * Same as foldl but uses the first element as the initial value instead of
 * the `z` argument.
 *
 * @name foldl1 f -> xs -> result
 * @param {Function} f - the combining function
 * @param {Array|String} xs - the array to combine
 * @api public
 *
 * foldl1(add, [1,2,3,4]) == 10
 */

L.foldl1 = L.curry(function (f, xs) {
    return L.foldl(f, L.head(xs), L.tail(xs));
});

/**
 * A fold starting from the right side, or end of, the Array or String.
 *
 * @name foldr f -> z -> xs -> result
 * @param {Function} f - the combining function
 * @param z - the initial value
 * @param {Array|String} xs - the array to combine
 * @api public
 *
 * foldr(add, 4, [1,2,3]) == 10
 */

L.foldr = L.curry(function (f, z, xs) {
    for (var i = xs.length - 1; i >= 0; --i) {
        z = f(xs[i], z);
    }
    return z;
});

/**
 * Same as foldr but uses the first element as the initial value instead of
 * the `z` argument.
 *
 * @name foldr1 f -> xs -> result
 * @param {Function} f - the combining function
 * @param {Array|String} xs - the array to combine
 * @api public
 *
 * foldr1(add, [1,2,3,4]) == 10
 */

L.foldr1 = L.curry(function (f, xs) {
    return L.foldr(f, L.last(xs), L.init(xs));
});


/** List transformations **/

L.map = L.curry(function (f, xs) { return xs.map(f); });
L.reverse = L.foldl(L.flip(L.cons), []);

// intersperse
// intercalate
// transpose
// subsequences
// permutations


/** Special folds **/

L.concatMap = L.curry(function (f, xs) {
    return L.foldl1(L.concat, L.map(f, xs));
});

L.all = L.curry(function (p, xs) {
    return L.foldl(L.and, true, L.map(p, xs));
});

L.any = L.curry(function (p, xs) {
    return L.foldl(L.or, false, L.map(p, xs));
});

L.maximum = L.foldl1(L.max);
L.minimum = L.foldl1(L.min);

// sum
// product
// concatList
// andList
// orList


/*** Building lists ***/

/** Scans **/

// scanl
// scanl1
// scanr
// scanr1


/** Accumulating maps **/

// mapAccumL
// mapAccumR


/** Infinite lists **/

// iterate
// repeat
L.replicate = L.curry(function (n, x) {
    var r = [];
    for (var i = 0; i < n; i++) {
        r[i] = x;
    }
    return r;
});
// cycle

// custom addition to replace [1..10] etc
L.range = function (a, b) {
    var xs = [];
    for (var i = a; i <= b; i++) {
        xs.push(i);
    }
    return xs;
};


/** Unfolding **/

// unfoldr


/*** Sublists ***/

/** Extracting sublists **/

L.take = L.curry(function (i, xs) { return slice.call(xs, 0, i); });
L.drop = L.curry(function (i, xs) { return slice.call(xs, i); });
L.splitAt = L.curry(function (n, xs) {
    return [L.take(n, xs), L.drop(n, xs)];
});

L.takeWhile = L.curry(function (p, xs) {
    var len = xs.length, i = 0;
    while (i < len && p(xs[i])) {
        i++;
    }
    return L.take(i, xs);
});

L.dropWhile = L.curry(function (p, xs) {
    var len = xs.length, i = 0;
    while (i < len && p(xs[i])) {
        i++;
    }
    return L.drop(i, xs);
});
L.span = L.curry(function (p, xs) {
    var left = [];
    var len = xs.length, i = 0;
    while (i < len && p(xs[i])) {
        left.push(xs[i]);
        i++;
    }
    return [left, slice.call(xs, i)];
});
// break

// stripPrefix

// group

// inits
// tails


/** Predicates **/

// isPrefixOf
// isSuffixOf
// isInfixOf


/*** Searching lists ***/

/** Searching by equality **/

L.elem    = L.curry(function (x, xs) { return L.any(L.eq(x), xs); });
L.notElem = L.curry(function (x, xs) { return L.not(L.elem(x, xs)); });
// lookup

/** Searching with a predicate **/

// find
L.filter = L.curry(function (f, xs) { return xs.filter(f); });
// partition


/*** Indexing Lists ***/

// (!!)
// elemIndex
// elemIndicies
// findIndex
// findIndicies


/*** Zipping and unzipping lists ***/

L.zip = L.curry(function (xs, ys) {
    return L.zipWith(function (x, y) { return [x, y]; }, xs, ys);
});
// zip3
// zip4, zip5, zip6, zip7
L.zipWith = L.curry(function (f, xs, ys) {
    var r = [];
    var len = L.min(L.length(xs), L.length(ys));
    for (var i = 0; i < len; i++) {
        r[i] = f(xs[i], ys[i]);
    }
    return r;
});
// zipWith3
// zipWith4, zipWith5, zipWith6, zipWith7
// unzip
// unzip3
// unzip4, unzip5, unzip6, unzip7


/*** Special lists ***/

/** Functions on strings **/

// lines
// words
// unlines
// unwords


/*** "Set" operations ***/

L.nub = L.foldl(function (ys, x) {
    return L.elem(x, ys) ? ys: L.append(x, ys);
}, []);

// nub (uniq)
// delete
// (\\)
// union
// intersect

/*** Ordered lists ***/

L.sort = function (xs) { return slice.call(xs).sort(); };
// insert


/*** Generalized functions ***/

/** User-supplied equality **/

// nubBy
// deleteBy
// deleteFirstBy
// unionBy
// intersectBy
// groupBy


/** User-supplied comparison **/

// sortBy
// insertBy
// maximumBy
// minimumBy






/**
 * @section Strings
 */

// strip :: String -> String
// lstrip :: String -> String
// rstrip :: String -> String
// startswith :: Eq a => [a] -> [a] -> Bool // alias for isPrefixOf
// endswith :: Eq a => [a] -> [a] -> Bool   // alias for isSuffixOf
L.join = L.curry(function (sep, xs) {
    return ArrayProto.join.call(xs, sep);
});
// split :: Eq a => [a] -> [a] -> [[a]]
// splitWs :: String -> [String]
// replace :: Eq a => [a] -> [a] -> [a] -> [a]
// escapeRe :: String -> String






/**
 * @section Objects
 */

L.has = L.curry(function (obj, key) {
    return hasOwnProperty.call(obj, key);
});

L.shallowClone = function (obj) {
    if (L.isArray(obj)) {
        return slice.call(obj);
    }
    var newobj = {};
    for (var k in obj) {
        newobj[k] = obj[k];
    }
    return newobj;
};

L.deepClone = function (obj) {
    if (L.isArray(obj)) {
        return map(L.deepClone, obj);
    }
    if (L.isObject(obj)) {
        var newobj = {};
        for (var k in obj) {
            newobj[k] = L.deepClone(obj[k]);
        }
        return newobj;
    }
    return obj;
};

L.jsonClone = function (obj) {
    return JSON.parse( JSON.stringify(obj) );
};

L.set = L.curry(function (obj, path, val) {
    if (!L.isArray(path)) {
        path = [path];
    }
    if (path.length === 0) {
        return val;
    }
    var newobj = L.shallowClone(obj),
        p = L.head(path),
        ps = L.tail(path);

    if (L.isObject(obj[p])) {
        newobj[p] = L.set(L.shallowClone(obj[p]), ps, val);
    }
    else {
        newobj[p] = L.set({}, ps, val);
    }
    return newobj;
});

L.get = L.curry(function (obj, path) {
    if (!L.isArray(path)) {
        path = [path];
    }
    if (path.length === 0) {
        return obj;
    }
    var p = L.head(path),
        ps = L.tail(path);

    if (obj.hasOwnProperty(p)) {
        return L.get(obj[p], ps);
    }
    return undefined;
});

L.freeze = Object.freeze;

L.deepFreeze = function (obj) {
    if (typeof obj === 'object') {
        L.freeze(obj);

        //map L.values(obj)

        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                L.deepFreeze(obj[k]);
            }
        }
    }
    return obj;
};

L.keys = Object.keys;

L.values = function (obj) {
    return L.map(L.get(obj), L.keys(obj));
};

L.pairs = function (obj) {
    return L.map(function (k) { return [k, obj[k]]; }, L.keys(obj));
};


/**
 * @section Utilities
 */

L.id = function (x) {
    return x;
};

L.until = L.curry(function (p, f, x) {
    var r = x;
    while (!p(r)) {
        r = f(r);
    }
    return r;
});

L.error = function (msg) {
    throw new Error(msg);
};

/* this won't work in strict mode, and people *should* be using strict mode!
L.evalInstall = L.foldl(function (src, prop) {
    return src + 'var ' + prop + '=L.' + prop + '; ';
}, '', L.keys(L));
*/

L.install = function () {
    var keys = L.keys(L);
    for (var i = 0; i < keys.length; i++) {
        (function (k) {
            if (root[k] === L[k]) {
                return; // skip if already installed
            }
            Object.defineProperty(root, k, {
                get: function () { return L[k]; },
                set: function () { throw new Error(k + ' is read-only'); },
                configurable: false
            });
        }(keys[i]));
    }
};

return Object.freeze(L);

}));
