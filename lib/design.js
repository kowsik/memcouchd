var View = require('./view');

function _create(design) {
    var name, views = {};
    for (name in design.views) {
        views[name] = View.create(name, design.views[name]);
    }
    return views;
}

this.create = function(docs, design) {
    var _views = _create(design);
    
    // TODO: This should be async so the view index generation can happen
    // over time.
    docs.each(function(_, doc) {
        if (doc._id.indexOf('_design') === 0) { return; }
        for (var v in _views) {
            if (_views.hasOwnProperty(v)) {
                _views[v].update(doc);                
            }
        }
    });
    
    return {
        view: function(name) {
            return _views[name];
        },
        update: function(doc) {
            for (var v in _views)  {
                _views[v].update(doc);
            }
        },
        erase: function(doc) {
            for (var v in _views)  {
                _views[v].erase(doc);
            }
        }
    };
};
