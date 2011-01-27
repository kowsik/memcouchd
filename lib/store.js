// Pretty much the same code in couch_view.erl, except this is JavaScript
// instead of Erlang. This is the same code used in the interactive CouchDB
// tutorial: http://labs.mudynamics.com/2009/04/03/interactive-couchdb/
//
// Compare two Javascript entities with the collation order implemented by
// CouchDB. Here's the sorting order:
// [ undefined, null, false, true, number, string, array, object ]
var Collator = (function() {
    var _Atom   = 0;
    var _Number = 1;
    var _String = 2;
    var _Array  = 3;
    var _Object = 4;
    
    var type_sort = function(k) {
		if (k === undefined || k === null || k === false || k === true) { return _Atom; }
		if (typeof(k) === 'number') { return _Number; }
		if (typeof(k) === 'string') { return _String; }
		if (Object.prototype.toString.apply(k) === '[object Array]') { return _Array; }
		return _Object;        
    };
    
	var atom_sort = function(k) {
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
	
	return {
		compare: function(a, b) {
			var tA = type_sort(a);
			var tB = type_sort(b);
			if (tA !== tB) { return tA - tB; }
			return less_same_type[tA](a, b);
		},
		compare2: function(a, tA, b, tB) {
			if (tA !== tB) { return tA - tB; }
			return less_same_type[tA](a, b);		    
		},
		type: function(v) {
		    return type_sort(v);
		}
	};
}());

// A sorted store of javascript key, value pairs where 'key' can be anything
// that's defined in the collator above. Ideally, this needs to be a BTree,
// but this is a stop-gap solution. The interface to the Store remains 
// useful, if and when we implement a BTree.
var Store = function() {
    var _size = 0;
    var _nodes = [];
    
    // Binary search the array for 'key' and return the index at which the
    // key was found or should be inserted. If the return object also has 'node',
    // then the 'key' was successully found at the 'index'.
    var _find = function(key) {
        var min = 0, max = _nodes.length - 1, n, key2, c;
        var tkey = Collator.type(key), tkey2;
        
        if (_nodes.length === 0) { 
            return { index: 0, type: tkey }; 
        }
        
        do {
            n = Math.floor(min + (max - min)/2);
            key2 = _nodes[n].key;
            tkey2 = _nodes[n].type;
            c = Collator.compare2(key, tkey, key2, tkey2);
            
            if (c > 0) {
                min = n + 1;
            } else if (c < 0) {
                max = n - 1;
            } else {
                return { index: n, node: _nodes[n], type: tkey };
            }            
        } while (min <= max);
        
        return { index: min, type: tkey };
    };
    
    return {
        size: function() {
            return _size;
        },
        insert: function(key, val) {
            var r = _find(key);
            if (r.node) {
                r.node.val = val;
            } else {
                _nodes.splice(r.index, 0, { key: key, val: val, type: r.type });
            }
            _size += 1;            
        },
        find: function(key) {
            var r = _find(key);
            return r.node ? r.node.val : undefined;
        },
        erase: function(key) {
            var r = _find(key);
            if (r.node) {
                _nodes.splice(r.index, 1);
                return r.node.val;
            }
            return null;
        },
        _index: function(key) {
            var r = _find(key);
            return r.node ? r.index : -1;
        }
    }
};

this.create = function() {
    return new Store();
};

store = new Store();
store.insert("key5", "val5");
store.insert("key1", "val1");
store.insert("key9", "val9");
store.insert("key3", "val3");
store.insert("key7", "val7");
console.log(store.find("key8"));

console.log("looking for key7");
console.log(store.find('key7'));
store.erase('key7');
console.log(store.find('key7'));
[ 'key1', 'key2', 'key3', 'key5', 'key7', 'key9'].forEach(function(key) {
    console.log([ key, store._index(key) ]);
});
