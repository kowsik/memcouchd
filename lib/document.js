var Store = require('./store');

this.mount = function(app) {
    var status = { 
        'illegal_database_name': 400, 
        'bad_request': 400,
        'not_found': 404, 
        'file_exists': 412 
    };
        
    // Fetch a given document
    app.get('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbGetDoc(req.params.db, req.params.doc_id);
        var headers = json.error ? {} : { 'ETag': json._rev };
        res.json(json, status[json.error] || 200, headers);
    });
    
    // Create a new document with the ID
    app.put('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbPutDoc(req.params.db, req.params.doc_id, req.json);
        res.json(json, status[json.error] || 201);
    });
    
    // Create a new document with automatic ID
    app.post('/:db/', function(req, res) {
        var json = Memcouch.dbPutDoc(req.params.db, undefined, req.json);
        res.json(json, status[json.error] || 201);        
    });
    
    // Delete a document at a particular revision
    app.del('/:db/:doc_id', function(req, res) {
        var json = Memcouch.dbDeleteDoc(req.params.db, req.params.doc_id, req.params.rev);
        res.json(json, status[json.error] || 200);
    });
};