var BTree = require(__dirname + '/../lib/btree');
var Assert = require('assert');
var Runner = require('./runner');

var tests = {
    setup: function() {
        return BTree.create();
    },
    test_create: function(tree) {
        Assert.strictEqual(0, tree.size());
        root = tree._root();
        Assert.strictEqual(0, root.kvs().length);
        Assert.strictEqual(0, root.nodes().length);
        Assert.strictEqual(undefined, root.parent());
    },
    test_erase_case_1: function(tree) {
        root = tree._root();
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        tree.insert(10);
        tree.insert(11);
        tree.insert(4);
        tree.insert(2);
        tree.insert(1);
        // root._dump();        
        
        tree.erase(11);
        // root._dump();
        
        Assert.strictEqual(1, root.kvs().length);
        Assert.strictEqual(6, root.kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes().length);
        Assert.strictEqual(1, root.nodes()[0].kvs().length);
        Assert.strictEqual(4, root.nodes()[0].kvs()[0].key);
        Assert.strictEqual(1, root.nodes()[1].kvs().length);
        Assert.strictEqual(8, root.nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[0].nodes().length);
        Assert.strictEqual(2, root.nodes()[0].nodes()[0].kvs().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs()[0].key);
        Assert.strictEqual(2, root.nodes()[0].nodes()[0].kvs()[1].key);
        Assert.strictEqual(1, root.nodes()[0].nodes()[1].kvs().length);
        Assert.strictEqual(5, root.nodes()[0].nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[1].nodes().length);
        Assert.strictEqual(1, root.nodes()[1].nodes()[0].kvs().length);
        Assert.strictEqual(7, root.nodes()[1].nodes()[0].kvs()[0].key);
        Assert.strictEqual(2, root.nodes()[1].nodes()[1].kvs().length);
        Assert.strictEqual(9, root.nodes()[1].nodes()[1].kvs()[0].key);
        Assert.strictEqual(10, root.nodes()[1].nodes()[1].kvs()[1].key);
    },
    test_erase_case_2: function(tree) {
        root = tree._root();
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        tree.insert(10);
        tree.insert(11);
        tree.insert(4);
        tree.insert(2);
        tree.insert(1);
        // root._dump();
        
        tree.erase(5);
        tree.erase(7);
        // root._dump();
        
        Assert.strictEqual(1, root.kvs().length);
        Assert.strictEqual(6, root.kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes().length);
        Assert.strictEqual(1, root.nodes()[0].kvs().length);
        Assert.strictEqual(2, root.nodes()[0].kvs()[0].key);
        Assert.strictEqual(1, root.nodes()[1].kvs().length);
        Assert.strictEqual(9, root.nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[0].nodes().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs()[0].key);        
        Assert.strictEqual(1, root.nodes()[0].nodes()[1].kvs().length);
        Assert.strictEqual(4, root.nodes()[0].nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[1].nodes().length);
        Assert.strictEqual(1, root.nodes()[1].nodes()[0].kvs().length);
        Assert.strictEqual(8, root.nodes()[1].nodes()[0].kvs()[0].key);
        Assert.strictEqual(2, root.nodes()[1].nodes()[1].kvs().length);
        Assert.strictEqual(10, root.nodes()[1].nodes()[1].kvs()[0].key);
        Assert.strictEqual(11, root.nodes()[1].nodes()[1].kvs()[1].key);        
    },
    test_erase_case_3: function(tree) {
        root = tree._root();
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        tree.insert(10);
        tree.insert(11);
        tree.insert(4);
        tree.insert(2);
        tree.insert(1);
        // root._dump();     
        
        tree.erase(7);
        // root._dump();
        
        Assert.strictEqual(1, root.kvs().length);
        Assert.strictEqual(6, root.kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes().length);
        Assert.strictEqual(1, root.nodes()[0].kvs().length);
        Assert.strictEqual(4, root.nodes()[0].kvs()[0].key);
        Assert.strictEqual(1, root.nodes()[1].kvs().length);
        Assert.strictEqual(9, root.nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[0].nodes().length);
        Assert.strictEqual(2, root.nodes()[0].nodes()[0].kvs().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs()[0].key);        
        Assert.strictEqual(2, root.nodes()[0].nodes()[0].kvs()[1].key);        
        Assert.strictEqual(1, root.nodes()[0].nodes()[1].kvs().length);
        Assert.strictEqual(5, root.nodes()[0].nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[1].nodes().length);
        Assert.strictEqual(1, root.nodes()[1].nodes()[0].kvs().length);
        Assert.strictEqual(8, root.nodes()[1].nodes()[0].kvs()[0].key);
        Assert.strictEqual(2, root.nodes()[1].nodes()[1].kvs().length);
        Assert.strictEqual(10, root.nodes()[1].nodes()[1].kvs()[0].key);
        Assert.strictEqual(11, root.nodes()[1].nodes()[1].kvs()[1].key);        
    },
    test_erase_case_4: function(tree) {
        root = tree._root();
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        tree.insert(10);
        tree.insert(11);
        tree.insert(4);
        tree.insert(2);
        tree.insert(1);
        // root._dump();
        
        // TODO: If we erase 8, this will trigger #4 followed by #5
        tree.erase(4);
        // root._dump();
        
        Assert.strictEqual(1, root.kvs().length);
        Assert.strictEqual(6, root.kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes().length);
        Assert.strictEqual(1, root.nodes()[0].kvs().length);
        Assert.strictEqual(2, root.nodes()[0].kvs()[0].key);
        Assert.strictEqual(1, root.nodes()[1].kvs().length);
        Assert.strictEqual(8, root.nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[0].nodes().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs().length);
        Assert.strictEqual(1, root.nodes()[0].nodes()[0].kvs()[0].key);        
        Assert.strictEqual(1, root.nodes()[0].nodes()[1].kvs().length);
        Assert.strictEqual(5, root.nodes()[0].nodes()[1].kvs()[0].key);
        
        Assert.strictEqual(2, root.nodes()[1].nodes().length);
        Assert.strictEqual(1, root.nodes()[1].nodes()[0].kvs().length);
        Assert.strictEqual(7, root.nodes()[1].nodes()[0].kvs()[0].key);
        Assert.strictEqual(3, root.nodes()[1].nodes()[1].kvs().length);
        Assert.strictEqual(9, root.nodes()[1].nodes()[1].kvs()[0].key);
        Assert.strictEqual(10, root.nodes()[1].nodes()[1].kvs()[1].key);        
        Assert.strictEqual(11, root.nodes()[1].nodes()[1].kvs()[2].key);        
    },
    // test_erase_case_5: function(tree) {
    //     root = tree._root();
    //     tree.insert(5);
    //     tree.insert(6);
    //
    //     root._dump();
    //     tree.insert(7);
    //     root._dump();
    //
    //     tree.erase(7);
    //     root._dump();
    // }
};

Runner.run(tests);
