var Store = require('./store');
var Design = require('./design');
var View = require('./view');
var PubSub = require('./pubsub');
var Collate = require("./collate");

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
        dbGet: function(name, cb) {
            return _ifDBExists(name, cb);
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
                    update_seq: 0,
                    pubsub: PubSub.create()
                };

                return { ok: true };
            });
        },
        dbDelete: function(name) {
            return _ifDBExists(name, function(db) {
                db.pubsub.destroy();
                delete _databases[name];
                return { ok: true };
            });
        },
        dbGetDoc: function(name, docid, query) {
            query = query || {};
            return _ifDBExists(name, function(db) {
                var doc = db.docs.find(docid);
                if (doc) {
                    // TODO: This is a hack, we should really be storing
                    // a meta-doc in the store so that we can have these
                    // other attributes associated with the doc.
                    delete doc._revs_info;
                    delete doc._local_seq;
                    if (query.revs_info === 'true') {
                        doc._revs_info = [ { status: 'available', rev: doc._rev } ];
                    } else if (query.local_seq === 'true') {
                        doc._local_seq = 1;
                    } else {
                    }
                }
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

                    db.pubsub.publish(function(sub) {
                        return { seq: db.update_seq, id: doc._id };
                    });
                    return { ok: true, id: doc._id, rev: doc._rev };
                });
            });
        },
        dbDeleteDoc: function(name, docid, rev) {
            return _ifDBExists(name, function(db) {
                return db.docs.erase2(docid, function(_doc, erasecb) {
                    if (_doc) {
                        if (_doc._rev !== rev) {
                            return { error: 'conflict', reason: 'document update conflict' };
                        }

                        _doc._rev = [ parseInt(_doc._rev.split('-')[0], 10) + 1, _createUUID() ].join('-');

                        erasecb();
                        db.update_seq += 1;

                        if (RE_DESIGN_DOC.test(docid)) {
                            var name = RegExp.$1;
                            delete db.design[name];
                        } else {
                            var n;
                            for (n in db.design) {
                                if (db.design.hasOwnProperty(n)) {
                                    db.design[n].erase(_doc);
                                }
                            }
                        }

                        db.pubsub.publish(function(sub) {
                            return { seq: db.update_seq, id: _doc._id, deleted: true };
                        });
                        return { ok: true, id: _doc._id, rev: _doc._rev };
                    } else {
                        return { error: 'not_found', reason: 'missing' };
                    }
                });
            });
        },
        dbGetDocs: function(name, keys, cb) {
            if (Collate.type(keys) !== Collate._Array) {
                return { error: 'bad_request', reason: '`keys` member must be a array.' };
            }

            return _ifDBExists(name, function(db) {
                keys.forEach(function(key) {
                    var doc = db.docs.findFirst(key);
                    if (doc) { cb({ id: key, key: key, value: doc }); }
                });
                return { total_rows: db.docs.size() };
            });
        },
        dbAllDocs: function(name, opts, cb) {
            return _ifDBExists(name, function(db) {
                return db.docs.each(opts, function(key, val) {
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

                return _view.each(opts, cb);
            });
        },
        dbTempView: function(name, doc, opts, cb) {
            return _ifDBExists(name, function(db) {
                var d, view = View.create('temp', doc);

                db.docs.each(function(_, d) { view.update(d); });
                return view.each(opts, cb);
            });
        },
        dbSubscribe: function(name, opts, req, updatecb, finishcb) {
            return _ifDBExists(name, function(db) {
                return db.pubsub.subscribe(opts, req, updatecb, finishcb);
            });
        },
        dbUnsubscribe: function(name, sub) {
            return _ifDBExists(name, function(db) {
                return db.pubsub.unsubscribe(sub);
            })
        }
    };
};
