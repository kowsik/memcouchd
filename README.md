# memcouchd
Wrote this mostly for fun, to figure out how the inner workings of CouchDB
actually work and what it takes to do incremental map/reduce in a language
that I actually understand. I've tried to stay true to the core CouchDB
API, but having the HTTP layer separate from the inner database means this
also becomes an embeddable in-memory CouchDB implementation.