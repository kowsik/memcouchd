var View = require('./view');

function _create(design) {
    var name, views;
    for (name in design.views) {
        views[name] = View.create(name, design.views[name]);
    }
}

this.create = function(docs, design) {
    var _views = _create(design);
    
    // When the view is created, run through all the docs in the db
    // and update each of the views. From the point onwards, we only care
    // about update and erase.
    //
    // TODO: This should be async so the view index generation can happen
    // over time.
    docs.each(function(_, doc) {
        _views.forEach(function(view) {
            view.update(doc);
        });
    });
    
    return {
        views: function() {
            return _views;
        },
        update: function(doc) {
            _views.forEach(function(view) {
                view.update(doc);
            });
        },
        erase: function(doc) {
            _views.forEach(function(view) {
                view.erase(doc);
            });
        }
    };
};