var chainFactory = require("./chains");

/*
* Enables the ability to reuse a chain after calling .end() on the current one.
* Acts like a wrapper that proxies calls to the composed chain object
*
* Proxies to all methods on chain
*/
var chainWrapper = {
	__obj: chainFactory.create(),
	__rewrap_function_name: 'end',
	cycle: function (bool) { 
		if (typeof bool === 'boolean') {
			this.__proto__.__cycle = bool;
		}
	},
	__wrap: function(fname) {
	    for (var key in this) {
	        if (this.hasOwnProperty(key) && typeof this[key] === 'function') {
	            delete this[key];
	        }
	    }
	    this.__proto__.__obj = chainFactory.create();
	    if (this.__proto__.__cycle) {
	    	this.__proto__.__obj.__cycle = true;
	    }
	    if (this.__proto__.__mixins) {
	    	for (property in this.__proto__.__mixins) {
	    		this.__proto__.__obj[property] = this.__proto__.__mixins[property];
	    	}
	    }
	    for (var key in this.__obj) {
	        if (this.__obj.hasOwnProperty(key) && typeof this.__obj[key] === 'function') {
	            this[key] = (function(self) {
	            	var fname = key;
	                return function() {
	                    var obj = self.__proto__.__obj
	                    if(typeof obj[fname] === 'function') {
	                        var result = obj[fname].apply(obj, arguments);
	                        if (fname === self.__proto__.__rewrap_function_name) {
	                            self.__wrap(key);
	                            if (self.__proto__.__cycle && result && typeof result.then === 'function') {
	                            	self.__proto__.__obj.promise = result;
	                            }
	                        }
	                        return result;
	                    } else {
	                        throw 'ERROR: function ' + key + ' doesn\'t exist';
	                    }
	                }
	            })(this);
	        }
	    }
	}
};

var chainWrapperFactory = {
    create: function(options) {
        var o = Object.create(chainWrapper);
        if (options && options.cycle) {
        	o.__proto__.__cycle = true;
        }
        if (options && options.mixins) {
        	o.__proto__.__mixins = options.mixins;
        }
        o.__wrap();
        return o;
    }
}

module.exports = chainWrapperFactory;
