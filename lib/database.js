this.mount = function(app) {
    // TODO: Need to use middleware to validate and check for the existence
    // of the DB all in one place.
    var validate_db_name = function(req, res, next) {
        var name = req.params['db'];
        if (/^[a-z][a-z0-9_\$\(\)+\-\/]+$/.test(name) === false) {
            res.json({"error":"illegal_database_name","reason":"Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter."});
            return;
        }
        next();        
    };
    
    // Get database information
    app.get('/:db', validate_db_name);
    app.get('/:db', function(req, res) {
        var name = req.params.db;
        var db = Memcouch.databases[name];
        if (!db) {
            res.json({ error: 'not_found', reason: 'no_db_file' }, 404);
        } else {
            res.json({
                db_name: name,
                doc_count: 0, // TODO: Check the doc count!
                update_seq: 0
            });
        }
    });
    
    // Create a database
    app.put('/:db', validate_db_name);
    app.put('/:db', function(req, res) {
        var name = req.params.db;
        var db = Memcouch.databases[name];
        if (db) {
            res.json({ error: 'file_exists', reason: 'The database could not be created, the file already exists.' }, 412);
            return;
        }
        
        Memcouch.databases[name] = {
            name: name,
            docs: []
        };
        
        res.json({ ok: true }, 201);
    });
    
    // Delete a database
    app.del('/:db', validate_db_name);
    app.del('/:db', function(req, res) {
        var name = req.params.db;
        var db = Memcouch.databases[name];
        if (!db) {
            res.json({ error: 'not_found', reason: 'no_db_file' }, 404);            
        } else {
            delete Memcouch.databases[name];
            res.json({ ok: true });
        }
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