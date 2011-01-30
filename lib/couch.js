var Store = require('./store');
var Design = require('./design');

// The core couch interface, a little more geared towards Sinatra access as
// opposed to programmatic one. But it's all there. This API is a pure JSON
// one. The resulting errors are mapped to various HTTP access codes in the
// Sinatra layer. No exceptions are thrown from within this API layer.
this.create = function() {
    var _databases = {};
    
    var RE_VALID_DB_NAMES = /^[a-z][a-z0-9_\$\(\)+\-\/]+$/;
    var RE_DESIGN_DOC = /^_design\/(.*)$/;
    
    var _ifNameValid = function(name, cb) {
        if (RE_VALID_DB_NAMES.test(name) === false) {
            return { "error":"illegal_database_name","reason":"Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter."};
        }
        
        return cb();        
    };
    
    var _ifDBExists = function(name, cb) {
        return _ifNameValid(name, function() {
            var db = _databases[name];
            if (!db) {
                return { error: 'not_found', reason: 'no_db_file' };
            }
            return cb(db);
        });
    };
    
    // From: https://github.com/broofa/node-uuid
    var _createUUID = (function() {
        var hex = [ 
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
            'a', 'b', 'c', 'd', 'e', 'f'
        ];
        return function() {
            var b = [], i = 0, r, v;
            
            r = Math.random() * 0x100000000;
            v = r & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            
            r = Math.random() * 0x100000000;
            v = r & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;        
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[0x4];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;        
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            
            r = Math.random() * 0x100000000;
            v = r & 0x3f | 0x80;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;        
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;        
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;        
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            
            r = Math.random() * 0x100000000;
            v = r & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            v = (r = r >>> 8) & 0xff;
            b[i++] = hex[(v >>> 4) & 0x0f];
            b[i++] = hex[v & 0x0f];
            return b.join('');
        };
    }());
    
    return {
        uuid: function() {
            return _createUUID();
        },
        allDbs: function() {
            var dbs = [];
            _databases.forEach(function(db) {
                dbs.push(db.name);
            });
            return dbs;
        },
        dbInfo: function(name) {
            return _ifDBExists(name, function(db) {
                return {
                    db_name: name,
                    doc_count: db.docs.size(),
                    update_seq: db.update_seq,
                    committed_update_seq: db.update_seq
                };
            });
        },
        dbCreate: function(name) {
            return _ifNameValid(name, function() {
                var db = _databases[name];
                if (db) {
                    return { error: 'file_exists', reason: 'The database could not be created, the file already exists.' };
                }
                
                _databases[name] = {
                    name: name,
                    docs: Store.create(),
                    design: {},
                    update_seq: 0
                };
                
                return { ok: true };
            });            
        },
        dbDelete: function(name) {
            return _ifDBExists(name, function(db) {
                delete _databases[name];
                return { ok: true };                
            });
        },
        dbGetDoc: function(name, docid) {
            return _ifDBExists(name, function(db) {
                var doc = db.docs.find(docid);
                return doc || { error: 'not_found', reason: 'missing' };
            });
        },
        dbPutDoc: function(name, docid, doc) {
            if (!doc) {
                return { error: 'bad_request', reason: 'invalid UTF-8 JSON' };
            }
            
            doc._id = docid || doc._id || _createUUID();
            return _ifDBExists(name, function(db) {
                return db.docs.insert2(doc._id, function(_doc, insertcb) {
                    if (_doc) {
                        if (_doc._rev !== doc._rev) {
                            return { error: 'conflict', reason: 'document update conflict' };
                        }
                        
                        doc._rev = [ parseInt(doc._rev.split('-')[0], 10) + 1, _createUUID() ].join('-');
                    } else {
                        doc._rev = '1-' + _createUUID();
                    }
                    
                    insertcb(doc);
                    db.update_seq += 1;
    
                    if (RE_DESIGN_DOC.test(doc._id)) {
                        var name = RegExp.$1;
                        db.design[name] = Design.create(db.docs, doc);
                    } else {
                        var n;
                        for (n in db.design) {
                            if (db.design.hasOwnProperty(n)) {
                                db.design[n].update(doc);
                            }
                        }
                    }
                    
                    return { ok: true, id: doc._id, rev: doc._rev };
                });
            });
        },
        dbDeleteDoc: function(name, docid, rev) {
            return _ifDBExists(name, function(db) {
                return db.docs.erase2(docid, function(_doc, erasecb) {
                    if (_doc) {
                        if (_doc._rev != rev) {
                            return { error: 'conflict', reason: 'document update conflict' };                            
                        }
                        
                        erasecb();
                        db.update_seq += 1;
                        
                        if (RE_DESIGN_DOC.test(docid)) {
                            delete design[RegExp.$1];
                        } else {
                            var n;
                            for (n in db.design) {
                                if (db.design.hasOwnProperty(n)) {
                                    db.design[n].erase(doc);
                                }
                            }
                        }
                        
                        return { ok: true, id: _doc._id, rev: rev };
                    } else {
                        return { error: 'not_found', reason: 'missing' };
                    }
                });
            });
        },
        dbAllDocs: function(name, opts, cb) {
            return _ifDBExists(name, function(db) {
                db.docs.each(opts, function(key, val) {
                    cb({ id: key, key: key, value: val });
                });
            });
        },
        dbView: function(name, design, view, opts, cb) {
            return _ifDBExists(name, function(db) {
                var _design = db.design[design];
                var _view = _design ? _design.view(view) : undefined;
                if (_view === undefined) {
                    return { error: 'not_found', reason: 'missing' };
                }
                
                _view.each(opts, function(key, val, id) {
                    cb({ id: id, key: key, value: val });
                });
            });
        }
    };
};
