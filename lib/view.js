var Store = require('./store');

// A single map/reduce view as in CouchDB. A few observations:
// Each emitted [k, v] needs to be mapped to the doc._id that was used.
// When the doc is updated/deleted, we can easily delete the [k, v] pairs 
// associated with the document and then refresh the index.
//
// [k1, v1] ... [k2, v2] ... [k3, v3]
//
// In this case, k1, k2, k3 all belong to the same doc._id, but are not 
// contiguous (collation). We store an additional mapping in the view.
// 
// doc._id => [ k1, k2, k3 ]
//
// Then when the doc changes, we have to find the [ k1, k2, k3 ] in the store
// and erase them. There might be other k1, k2, k3 from other docs so we have
// to be careful about only deleting the right ones.
this.create = function(name, view) {
    var _name = name;
    var _store = Store.create();
    var _id2keys = {};
    
    // The "current" emit [k,v] pairs. Managed by the insert below
    var _kvlist = [];
    
    function emit(key, val) {
        _kvlist.push([key, val]);
    }
    
    var _map = view.map ? eval('(' + view.map + ')') : undefined;
    var _reduce = view.reduce ? eval('(' + view.reduce + ')') : undefined;
    
    return {
        name: function() {
            return _name;
        },
        size: function() {
            return _store.size();
        },
        find: function(key, id) {
            return _store.find(key, id);
        },
        find_first: function(key) {
            return _store.find_first(key);
        },
        each: function(opts, cb) {
            return _store.each(opts, cb);
        },
        update: function(doc) {
            if (_map === undefined) {
                return;
            }
            
            // Run the doc through the map function to emit the [k,v] pairs
            _kvlist.length = 0;
            _map(doc);
            
            var i, key, val, kvi, docid = doc._id, length = _kvlist.length, 
                ik = _id2keys[docid], kmap = {};
            
            if (ik === undefined) {
                // First encounter with this doc and no emit's either
                if (length === 0) { return; }
                ik = _id2keys[docid] = {};
            }
            
            // First insert all the emitted [k,v] into the store. At the
            // same time delete that key from the _id2keys[docid]
            for (i=0; i<length; ++i) {
                kvi = _kvlist[i];
                key = kvi[0];
                val = kvi[1];
                
                _store.insert(key, val, docid);
                kmap[key] = true;
                delete ik[key];
            }
            
            // If, now, there are keys left in _id2keys, they represent
            // emitted [k,v] in the past that weren't emitted this time around
            // So, simply erase from the store.
            for (i in ik) {
                if (ik.hasOwnProperty(i)) {
                    _store.erase(i, docid);
                }
            }
            
            // And finally replace the _id2keys for this doc with the new kmap
            // for the next round of updates
            _id2keys[docid] = kmap;
        },
        // Completely remove the doc from the view
        erase: function(doc) {
            var docid = doc._id, kmap = _id2keys[docid], i;
            if (kmap) {
                for (i in kmap) {
                    if (kmap.hasOwnProperty(i)) {
                        _store.erase(i, docid);
                    }
                }
                delete _id2keys[docid];
            }
        },
        // Internally, mostly used in the unit tests to ensure the integrity
        // of the view across various updates and erase's
        _keys: function(doc) {
            return _id2keys[doc._id];
        },
        _store: function() {
            return _store;
        },
        _dump: function() {
            _store._dump();
        }
    }
};