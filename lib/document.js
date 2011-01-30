var Store = require('./store');

this.mount = function(app) {
    var status = { 
        'illegal_database_name': 400, 
        'bad_request': 400,
        'not_found': 404, 
        'file_exists': 412 
    };
    
    var _parseViewOptions = function(params) {
        var n, opts = {};
        
        var parsers = {
            limit: function(v) {
                return parseInt(v, 10);
            },
            startkey: function(v) {
                return JSON.parse(v);
            },
            endkey: function(v) {
                return JSON.parse(v);
            },
            descending: function(v) {
                return v === 'true' ? true : v === false ? false : undefined;
            }
        };
        
        for (n in params) {
            if (params.hasOwnProperty(n) && parsers.hasOwnProperty(n)) {
                opts[n] = parsers[n](params[n]);
            }
        }
        
        return opts;
    };

    // TODO: Need to stream this over instead of accumulating all the docs
    // in memory first, which means we do JSON.stringify on each row, but
    // the rest of the surrounding JSON is vanilla res.write
    app.get('/:db/_all_docs', function(req, res) {
        var output = { rows: [] };
        var opts = _parseViewOptions(req.query);
        var json = Memcouch.dbAllDocs(req.params.db, opts, function(row) {
            output.rows.push(row);
        });
        
        json = json || output;
        res.json(json, status[json.error] || 200);
    });
    
    app.get('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbGetDoc(req.params.db, req.params.doc_id);
        var headers = json.error ? {} : { 'ETag': json._rev };
        res.json(json, status[json.error] || 200, headers);
    });
    
    app.put('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbPutDoc(req.params.db, req.params.doc_id, req.json);
        res.json(json, status[json.error] || 201);
    });
    
    app.post('/:db/', function(req, res) {
        var json = Memcouch.dbPutDoc(req.params.db, undefined, req.json);
        res.json(json, status[json.error] || 201);        
    });
    
    app.del('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbDeleteDoc(req.params.db, req.params.doc_id, req.params.rev);
        res.json(json, status[json.error] || 200);
    });
};