var Store = require('./store');

this.mount = function(app) {
    var status = { 
        'illegal_database_name': 400, 
        'bad_request': 400,
        'not_found': 404, 
        'file_exists': 412 
    };
    
    // Create a database
    app.put('/:db', function(req, res) {
        var json = Memcouch.dbCreate(req.params.db);
        res.json(json, status[json.error] || 201);
    });
    
    // Get database information
    app.get('/:db', function(req, res) {
        var json = Memcouch.dbInfo(req.params.db);
        res.json(json, status[json.error] || 200);
    });
    
    // Delete a database
    app.del('/:db', function(req, res) {
        var json = Memcouch.dbDelete(req.params.db);
        res.json(json, status[json.error] || 200);
    });
    
    // Changes
    app.get('/:db/_changes', function(req, res) {
        res.niy();
    });
    
    // Compaction - noop really
    app.post('/:db/_compact', function(req, res) {
        res.niy();
    });
};