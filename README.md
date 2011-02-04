# memcouchd
## What is it?
It's a pure JavaScript in-memory implementation of some aspects of CouchDB with a 
nodejs/connect Web front-end.

## Why?
Wrote this mostly for fun, to understand the inner workings of CouchDB
and what it takes to do incremental map/reduce in a language that I actually 
understand. I've tried to stay true to the core CouchDB API, but having the 
web layer separate from the inner database means this also becomes an 
embeddable in-memory CouchDB implementation. Kinda. Sorta.

## Uses?
Dunno at this point. My original thoughts were to build a good-enough in-memory
CouchDB using Node (again in a language that I'm familiar with), especially 
the `_changes` feed for a highly concurrent/async messaging service. Without
any persistence, I'm not sure that this would really work.

### _changes feed
Since `memcouchd` doesn't have any persistence, all the document changes are
not kept around. Because of this, the `_changes` feed behaves more like redis'
pubsub in that you have to be watching in order to get notified about a change.

# Store
The collated sequence (aka the view index) is a simple incrementally sorted
JavaScript array. While this helped me stay sane for the 2-day implementation,
it allowed me to bring up the rest of the system. However, this has huge 
scalability issues, because of the excessive use of `splice` to insert and remove 
elements. On my Mac, the `map` part of the view generation for `100,000` entries 
took a couple of seconds. Maybe at some point, I will replace the Store with a 
proper 2-3 BTree. Like I said, this was thrown together in a couple of days.

### collation
CouchDB uses the ICU collation library and sorts strings in a funky way. While
`memcouchd`'s collation is ordered, strings are sorted using charCode sort
as opposed to the ICU sort. Maybe someone knows of a nodejs ICU wrapper?

# Map/Reduce
I originally wrote the collation in JavaScript for the [Interactive CouchDB Tutorial](http://labs.mudynamics.com/2009/04/03/interactive-couchdb/). The
map part is the slowest because of the description above. The reduce in
`memcouchd` is always `re-reduce` and currently there's no caching of the 
reduced values. But v8 makes this super fast! So maybe there was a point to
this after all.

# Testing
This was fun and I almost feel like the jRuby guys trying to make things work
like ruby 1.8.6. Except we have the Futon unit tests + CouchOne's awesome
[documentation](http://docs.couchone.com) reference, which is a huge time
saver. If you do this, the nodejs/express code will deliver the Futon files
up to the browser so you can run the unit tests against `memcouchd`. Making
progress on the unit tests pass ratio, though I'm also discovering lots of
little hidden API's that are not completely documented.

    ln -s ~/Desktop/CouchDBX.app/Contents/Resources/couchdbx-core/couchdb_1.0.2/share/couchdb/www ./www
    