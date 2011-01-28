var Store = require(__dirname + '/../lib/store');
var Assert = require('assert');
var Runner = require('./runner');

var tests = {
    setup: function() {
        return Store.create();
    },
    test_empty: function(store) {
        Assert.equal(0, store.size());
    },
    test_insert: function(store) {
        var v = store.find('k1');
        Assert.equal(null, v);
        store.insert('k1', 'v1');
        v = store.find('k1');
        Assert.equal('v1', v);
        Assert.equal(1, store.size());

        v = store.find('k0');
        Assert.equal(null, v);
        store.insert('k0', 'v0');
        v = store.find('k0');
        Assert.equal('v0', v);
        Assert.equal(2, store.size());

        Assert.equal(0, store._index('k0'));
        Assert.equal(1, store._index('k1'));
    },
    test_insert_id: function(store) {
        var v = store.find('k1', 'id1');
        Assert.equal(null, v);
        store.insert('k1', 'v1', 'id1');
        v = store.find('k1');
        Assert.equal(null, v);
        v = store.find('k1', 'id1');
        Assert.equal('v1', v);
        Assert.equal(1, store.size());

        var v = store.find('k1', 'id2');
        Assert.equal(null, v);
        store.insert('k1', 'v2', 'id2');
        v = store.find('k1');
        Assert.equal(null, v);
        v = store.find('k1', 'id2');
        Assert.equal('v2', v);
        Assert.equal(2, store.size());

        Assert.equal(0, store._index('k1', 'id1'));
        Assert.equal(1, store._index('k1', 'id2'));
    },
    test_insert_overwrite: function(store) {
        store.insert('k0', 'v0');
        Assert.equal('v0', store.find('k0'));
        store.insert('k0', 'v1');
        Assert.equal('v1', store.find('k0'));
        Assert.equal(1, store.size());
        
        store.insert('k0', 'v2', 'id0');
        Assert.equal('v2', store.find('k0', 'id0'));
        store.insert('k0', 'v3', 'id0');
        Assert.equal('v3', store.find('k0', 'id0'));
        Assert.equal(2, store.size());
    },
    test_collation: function(store) {
        [ {}, [], 'string', 1.0, true, false, null, undefined ].forEach(function(k) {
            store.insert(k, 'v');
        });

        Assert.equal(8, store.size());
        Assert.equal(0, store._index(undefined));
        Assert.equal(1, store._index(null));
        Assert.equal(2, store._index(false));
        Assert.equal(3, store._index(true));
        Assert.equal(4, store._index(1.0));
        Assert.equal(5, store._index('string'));
        Assert.equal(6, store._index([]));
        Assert.equal(7, store._index({}));        
    },
    test_collation_id: function(store) {
        [ {}, [], 'string', 1.0, true, false, null, undefined ].forEach(function(k) {
            store.insert(k, 'v', '1');
            store.insert(k, 'v', '2');
        });

        Assert.equal(16, store.size());
        Assert.equal(0, store._index(undefined, '1'));
        Assert.equal(1, store._index(undefined, '2'));
        Assert.equal(2, store._index(null, '1'));
        Assert.equal(3, store._index(null, '2'));
        Assert.equal(4, store._index(false, '1'));
        Assert.equal(5, store._index(false, '2'));
        Assert.equal(6, store._index(true, '1'));
        Assert.equal(7, store._index(true, '2'));
        Assert.equal(8, store._index(1.0, '1'));
        Assert.equal(9, store._index(1.0, '2'));
        Assert.equal(10, store._index('string', '1'));
        Assert.equal(11, store._index('string', '2'));
        Assert.equal(12, store._index([], '1'));
        Assert.equal(13, store._index([], '2'));
        Assert.equal(14, store._index({}, '1'));
        Assert.equal(15, store._index({}, '2'));        
    },
    test_insert2: function(store) {
        store.insert('k0', 'v0');
        store.insert('k1', 'v1');
        Assert.equal(2, store.size());

        // Conditionally modify an existing [k, v]
        store.insert2('k0', function(v, cb) {
            Assert.equal('v0', v);
            cb('__v0__');
        });

        Assert.equal(2, store.size());
        Assert.equal('__v0__', store.find('k0'));

        // Conditionally modify a non-existing [k, v]
        store.insert2('k2', function(v, cb) {
            Assert.equal(undefined, v);
            cb('__v2__');
        });
        Assert.equal(3, store.size());
        Assert.equal('__v2__', store.find('k2'));
    },
    test_find: function(store) {
        Assert.equal(undefined, store.find('k0'));
        store.insert('k0', 'v0');
        Assert.equal('v0', store.find('k0'));
        
        Assert.equal(undefined, store.find('k0', 'id0'));
        store.insert('k0', 'v0', 'id0');
        Assert.equal('v0', store.find('k0', 'id0'));
        Assert.equal(2, store.size());
    },
    test_find_first: function(store) {
        Assert.equal(undefined, store.find('k0', 'id0'));
        store.insert('k0', 'v0', 'id0');
        Assert.equal('v0', store.find('k0', 'id0'));
        
        Assert.equal(undefined, store.find('k0', 'id1'));
        store.insert('k0', 'v0', 'id1');
        Assert.equal('v0', store.find('k0', 'id1'));
        
        Assert.equal(undefined, store.find('k0'));        
        Assert.equal('v0', store.find_first('k0', undefined, true));
    },
    test_erase: function(store) {
        var kvs = { k0: 'v0', k1: 'v1', k2: 'v2', k3: 'v3', k4: 'v4', k5: 'v5' }
        for (var kv in kvs) {
            if (kvs.hasOwnProperty(kv)) {
                store.insert(kv, kvs[kv]);
            }
        }

        Assert.equal(6, store.size());

        Assert.equal(undefined, store.erase('k6'));
        for (var kv in kvs) {
            if (kvs.hasOwnProperty(kv)) {
                Assert.equal(kvs[kv], store.erase(kv));
            }
        }
        Assert.equal(0, store.size());
    },
    test_erase2: function(store) {
        var kvs = { k0: 'v0', k1: 'v1', k2: 'v2', k3: 'v3', k4: 'v4', k5: 'v5' }
        for (var kv in kvs) {
            if (kvs.hasOwnProperty(kv)) {
                store.insert(kv, kvs[kv]);
            }
        }

        Assert.equal(6, store.size());

        Assert.equal(undefined, store.erase2('k6', function(v, cb) {
            Assert.equal(undefined, v);
        }));
        for (var kv in kvs) {
            if (kvs.hasOwnProperty(kv)) {
                Assert.equal(kvs[kv], store.erase2(kv, function(v, cb) {
                    Assert.equal(kvs[kv], v);
                    cb();
                    return kvs[kv];
                }));
            }
        }
        Assert.equal(0, store.size());        
    },
    _populate: function(store) {
        for (var n=0; n<1000; ++n) {
            store.insert(n, n);
        }
        Assert.equal(1000, store.size());
    },
    test_each: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({}, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(1000, kvs.length);
        Assert.equal(0, kvs[0].k);
        Assert.equal(999, kvs[999].k);
    },
    test_each_descending: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ descending: true }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(1000, kvs.length);
        Assert.equal(999, kvs[0].k);
        Assert.equal(0, kvs[999].k);
    },
    test_each_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({}, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 500) { return false; }
        });
        Assert.equal(500, kvs.length);
        Assert.equal(0, kvs[0].k);
        Assert.equal(499, kvs[499].k);
    },
    test_each_descending_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ descending: true }, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 500) { return false; }
        });
        Assert.equal(500, kvs.length);
        Assert.equal(999, kvs[0].k);
        Assert.equal(500, kvs[499].k);
    },
    test_each_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ limit: 10 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(10, kvs.length);
        Assert.equal(0, kvs[0].k);
        Assert.equal(9, kvs[9].k);
    },
    test_each_descending_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ descending: true, limit: 10 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(10, kvs.length);
        Assert.equal(999, kvs[0].k);
        Assert.equal(990, kvs[9].k);
    },
    test_each_limit_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ limit: 10 }, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 5) { return false; }
        });
        Assert.equal(5, kvs.length);
        Assert.equal(0, kvs[0].k);
        Assert.equal(4, kvs[4].k);
    },
    test_each_descending_limit_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ descending: true, limit: 10 }, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 5) { return false; }
        });
        Assert.equal(5, kvs.length);
        Assert.equal(999, kvs[0].k);
        Assert.equal(995, kvs[4].k);
    },
    test_each_startkey: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 997 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(3, kvs.length);
        Assert.equal(997, kvs[0].k);
        Assert.equal(998, kvs[1].k);
        Assert.equal(999, kvs[2].k);
    },
    test_each_startkey_descending: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 2, descending: true }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(3, kvs.length);
        Assert.equal(2, kvs[0].k);
        Assert.equal(1, kvs[1].k);
        Assert.equal(0, kvs[2].k);
    },
    test_each_startkey_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 997, limit: 1 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(1, kvs.length);
        Assert.equal(997, kvs[0].k);
    },
    test_each_startkey_descending_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 2, descending: true, limit: 1 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(1, kvs.length);
        Assert.equal(2, kvs[0].k);
    },
    test_each_startkey_endkey: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 2, endkey: 5 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(4, kvs.length);
        Assert.equal(2, kvs[0].k);
        Assert.equal(3, kvs[1].k);
        Assert.equal(4, kvs[2].k);
        Assert.equal(5, kvs[3].k);
    },
    test_each_startkey_endkey_descending: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 5, endkey: 2, descending: true }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(4, kvs.length);
        Assert.equal(5, kvs[0].k);
        Assert.equal(4, kvs[1].k);
        Assert.equal(3, kvs[2].k);
        Assert.equal(2, kvs[3].k);
    },
    test_each_startkey_endkey_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 2, endkey: 5, limit: 2 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(2, kvs.length);
        Assert.equal(2, kvs[0].k);
        Assert.equal(3, kvs[1].k);
    },
    test_each_startkey_endkey_descending_limit: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 5, endkey: 2, descending: true, limit: 2 }, function(k, v) {
            kvs.push({k: k, v: v});
        });
        Assert.equal(2, kvs.length);
        Assert.equal(5, kvs[0].k);
        Assert.equal(4, kvs[1].k);
    },
    test_each_startkey_endkey_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 2, endkey: 5, limit: 1 }, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 1) { return false; }
        });
        Assert.equal(1, kvs.length);
        Assert.equal(2, kvs[0].k);
    },
    test_each_startkey_endkey_descending_break: function(store) {
        tests._populate(store);
        var kvs = [];
        store.each({ startkey: 5, endkey: 2, descending: true, limit: 1 }, function(k, v) {
            kvs.push({k: k, v: v});
            if (kvs.length === 1) { return false; }
        });
        Assert.equal(1, kvs.length);
        Assert.equal(5, kvs[0].k);
    }    
};

Runner.run(tests);