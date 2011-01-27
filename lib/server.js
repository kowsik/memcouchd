this.mount = function(app) {
    app.get('/_all_dbs', function(req, res) {
        var dbs = [];
        Memcouch.databases.forEach(function(db) {
            dbs.push(db.name);
        });
        res.json(dbs);
    });
    
    app.get('/_config', function(req, res) {
        res.niy();
    });
    
    app.get('/_uuids', function(req, res) {
        res.niy();
    });
    
    app.post('/_replicate', function(req, res) {
        res.niy();
    });
    
    app.get('/_stats', function(req, res) {
        res.niy();
    });
    
    app.get('/_active_tasks', function(req, res) {
        res.niy();
    });
};