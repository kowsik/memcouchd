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
    test_insert_overwrite: function(store) {
        store.insert('k0', 'v0');
        Assert.equal('v0', store.find('k0'));
        store.insert('k0', 'v1');
        Assert.equal('v1', store.find('k0'));
        Assert.equal(1, store.size());
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
    test_descending_each: function(store) {
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
    }
};

Runner.run(tests);