var View = require(__dirname + '/../lib/view');
var Assert = require('assert');
var Runner = require('./runner');

var tests = {
    test_map_100000: function() {
        var v = { map: "function(doc) { emit(doc.type, doc.value); }" };
        var n = 0;
        
        var view = View.create('blah', v);
        Assert.strictEqual(true, view.hasMap());
        Assert.strictEqual(false, view.hasReduce());
        
        var keys = [ 'a', 'b', 'c' ];
        for (n=0; n<100000; ++n) {
            type = keys[Math.floor(3 * Math.random())];
            value = Math.floor(10 * Math.random());
            view.update({ _id: n, type: type, value: value })
        }
    },
    test_reduce_100000: function() {
        var v = {
            map: "function(doc) { emit(doc.type, doc.value); }",
            reduce: "_sum"
        };
        
        var view = View.create('blah', v);
        Assert.strictEqual(true, view.hasMap());
        Assert.strictEqual(true, view.hasReduce());
        
        var keys = [ 'a', 'b', 'c' ];
        for (var n=0; n<100000; ++n) {
            type = keys[Math.floor(3 * Math.random())];
            value = Math.floor(10 * Math.random());
            view.update({ _id: n, type: type, value: value })
        }
        
        rows = [];
        view.each(function(row) { rows.push(row); });
    }
};

Runner.run(tests);
