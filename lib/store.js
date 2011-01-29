var Collate = require('./collate');

// A sorted store of javascript key, value pairs where 'key' can be anything
// that's defined in the collator above. Ideally, this needs to be a BTree,
// but this is a stop-gap solution. The interface to the Store remains
// useful, if and when we implement a BTree.
//
// Each [k,v] pair also has an associated id (defaults to undefined). This
// allows us to have multiple identical [k,v] pairs in the store that are
// still considered unique if the ids of them are different. The [k,v] pairs
// are first collated by the 'k' and then further collated by the id.
var Store = function() {
    var _size = 0;
    var _nodes = [];

    // Binary search the array for 'key' and return the index at which the
    // key was found or should be inserted. If the return object also has 'node',
    // then the 'key' was successully found at the 'index'. This essentially
    // gives us O(log(n)) insert performance, though the cost of each compare2
    // grows as the complexity of array/object that makes up the key increases.
    // If the insertions are pre-sorted (meaning the keys are already collated)
    // then all this is is an array.push. However, for insertions of random
    // 1,000,000 entries, this starts to slow down because of the 'memmoves'
    // in v8's array implementation.
    var _find = function(key, id, key_only_match) {
        var min = 0, max = _nodes.length - 1, n, key2, c, id2, node;
        var tkey = Collate.type(key), tkey2;
        var tid = Collate.type(id), tid2;

        if (_nodes.length === 0) {
            return { index: 0, tkey: tkey, tid: tid };
        }

        do {
            n = Math.floor(min + (max - min)/2);
            node  = _nodes[n];
            id2   = node.id;
            key2  = node.key;
            tkey2 = node.tkey;
            tid2 = node.tid;
            c = Collate.compare2(key, tkey, key2, tkey2);
            if (c === 0) {
                if (!key_only_match) {
                    c = Collate.compare2(id, tid, id2, tid2);                    
                }
            }

            if (c > 0) {
                min = n + 1;
            } else if (c < 0) {
                max = n - 1;
            } else {
                return { index: n, node: _nodes[n], tid: tid, tkey: tkey };
            }
        } while (min <= max);

        return { index: min, tid: tid, tkey: tkey };
    };

    return {
        size: function() {
            return _size;
        },
        insert: function(key, val, id) {
            var r = _find(key, id);
            if (r.node) {
                r.node.val = val;
            } else {
                _nodes.splice(r.index, 0, { id: id, key: key, val: val, tkey: r.tkey, tid: r.tid });
                _size += 1;
            }
        },
        insert2: function(key, id, cb) {
            if (cb === undefined) {
                cb = id;
                id = undefined;
            }
            var r = _find(key, id);
            if (r.node) {
                return cb(r.node.val, function(val) {
                    r.node.val = val;
                });
            } else {
                return cb(undefined, function(val) {
                    _nodes.splice(r.index, 0, { id: id, key: key, val: val, tkey: r.tkey, tid: r.tid });
                    _size += 1;
                });
            }
        },
        find: function(key, id) {
            var r = _find(key, id);
            return r.node ? r.node.val : undefined;
        },
        findFirst: function(key) {
            var r = _find(key, undefined, true);
            return r.node ? r.node.val : undefined;            
        },
        erase: function(key, id) {
            var r = _find(key, id);
            if (r.node) {
                _nodes.splice(r.index, 1);
                _size -= 1;
                return r.node.val;
            }
            return undefined;
        },
        erase2: function(key, id, cb) {
            if (cb === undefined) {
                cb = id;
                id = undefined;
            }
            var r = _find(key, id);
            if (r.node) {
                return cb(r.node.val, function() {
                    _nodes.splice(r.index, 1);
                    _size -= 1;
                });
            } else {
                return cb(undefined);
            }
        },
        each: function(opts, cb) {
            if (cb === undefined) {
                cb = opts;
                opts = {};
            }
            
            var start, end, first, last, count, n, node;
            if (_nodes.length === 0) {
                return;
            }

            // Start with the first element or the provided startkey
            if (opts.startkey) {
                // TODO: If the startkey_docid is not present, then we should
                // match on just the key and ignore any 'id's. 
                start = _find(opts.startkey);
                if (! start.node) {
                    return;
                }
            } else {
                if (opts.descending) {
                    first = _nodes[_nodes.length - 1];
                    start = { index: _nodes.length - 1, node: first, type: first.type };
                } else {
                    first = _nodes[0];
                    start = { index: 0, node: first, type: first.type };
                }
            }

            // End with the last element or the provided endkey
            // TODO: Restrict the scope of _find between first/last and 
            // start.index depending on opts.descending. So for example, if
            // start.index is 998/1000 kvs and opts.descending is not set,
            // we only have to look for 2 docs for opts.endkey.
            if (opts.endkey) {
                end = _find(opts.endkey);
                if (! end.node) {
                    return;
                }
            } else {
                if (opts.descending) {
                    first = _nodes[0];
                    end = { index: 0, node: first, type: first.type };
                } else {
                    last = _nodes[_nodes.length-1];
                    end = { index: _nodes.length - 1, node: last, type: last.type };
                }
            }

            // Limit the number of entries, if opts.limit is provided.
            // Otherwise, we iterate over the entire range.
            //
            // TODO: Does it make sense to do async here so we don't lock
            // up other clients. Since we already have a callback given to us
            // we can take our time walking the list. Downside is the other
            // clients might be making changes to the list which means the
            // iterator needs to account for the _nodes array getting modified
            // while we are iterating.
            count = opts.limit === undefined ? Math.abs(start.index - end.index) + 1 : opts.limit;
            if (opts.descending) {
                for (n = start.index; count > 0 && n >= end.index; --n, --count) {
                    node = _nodes[n];
                    if (cb(node.key, node.val, node.id, node) === false) {
                        break;
                    }
                }
            } else {
                for (n = start.index; count > 0 && n <= end.index; ++n, --count) {
                    node = _nodes[n];
                    if (cb(node.key, node.val, node.id, node) === false) {
                        break;
                    }
                }
            }
        },
        // Primarily used for unit testing to ensure that the collation works
        // as expected
        _index: function(key, id) {
            var r = _find(key, id);
            return r.node ? r.index : -1;
        },
        _dump: function() {
            console.log(_nodes);
        }
    }
};

this.create = function() {
    return new Store();
};
