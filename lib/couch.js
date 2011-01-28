var Store = require('./store');

this.create = function() {
    var _databases = {};
    
    var RE_VALID_DB_NAMES = /^[a-z][a-z0-9_\$\(\)+\-\/]+$/;
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
            b[i++] = (r = r >>> 8) & 0xff;
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
                    update_seq: db.update_seq
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
                    update_seq: 0
                };
                
                return { ok: true };
            });            
        },
        dbDelete: function(name) {
            return _ifDBExists(name, function(db) {
                delete Memcouch.databases[name];
                return { ok: true };                
            });
        },
        dbGetDoc: function(name, docid) {
            return _ifDBExists(name, function(db) {
                var doc = db.docs.find(docid);
                return doc || { error: 'not_found', reason: 'missing' };
            });
        },
        dbPutDoc: function(name, doc_id, doc) {
            if (!doc) {
                return { error: 'bad_request', reason: 'invalid UTF-8 JSON' };
            }
            
            // Generate doc._id if it's not provided
            doc._id = doc_id || doc._id || _createUUID();
            return _ifDBExists(name, function(db) {
                return db.docs.insert2(doc._id, function(_doc, insertcb) {
                    if (_doc) {
                        // Check for update conflict
                        if (_doc._rev !== doc._rev) {
                            return { error: 'conflict', reason: 'document update conflict' };
                        }
                        
                        // And bump the revision
                        doc._rev = [ parseInt(doc._rev.split('-')[0], 10) + 1, _createUUID() ].join('-');
                    } else {
                        doc._rev = '1-' + _createUUID();
                    }
                    
                    insertcb(doc);
                    db.update_seq += 1;
                    
                    // TODO: Lots of work to do here
                    // 1. If this is a _design doc, then add them to the 
                    //    _design list in the db
                    // 2. Update all the _design views for this database
                    //        - Does the view server get passed in the design docs?
                    // 3. If there are _changes listeners, write the change
                    return { ok: true, id: doc._id, rev: doc._rev };
                });
            });
        },
        dbDeleteDoc: function(name, doc_id, rev) {
            return _ifDBExists(name, function(db) {
                return db.docs.erase2(doc_id, function(_doc, erasecb) {
                    if (_doc) {
                        if (_doc._rev != rev) {
                            return { error: 'conflict', reason: 'document update conflict' };                            
                        }
                        
                        erasecb();
                        db.update_seq += 1;
                        
                        // TODO: We need to remove all the [k, v] pairs in 
                        // each of the _design views that have this doc._id
                        // If we are going to be caching the reduce values
                        // within the store itself, then we also need to
                        // rereduce the values to account for the missing docs
                        return { ok: true, rev: rev };
                    } else {
                        return { error: 'not_found', reason: 'missing' };
                    }
                });
            });
        },
        dbGetDocs: function(name, opts, cb) {
            return _ifDBExists(name, function(db) {
                // TODO: Directly have the store do all the work?
                // Maybe, we just use the store to lookup the first doc and
                // then iterate from there. So really the store just needs to
                // provide an iterator starting at a particular document
                // descending: true|false
                // limit: <number>
                // startkey:
                // startkey_docid
                // endkey:
                // endkey_docid
                // keys
            });
        }
    };
};
