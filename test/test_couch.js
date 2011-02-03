var Couch = require(__dirname + '/../lib/couch');
var Assert = require('assert');
var Runner = require('./runner');

var basic_tests = {
    setup: function() {
        return Couch.create();
    },
    test_uuid: function(couch) {
        var uuid = couch.uuid();
        Assert.ok(typeof(uuid) === 'string');
        Assert.strictEqual(32, uuid.length);
        Assert.ok(/^[0-9a-f]+$/.test(uuid));
    },
    test_db_create_invalid_name: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbCreate(name);
            Assert.equal('illegal_database_name', json.error);            
        });
    },
    test_db_create_exists: function(couch) {
        json = couch.dbCreate('test');
        Assert.strictEqual(true, json.ok);
        json = couch.dbCreate('test');
        Assert.equal('file_exists', json.error);
    },
    test_db_info: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbInfo(name);
            Assert.equal('illegal_database_name', json.error);            
        });
        
        json = couch.dbCreate('test');
        Assert.strictEqual(true, json.ok);
        
        json = couch.dbInfo('test');
        Assert.strictEqual('test', json.db_name);
        Assert.strictEqual(0, json.doc_count);
        Assert.strictEqual(0, json.update_seq);
        Assert.strictEqual(0, json.committed_update_seq);
        
        json = couch.dbInfo('test2');
        Assert.equal('not_found', json.error);        
    },
    test_db_delete: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbDelete(name);
            Assert.equal('illegal_database_name', json.error);            
        });
        
        json = couch.dbDelete('test');
        Assert.equal('not_found', json.error);
        
        json = couch.dbCreate('test');
        json = couch.dbDelete('test');
        Assert.strictEqual(true, json.ok);
    },
    test_db_get_doc_invalid_db_name: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbGetDoc(name);
            Assert.equal('illegal_database_name', json.error);            
        });        
    },
    test_db_put_doc_invalid_db_name: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbPutDoc(name, undefined, {});
            Assert.equal('illegal_database_name', json.error);            
        });        
    },
    test_db_all_docs_invalid_db_name: function(couch) {
        [ '', '_foo', 'ABC', 'a~' ].forEach(function(name) {
            json = couch.dbAllDocs(name);
            Assert.equal('illegal_database_name', json.error);            
        });                
    }
};

var doc_tests = {
    setup: function() {
        var couch = Couch.create();
        couch.dbCreate('test');
        return couch;
    },
    test_put_null_doc: function(couch) {
        json = couch.dbPutDoc('test');
        Assert.equal('bad_request', json.error);
    },
    test_put_doc_with_id: function(couch) {
        json = couch.dbPutDoc('test', 'foo', { hello: "world" });
        Assert.strictEqual(true, json.ok);
        Assert.equal('foo', json.id);
        Assert.ok(typeof json.rev === 'string');
        Assert.ok(/^1-/.test(json.rev));
        
        json = couch.dbInfo('test');
        Assert.strictEqual(1, json.doc_count);
        Assert.strictEqual(1, json.update_seq);
        Assert.strictEqual(1, json.committed_update_seq);
    },
    test_put_doc_id_in_doc: function(couch) {
        json = couch.dbPutDoc('test', undefined, { _id: 'foo', hello: "world" });
        Assert.strictEqual(true, json.ok);
        Assert.equal('foo', json.id);
        Assert.ok(typeof json.rev === 'string');
        Assert.ok(/^1-/.test(json.rev));
        
        json = couch.dbInfo('test');
        Assert.strictEqual(1, json.doc_count);
        Assert.strictEqual(1, json.update_seq);
        Assert.strictEqual(1, json.committed_update_seq);        
    },
    test_put_doc_auto_id: function(couch) {
        json = couch.dbPutDoc('test', undefined, { hello: "world" });
        Assert.strictEqual(true, json.ok);
        Assert.ok(typeof json.id === 'string');
        Assert.strictEqual(32, json.id.length);
        Assert.ok(typeof json.rev === 'string');
        Assert.ok(/^1-/.test(json.rev));
        
        json = couch.dbInfo('test');
        Assert.strictEqual(1, json.doc_count);
        Assert.strictEqual(1, json.update_seq);
        Assert.strictEqual(1, json.committed_update_seq);        
    },
    test_put_conflict: function(couch) {
        json = couch.dbPutDoc('test', 'foo', { hello: "foo" });
        Assert.strictEqual(true, json.ok);
        json = couch.dbPutDoc('test', 'foo', { hello: 'bar' });
        Assert.equal('conflict', json.error);
        
        json = couch.dbInfo('test');
        Assert.strictEqual(1, json.doc_count);
        Assert.strictEqual(1, json.update_seq);
        Assert.strictEqual(1, json.committed_update_seq);        
    },
    test_put_update: function(couch) {
        json = couch.dbPutDoc('test', 'foo', { hello: "foo" });
        Assert.strictEqual(true, json.ok);
        
        json = couch.dbGetDoc('test', 'foo');
        Assert.equal('foo', json._id);
        Assert.equal('foo', json.hello);
        
        json.hello = 'bar';
        json = couch.dbPutDoc('test', 'foo', json);
        Assert.strictEqual(true, json.ok);
        Assert.ok(/^2-/.test(json.rev));
        
        // Make sure the update_seq has gone up
        json = couch.dbInfo('test');
        Assert.strictEqual(1, json.doc_count);
        Assert.strictEqual(2, json.update_seq);
        Assert.strictEqual(2, json.committed_update_seq);        
    },
    test_get_not_found: function(couch) {
        json = couch.dbPutDoc('test', 'foo', { hello: "foo" });
        Assert.strictEqual(true, json.ok);
        
        json = couch.dbGetDoc('test', 'bar');
        Assert.equal('not_found', json.error);
    },
    test_all_docs: function(couch) {
        for (n=0; n<100; ++n) {
            json = couch.dbPutDoc('test', n.toString(), { foo: n });
            Assert.strictEqual(true, json.ok);
        }
        
        json = couch.dbInfo('test');
        Assert.strictEqual(100, json.doc_count);
        Assert.strictEqual(100, json.update_seq);
        Assert.strictEqual(100, json.committed_update_seq);
        
        json = couch.dbAllDocs('test', { limit: 1 }, function(row) {});
        Assert.strictEqual(undefined, json);
        
        json = couch.dbAllDocs('test', { limit: 1 }, function(row) {
            Assert.strictEqual('0', row.id);
            Assert.strictEqual(row.id, row.key);
            Assert.strictEqual(0, row.value.foo);
        });
        
        json = couch.dbAllDocs('test', { descending: true, limit: 1 }, function(row) {
            Assert.strictEqual('99', row.id);
            Assert.strictEqual(row.id, row.key);
            Assert.strictEqual(99, row.value.foo);
        });
        
        json = couch.dbAllDocs('test', { startkey: 42, endkey: 43 }, function(row) {
            Assert.strictEqual('42', row.id);
            Assert.strictEqual(row.id, row.key);
            Assert.strictEqual(42, row.value.foo);
        });        
    }
};

var view_tests = {
    setup: function() {
        var couch = Couch.create();
        couch.dbCreate('test');
        return couch;
    },
    test_put_view_in_empty_db: function(couch) {
        design = {
            _id: '_design/foo',
            views: {
                bar: {
                    map: "function(doc) { emit(doc.type, doc.value); }"
                }
            }
        }
        json = couch.dbPutDoc('test', undefined, design);
        Assert.strictEqual(true, json.ok);
        
        json = couch.dbView('test', 'foo', 'bar', function() { });
        Assert.strictEqual(0, json.total_rows);
        
        json = couch.dbView('test', 'foo', 'bar', function() { 
            // Nothing should be in the view
            Assert.strictEqual(true, false);
        });
        
        json = couch.dbView('test', 'foo2', 'bar');
        Assert.equal('not_found', json.error);
        
        json = couch.dbView('test', 'foo', 'bar2');
        Assert.equal('not_found', json.error);
        
        // Delete the view
        json = couch.dbGetDoc('test', '_design/foo');
        Assert.equal('_design/foo', json._id);
        json = couch.dbDeleteDoc('test', '_design/foo', json['_rev']);
        Assert.strictEqual(true, json.ok);
        json = couch.dbView('test', 'foo2', 'bar');
        Assert.equal('not_found', json.error);
    }
};

Runner.run(basic_tests);
Runner.run(doc_tests);
Runner.run(view_tests);