this.create = function() {
    var _subscribers = {};
    
    return {
        subscribe: function(opts, req, changecb, finishcb) {
            var uuid = Memcouch.uuid(), sub;
            sub = {
                id: uuid,
                opts: opts,
                req: req,
                change: changecb,
                finish: finishcb
            };
            _subscribers[uuid] = sub;
            return sub;
        },
        unsubscribe: function(sub) {
            var sub = _subscribers[sub.id];
            if (sub) {
                sub.finish();
                delete _subscribers[sub.id];
            }
        },
        destroy: function() {
            var s, sub;
            for (s in _subscribers) {
                if (_subscribers.hasOwnProperty(s)) {
                    sub = _subscribers[s];
                    this.unsubscribe(sub);
                }
            }
        },
        publish: function(cb) {
            var s, sub, obj;
            for (s in _subscribers) {
                if (_subscribers.hasOwnProperty(s)) {
                    sub = _subscribers[s];
                    obj = cb(sub.req, sub.opts);
                    if (obj) {
                        sub.change(obj);                        
                    }
                }
            }
        }
    }
};