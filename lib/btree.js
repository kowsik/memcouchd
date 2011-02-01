var Collate = require('./collate');

var _ORDER     = 2;
var _ORDER_1   = _ORDER - 1;
var _MAX_NODES = 2 * _ORDER;
var _MAX_KVS   = _MAX_NODES - 1;

function Node(parent) {
    var _kvs = [], _nodes = [], _parent = parent;
    
    var self = this;
    
    this.kvs = function(v) {
        if (v) { _kvs = v; }
        return _kvs;
    };
    
    this.nodes = function(v) {
        if (v) {
            _nodes = v;
            _nodes.forEach(function(node) {
                if (node !== undefined) {
                    node.parent(self);                        
                }
            });
        }
        return _nodes;
    };
    
    this.parent = function(p) {
        if (p) { _parent = p; }
        return _parent;
    };
    
    this.insert = function(kv) {
        var nkvs = _kvs.length, pos, 
            key, ktype, id, itype,
            kv2, key2, val2, ktype2, id2, itype2, c, 
            right;
            
        if (_kvs.length === 0) {
            _kvs.push(kv);
            return;
        }
        
        key   = kv.key;
        ktype = kv.ktype;
        id    = kv.id;
        itype = kv.itype;
        
        for (pos = 0; pos < nkvs; ++pos) {
            kv2    = _kvs[pos];
            key2   = kv2.key;
            ktype2 = kv2.ktype;
            if (Collate.compare2(key, ktype, key2, ktype2) <= 0) {
                break;
            }
        }
        
        if (nkvs < _MAX_KVS) {
            _kvs.splice(pos, 0, kv);
            if (pos !== nkvs && _nodes.length > 0) {
                _nodes.splice(pos, 0, undefined);                    
            }
        } else {
            right = self.split();
            if (pos > _ORDER_1) {
                right.insert(kv);
            } else {
                _kvs.splice(pos, 0, kv);
                if (_nodes.length > 0) {
                    throw new Error("not tested yet");
                    _nodes.splice(pos, 0, undefined);
                }
            }
        }
    };
    
    this.split = function() {
        if (_kvs.length === _MAX_KVS) {
            if (_parent === undefined) {
                return self._splitRoot();
            } else {
                _parent.split();
                return _parent._splitNode(self);
            }
        }
    };
    
    var _slice = function(ary, start, end) {
        var nary = ary.slice(start, end), nlen = nary.length, nn = false, i;
        for (i = 0; i < nlen; ++i) {
            if (nary[i] !== undefined) { break; }
        }
        
        return i === nlen ? undefined : nary;
    };
    
    this._splitRoot = function() {
        var right = new Node(self), left = new Node(self);
        
        left.kvs(_kvs.slice(0, _ORDER_1));
        right.kvs(_kvs.slice(_ORDER, _MAX_KVS));
        
        left.nodes(_slice(_nodes, 0, _ORDER));
	    right.nodes(_slice(_nodes, _ORDER, _MAX_NODES));
        
		_kvs   = [ _kvs[_ORDER_1] ];
		_nodes = [ left, right ];
		return right;
	};
	
	this._splitNode = function(node) {
	    var pos = 0, nkvs = _kvs.length, 
	        kvs_n = node.kvs(), nodes_n = node.nodes(), 
	        kv_n_o1 = kvs_n[_ORDER_1], kv2,
	        o1_key = kv_n_o1.key, key2,
	        o1_ktype = kv_n_o1.ktype, ktype2,
	        right;
	    
	    for (pos = 0; pos < nkvs; ++pos) {
	        kv2    = _kvs[pos];
	        key2   = kv2.key;
	        ktype2 = kv2.ktype;
	        if (Collate.compare2(o1_key, o1_ktype, key2, ktype2) <= 0) {
		        break;		            
	        }
	    }
		
		_kvs.splice(pos, 0, kv_n_o1);
		
		right = new Node(self);
		right.kvs(kvs_n.slice(_ORDER, _MAX_KVS));			
	    right.nodes(_slice(nodes_n, _ORDER, _MAX_NODES));
		
		kvs_n.length = _ORDER_1;
		if (nodes_n.length > 0) {
		    nodes_n.length = _ORDER;
	    }
		
		_nodes.splice(pos, 0, node);
		_nodes[pos + 1] = right;
		return right;
	};
	
	this.erase = function(kvindex, nindex) {
	    var pnode, pnodes, pkvs, plast, kvtemp, node, nodes, kvs;
	    
	    if (_nodes.length === 0) {
            // test_erase_case_1
	        if (nindex === undefined || _kvs.length > _ORDER_1) {
	            _kvs.splice(kvindex, 1);
	            return;
            }
            
            pnode = _parent;
            pnodes = _parent.nodes();
            pkvs  = _parent.kvs();
            
            // last node of parent
            if (nindex === pkvs.length) {
                node = pnodes[nindex - 1]; // left of self
                nodes = node.nodes();
                kvs = node.kvs();
                
                // test_erase_case_2
                if (kvs.length > _ORDER_1) { // rotate right
                    _kvs[kvindex] = pkvs[nindex - 1];
                    pkvs[nindex - 1] = kvs[kvs.length - 1];
                    node.erase(kvs.length - 1, nindex - 1);
                    return;
                }
                
                // test_erase_case_5
                throw new Error("test_erase_case_5");
            } 
            
            // middle node of parent
            node = pnodes[nindex + 1]; // right of self
            nodes = node.nodes();
            kvs = node.kvs();
            
            // test_erase_case_3
            if (kvs.length > _ORDER_1) { // rotate left
                _kvs[kvindex] = pkvs[nindex];
                pkvs[nindex] = kvs[0];
                node.erase(0, nindex + 1);
                return;
            }
            
            throw new Error("test_erase_case_6");
	    }
	    
        // test_erase_case_4
        nindex = kvindex;
        pnode = _nodes[nindex];
        pnodes = pnode.nodes();	        
        while (pnodes.length !== 0) {
            nindex = pnodes.length - 1;
            pnode  = pnodes[nindex];
            pnodes = pnode.nodes();
        }
        
        pkvs = pnode.kvs();
        plast = pkvs.length - 1;
        kvtemp = pkvs[plast];
        pkvs[plast] = _kvs[kvindex];
        _kvs[kvindex] = kvtemp;
        pnode.erase(plast, nindex);
	};
	
	var _indent = function(depth) {
        var i, indent = depth * 2;
	    for (var i=0; i<indent; ++i) {
	        process.stdout.write(' ');
	    }
	};
	
	this._dump = function(depth) {
	    depth = depth || 0;
	    if (depth === 0) { process.stdout.write('\n'); }
	    
	    var kvs = [];
	    _kvs.forEach(function(kv) { kvs.push(kv.key); });
	    
	    _indent(depth);
	    console.log('kv: ' + kvs);
	    
	    _nodes.forEach(function(n) { 
	        if (n) {
		        n._dump(depth+1);
	        } else {
	            _indent(depth+1);
	            console.log('null');
	        }
	    });
	};
};

function BTree() {
    var _root = new Node();
    var _size = 0;
        
    var _find = function(key, id, key_only_match) {
        var ktype, itype, node, nodes, nodeslen, kvindex, nindex, c,
            kvs2, kvs2len, kv2, id2, ktype2, itype2;
        ktype = Collate.type(key);
        itype = Collate.type(id);
        
		node = _root;
		nodes = _root.nodes();
		nodeslen = nodes.length;
		while (true) {
			kvs2 = node.kvs();
			kvs2len = kvs2.length;
			for (kvindex=0; kvindex<kvs2len; ++kvindex) {
			    kv2    = kvs2[kvindex];
			    key2   = kv2.key;
			    ktype2 = kv2.ktype;
			    c = Collate.compare2(key, ktype, key2, ktype2);
			    if (c === 0) {
			        // TODO: Compare the id's as well
			        return { node: node, kv: kv2, kvindex: kvindex, nindex: nindex, ktype: ktype, itype: itype };
			    } else if (c < 0) {
			        break;
			    }
			}
			
			if (nodeslen > 0) {
    			node = nodes[kvindex];
    			nindex = kvindex;
    			nodes = node.nodes();
    			nodeslen = nodes.length;
			} else {
			    break;
			}			
		}
		
		return { node: node, ktype: ktype, itype: itype };
    };
        
    var self = this;
    return {
        size: function() {
            return _size;
        },
        find: function(key, id) {
            var ctx = _find(key, id);
            return ctx.kv ? ctx.kv.val : undefined;
        },
        insert: function(key, val, id) {
            var ctx = _find(key, id);                
            if (ctx.kv) {
                ctx.kv.val = val;
            } else {
                ctx.node.insert({ id: id, key: key, val: val, ktype: ctx.ktype, itype: ctx.itype });
                _root.split();            
                _size += 1;
            }
        },
        erase: function(key, id) {
            var ctx = _find(key, id);
            if (ctx.kv) {
                ctx.node.erase(ctx.kvindex, ctx.nindex);
                _size -= 1;
                return ctx.kv.val;
            }
        },
        _root: function() {
            return _root;
        }
    }
};

this.create = function() {
    return new BTree();
};
