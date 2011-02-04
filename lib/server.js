this.mount = function(app) {
    app.get('/_all_dbs', function(req, res) {
        res.json(Memcouch.allDbs());
    });

    app.get('/_config', function(req, res) {
        res.niy();
    });

    app.get('/_uuids', function(req, res) {
        var i, count = req.params.count || 1, json = { uuids: [] };
        for (i=0; i<count; ++i) {
            json.uuids.push(Memcouch.uuid());
        }
        res.json(json);
    });

    app.get('/_session', function(req, res) {
        res.json({
            ok: true,
            userCtx: { name: null, roles: [ '_admin' ] },
            info: {
                authentication_db: '_users',
                authentication_handlers: [ 'cookie', 'default' ]
            }
        });
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

    app.post('/_restart', function(req, res) {
        res.json({ ok: true });
    });
};