var View = require(__dirname + '/../lib/view');
var Assert = require('assert');
var Runner = require('./runner');

var tests = {
    test_create: function() {
        var v = {
            map: "function(doc) { emit(doc.type, 1); }"
        };
        
        var view = View.create('blah', v);
        Assert.equal(0, view.size());
    },
    test_map: function() {
        var v = {
            map: "function(doc) { emit(doc.type, doc.value); }"
        };
        
        var view = View.create('blah', v);
        Assert.strictEqual(true, view.hasMap());
        Assert.strictEqual(false, view.hasReduce());
        
        view.update({ _id: 1, type: 'a', value: 'b' });
        Assert.deepEqual({ 'a': true }, view._keys({ _id: 1 }));
        
        view.update({ _id: 2, type: 'a', value: 'b' });
        Assert.deepEqual({ 'a': true }, view._keys({ _id: 2 }));
        
        Assert.strictEqual(2, view.size());
        Assert.strictEqual('b', view.find('a', 1));
        Assert.strictEqual('b', view.find('a', 2));
        
        rows = [];
        view.each(function(row) {
            rows.push(row);
        });
        
        Assert.strictEqual(1, rows[0].id);
        Assert.strictEqual('a', rows[0].key);
        Assert.strictEqual('b', rows[0].value);
        
        Assert.strictEqual(2, rows[1].id);
        Assert.strictEqual('a', rows[1].key);
        Assert.strictEqual('b', rows[1].value);
        
        // Update the doc with a new value
        view.update({ _id: 1, type: 'a', value: 'b2'});
        Assert.strictEqual(2, view.size());
        Assert.strictEqual('b2', view.find('a', 1));
        Assert.deepEqual({ 'a': true }, view._keys({ _id: 1 }));
        
        // Update the doc with a new type
        view.update({ _id: 1, type: 'c', value: 'b3' });
        Assert.strictEqual(2, view.size());
        Assert.strictEqual(undefined, view.find('a', 1));
        Assert.strictEqual('b3', view.find('c', 1));
        Assert.deepEqual({ 'c': true }, view._keys({ _id: 1 }));
        
        rows = [];
        view.each(function(row) { rows.push(row); });
        
        Assert.strictEqual(2, rows[0].id);
        Assert.strictEqual('a', rows[0].key);
        Assert.strictEqual('b', rows[0].value);
        
        Assert.strictEqual(1, rows[1].id);
        Assert.strictEqual('c', rows[1].key);
        Assert.strictEqual('b3', rows[1].value);
        
        // Erase the doc from the view (completely)
        view.erase({ _id: 1 });
        Assert.strictEqual(1, view.size());
        Assert.strictEqual(undefined, view.find('c', 1));
        Assert.strictEqual(undefined, view._keys({ _id: 1 }));
    },
    test_reduce: function() {
        var v = {
            map: "function(doc) { emit(doc.type, doc.value); }",
            reduce: "_sum"
        };
        
        var view = View.create('blah', v);
        Assert.strictEqual(true, view.hasMap());
        Assert.strictEqual(true, view.hasReduce());
        
        view.update({ _id: 1, type: 'a', value: 1 });
        view.update({ _id: 2, type: 'b', value: 4 });
        view.update({ _id: 3, type: 'a', value: 3 });
        view.update({ _id: 4, type: 'a', value: 2 });
        view.update({ _id: 5, type: 'b', value: 5 });
        view.update({ _id: 6, type: 'c', value: 7 });
        
        rows = [];
        view.each(function(row) { rows.push(row); });
        Assert.strictEqual(3, rows.length);
        Assert.equal('a', rows[0].key);
        Assert.equal(6, rows[0].value)
        Assert.equal('b', rows[1].key);
        Assert.equal(9, rows[1].value)
        Assert.equal('c', rows[2].key);
        Assert.equal(7, rows[2].value)
    }
};

Runner.run(tests);