var Store = require('./store');
var Collate= require('./collate');

this.create = function(name, view) {
    var _name = name;
    var _store = Store.create();
    var _id2keys = {};

    var _kvlist = [];
    function emit(key, val) {
        _kvlist.push([key, val]);
    }

    function sum(values) {
        var s = 0, n = 0;
        for (; n<values.length; ++n) {
            s += values[n];
        }
        return s;
    }

    function _sum(keys, values) {
        return sum(values);
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
        hasMap: function() {
            return _map !== undefined;
        },
        hasReduce: function() {
            return _reduce !== undefined;
        },
        find: function(key, id) {
            return _store.find(key, id);
        },
        findFirst: function(key) {
            return _store.findFirst(key);
        },
        each: function(opts, cb) {
            if (cb === undefined) {
                cb = opts;
                opts = {};
            }

            // TODO:
            // - Support group_level's and group=true
            var reduce = _reduce !== undefined;
            if (opts.reduce === false) {
                reduce = false;
            }

            if (reduce) {
                var last_key, last_val, last_tkey;
                _store.each(opts, function(key, val, id, node) {
                    if (last_key === undefined) {
                        last_key  = key;
                        last_val  = _reduce([ key ], [ val ]);
                        last_tkey = node.tkey;
                    } else {
                        if (Collate.compare2(key, node.tkey, last_key, last_tkey) === 0) {
                            last_val = _reduce(null, [ last_val, val ], true);
                        } else {
                            cb({ key: last_key, value: last_val });
                            last_key  = key;
                            last_val  = _reduce([ key ], [ val ]);
                            last_tkey = node.tkey;
                        }
                    }
                });

                if (last_key !== undefined) {
                    cb({ key: last_key, value: last_val });
                }

                return {};
            } else {
                return _store.each(opts, function(key, val, id, node) {
                    cb({ id: id, key: key, value: val });
                });
            }
        },
        update: function(doc) {
            if (_map === undefined) {
                return;
            }

            _kvlist.length = 0;
            _map(doc);

            var i, key, val, kvi, docid = doc._id, length = _kvlist.length,
                ik = _id2keys[docid], kmap = {};

            if (ik === undefined) {
                if (length === 0) { return; }
                ik = _id2keys[docid] = {};
            }

            for (i=0; i<length; ++i) {
                kvi = _kvlist[i];
                key = kvi[0];
                val = kvi[1];

                _store.insert(key, val, docid);
                kmap[key] = true;
                delete ik[key];
            }

            for (i in ik) {
                if (ik.hasOwnProperty(i)) {
                    _store.erase(i, docid);
                }
            }

            _id2keys[docid] = kmap;
        },
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
