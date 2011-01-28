var Express = require('express');
var Server = require('./server');
var Database = require('./database');
var Document = require('./document');
var Couch = require('./couch');

// In memory store of all the dbs and the docs within them
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
        
        // For PUT and POST requests with JSON content type, don't invoke
        // the next middleware until we got the whole JSON document. We also
        // parse this JSON document and set this in the request.
        if (req.method === 'PUT' || req.method === 'POST') {
            if (req.headers['content-type'] === 'application/json') {
                var data = [];
                req.on('data', function(chunk) {
                    data.push(chunk.toString('utf8'));
                }).on('end', function() {
                    try {
                        req.json = JSON.parse(data.join(''));                        
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
    
    app.get('/', function(req, res) {
        res.json({ memcouchd: 'Welcome', version: '0.0.1' });
    });
    
    // Mount the various parts of the app
    Server.mount(app);
    Database.mount(app);
    Document.mount(app);
    
    app.listen(5985);
    console.log('listening on localhost:5985');
}

main();