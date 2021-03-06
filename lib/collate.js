// Pretty much the same code in couch_view.erl, except this is JavaScript
// instead of Erlang. This is the same code used in the interactive CouchDB
// tutorial: http://labs.mudynamics.com/2009/04/03/interactive-couchdb/
//
// Compare two Javascript entities using the collation order implemented by
// CouchDB. Here's the sorting order:
//
// [ undefined, null, false, true, number, string, array, object ]

var _Atom   = this._Atom   = 0;
var _Number = this._Number = 1;
var _String = this._String = 2;
var _Array  = this._Array  = 3;
var _Object = this._Object = 4;

var _S_NUMBER = 'number';
var _S_STRING = 'string';
var _S_ARRAY  = '[object Array]';

function type_sort(k) {
	if (k === undefined || k === null || k === false || k === true) { return _Atom; }
	if (typeof k === _S_NUMBER) { return _Number; }
	if (typeof k === _S_STRING) { return _String; }
	if (Object.prototype.toString.apply(k) === _S_ARRAY) { return _Array; }
	return _Object;
};

function atom_sort(k) {
	if (k === undefined) { return 0; }
	if (k === null) { return 1; }
	if (k === false) { return 2; }
	return 3;
};

var less_same_type = [
	function(atomA, atomB) {
		return atom_sort(atomA) - atom_sort(atomB);
	},
	function(numberA, numberB) {
		return numberA - numberB;
	},
	function(stringA, stringB) {
		return stringA < stringB ? -1 : stringA > stringB ? 1 : 0;
	},
	function(arrayA, arrayB) {
		for (var i=0; i<arrayA.length; ++i) {
			var eA = arrayA[i];
			var tA = type_sort(eA);
			var eB = arrayB[i];
			var tB = type_sort(eB);
			if (eB === undefined) {
				return 1;
			}

			if (tA === tB) {
				var val = less_same_type[tA](eA, eB);
				if (val !== 0) {
					return val;
				}
			} else {
				return tA - tB;
			}
		}

		return 0;
	},
	function(objA, objB) {
		var aryA = [];
		for (var i in objA) { aryA.push([i, objA[i]]); }
		var aryB = [];
		for (var j in objB) { aryB.push([j, objB[j]]); }
		return less_same_type[_Array](aryA, aryB);
	}
];

this.compare = function(a, b) {
	var tA = type_sort(a);
	var tB = type_sort(b);
	if (tA !== tB) { return tA - tB; }
	return less_same_type[tA](a, b);
}

this.compare2 = function(a, tA, b, tB) {
	if (tA !== tB) { return tA - tB; }
	return less_same_type[tA](a, b);
}

this.type = function(v) {
    return type_sort(v);
}
