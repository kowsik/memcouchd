var Store = require('./store');

this.mount = function(app) {
    var status = {
        'illegal_database_name': 400,
        'bad_request': 400,
        'not_found': 404,
        'file_exists': 412
    };

    app.put('/:db', function(req, res) {
        var json = Memcouch.dbCreate(req.params.db);
        var headers = {};
        headers['Location'] = 'http://' + req.headers.host + '/' + req.params.db;
        res.json(json, status[json.error] || 201, headers);
    });

    app.get('/:db', function(req, res) {
        var json = Memcouch.dbInfo(req.params.db);
        res.json(json, status[json.error] || 200);
    });

    app.del('/:db', function(req, res) {
        var json = Memcouch.dbDelete(req.params.db);
        res.json(json, status[json.error] || 200);
    });

    // This is primarily a feed=continuous implementation. The big difference
    // between couch and this is, you don't get at the various changes if you are
    // not watching the feed. In that sense it's more like redis' pubsub.
    //
    // TODO:
    // - add support for filtered changes
    // - support include_docs in the req.query
    // - when the filter changes or the design doc gets updated, same thing
    // - I'm sure there's a bunch of other corner cases
    app.get('/:db/_changes', function(req, res) {
        var opts = {};
        var hbid;
        var sub = Memcouch.dbSubscribe(req.params.db, opts, req, function(json) {
            res.write(JSON.stringify(json) + '\n');
        }, function() {
            if (hbid) { clearInterval(hbid); }
            res.end();
        });

        if (sub.error) {
            res.json(sub, status[sub.error]);
            return;
        }

        // Heartbeat to keep the connection alive
        hbid = setInterval(function() {
            res.write('\n');
        }, opts.heartbeat || 60000);

        res.useChunkedEncodingByDefault = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        req.connection.on('end', function() {
            Memcouch.dbUnsubscribe(req.params.db, sub);
        });
    });

    app.post('/:db/_compact', function(req, res) {
        res.json({ ok: true });
    });    
};