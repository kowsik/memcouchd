var Express = require('express');
var Server = require('./server');
var Database = require('./database');
var Document = require('./document');
var Couch = require('./couch');

global.Memcouch = Couch.create();

function helpers() {
    return function(req, res, next) {
        // Output JSON objects
        res.json = function(obj, status, headers) {
            res.useChunkedEncodingByDefault = false;
            headers = headers || {};
            headers['Content-Type'] = 'application/json';
            res.writeHead(status || 200, headers);
            res.end(JSON.stringify(obj));
        };
        
        res.niy = function(obj) {
            res.json({ error: 'niy', reason: 'not implemented yet' }, 501);
        };
        
        if (req.method === 'PUT' || req.method === 'POST') {
            var ctype = req.headers['content-type'];
            if (ctype && ctype.indexOf('application/json') === 0) {
                var data = [];
                req.on('data', function(chunk) {
                    data.push(chunk.toString('utf8'));
                }).on('end', function() {
                    try {
                        req.json = data.length === 0 ? {} : JSON.parse(data.join(''));                        
                    } catch(e) {
                        res.json({ error: 'bad_request', reason: 'invalid UTF-8 JSON' }, 400);
                        return;
                    }
                    next();
                });                
                return;
            }
        }
        
        next();
    };
}

function main() {
    var app = Express.createServer(Express.logger(), helpers());
    
    app.use('/_utils/', Express.staticProvider('./www/'));
    
    app.get('/', function(req, res) {
        res.json({ couchdb: 'Welcome', memcouchdb: 'Yo!', version: '0.0.1' });
    });
    
    app.use('/', Express.staticProvider('./www/'));
    
    Server.mount(app);
    Database.mount(app);
    Document.mount(app);
    
    app.listen(5985);
    console.log('listening on localhost:5985');
}

main();