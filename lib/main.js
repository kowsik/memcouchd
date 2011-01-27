var Express = require('express');
var Server = require('./server');
var Database = require('./database');

// In memory store of all the dbs and the docs within them
global.Memcouch = {
    databases: {}
};

function helpers() {
    return function(req, res, next) {
        res.json = function(obj, status, headers) {
            res.useChunkedEncodingByDefault = false;
            res.writeHead(status || 200, headers || {});
            res.end(JSON.stringify(obj));
        };
        
        res.niy = function(obj) {
            res.json({ error: 'niy', reason: 'not implemented yet' }, 501);
        };
        
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
    
    app.listen(5985);
    console.log('listening on localhost:5985');
}

main();