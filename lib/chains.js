/**
	This writeup was originally written in chain_test.js in the main directory. It mostly applies here, so I 
	copied it over to here.

	This test is to prove that the chain library can handle one chain after another even though the proceeding
	chain hasn't finished executing yet. Initially there was a problem with internal chain values being altered
	by the subsequent chain. Now, what the user deals with is a chain wrapper and not the actual chain. The 
	wrapper creates an internal chain and builds external functions for it. The functions map directory to the
	internal chain functions. One of the functions act as a trigger though. In the case of chains, it is the
	end() function. Once that function has been called, the internal chain is vulnerable until the chain has 
	fully completed execution. So when the wrapper's end function is called, the wrapper quickly replaces the
	internal chain with a new one and rebuilds its functions to point to it. So the user thinks they are just
	starting a new chain, but they are actually using a completely different chain.

	This test proves that it works.

	Issues with the current wrappper is that properties are not wrapped. Fortunately for chains there is no
	access really allowed to the properties anyways. This issue would have to be fixed if this technique was
	to be used for another object that did want to expose properties.

**/

'use strict';

var //promises = require('dorm').promises,
	util = require('util'),
	deferred = require('deferred'),
	_ = require('underscore');

var chain = {},
	chainFactory = {},
	counter;
/*	loop_interval,
	pre_loop_func,
	post_loop_func,
	loop_execute = false,
	initial_loop_start = false,
	values = {count: undefined, chain: chain};*/

function out (type) {
	if (counter === undefined) {
		counter = 1;
	}
	console.log('Chain execute ' + type + '->->->->->->-> ' + counter);
	counter++;
};

function error_handler_creator(type, vals, err) {
	var handler, error_handler;
	if (typeof err === 'function') {
		error_handler = err;
	} 
	else if (typeof vals.err === 'function'){
		error_handler = vals.err;
	} 
	else {
		error_handler = function(fail, vals) {
			console.log(type + ' failed for ', fail);
		}
	}
	//console.log('ERROR HANDLER CREATOR', typeof error_handler, type, typeof vals.err, typeof err);
	handler = function (fail) {
		var values = vals;
		out(type + ' error handler');
		console.log('Chains Fail Handler executed');
		return error_handler(fail, values);
	};
	return handler;
};

chainFactory.create = function() {
	var derived = _.clone(chain);

	derived.loop_interval = undefined;
	derived.pre_loop_func = undefined;
	derived.post_loop_func = undefined;
	derived.loop_execute = false;
	derived.initial_loop_start = false;
	derived.values = {count: undefined, chain: derived};

	return derived;
};


chain.attachErrorHandler = function (err) {
	if (typeof err === 'function') {
		this.values.err = err;
	}
};

chain.attachPromise = function (promise) {
	if (this.promise === undefined) {
		this.promise = promise;
	} else {
		this.promise = this.promise.then(function(){ return promise; }, function(fail){console.log('Failure in promise chain', fail);});
	}
};

chain.startLoop = function (start_value, interval) {
	this.values.count = start_value || 0;
	this.loop_interval = interval || 1;
	this.initial_loop_start = true;
};

chain.func = function(func, err) {
	var self = this, vals = this.values;
	var error_handler;
	if (typeof func === 'function') {
		if (typeof err === 'function'){
			error_handler = error_handler_creator('func', vals, err);
		} 
		else if (this.promise === undefined) {
			error_handler = function(fail) { 
				console.log('First Run custom function caught failure', fail, func); 
			};
		} else {
			error_handler = function(fail) { 
				console.log('Custom function caught failure', fail, func); 
			};
		}
		error_handler = error_handler_creator('func', vals, err); //Testing this override of the error handler
		if (this.promise === undefined) {
			var def = deferred();
			this.promise = def.promise.then(function() { return func(null, vals) }, error_handler);
			setTimeout(def.resolve, 500);
		} else {
			this.promise = this.promise.then(function(win) { return func(win, vals); }, error_handler);
		}
	}
};

chain.promisify = function(func, err) {
	//console.log('Chains Promisify Running...');
	var self = this,
		def = deferred(),
		results,
		handler = function() {
			//console.log('Chains Promisify handler running...');
			//console.log('Arguments =', arguments);
			self.addValues({arguments: arguments});
			def.resolve();
		};
	this.func(function(win, vals) {
		//console.log('Chains Promisify calling function');
		func(handler);
	});
	self.attachPromise(def.promise);
};

chain.addValues = function(val) {
	for (var i in val) {
		this.values[i] = val[i];
	}
};

//Deprecated
chain.startAfter = function(promise) {
	if (this.promise === undefined) {
		this.promise = promise;
		return true;
	}
}
//Deprecated
chain.loopExecute = function(bool) {
	if (typeof bool === 'boolean') {
		this.loop_execute = bool;
	}
};

chain.next = function () {
	var self = this, vals = this.values
	if (typeof this.post_loop_func === 'function') {
		this.func(this.post_loop_func);
	}
	this.func(function(win, vals) { 
		console.log('###################### count values', vals.count, self.loop_interval);
		vals.count = vals.count + self.loop_interval; 
	});
	if (typeof this.pre_loop_func === 'function') {
		this.func(this.pre_loop_func);
	}
};

chain.__endLoop = function() {
	this.values.count = undefined;
	this.loop_interval = undefined;
	this.pre_loop_func = undefined;
	this.post_loop_func = undefined;
	this.loop_execute = false;
}

chain.endLoop = function(err) {
	var self = this,
		vals = this.values;
	var error_handler = error_handler_creator('endloop', vals, err);
	if (error_handler === undefined) {
		console.log('ENDLOOP ERROR HANDLER IS UNDEFINED');
	} else {
		//console.log('ENDLOOP ERROR HANDLER IS DEFINED');
	}
	this.promise = this.promise.then(function(win) { self.__endLoop(); }, error_handler);
}
//Deprecated
chain.preLoop = function(func) {
	if (typeof func === 'function') {
		this.pre_loop_func = func;
		if (this.loop_execute) {
			this.func(this.pre_loop_func);
			this.pre_loop_func = undefined;
		}
		if (this.initial_loop_start) {
			this.func(this.pre_loop_func);
			this.initial_loop_start = false;
		}
	}
}
//Deprecated
chain.postLoop = function(func) {
	if (typeof func === 'function') {
		this.post_loop_func = func;
		if (this.loop_execute) {
			this.func(this.post_loop_func);
			this.post_loop_func = undefined;
		}
	}
}



chain.__end = function() {
	this.counter = undefined;
	this.values = {};
}

chain.end = function (func, err) {
	var self = this, vals = this.values;
	if (this.promise === undefined) {
		return false;
	}
	var error_func = {err: vals.err};
	var error_handler = error_handler_creator('end', vals, err);
	this.endLoop();
	//this.promise = this.promise.then(function(win) { 
	//	self.__end(); 
	//}, error_handler);
	if (typeof func !== 'function') {
		var def = new deferred();
		func = function(){
			def.resolve();
		};
		var error = function(fail) {
			error_handler(fail);
			def.resolve();
		}
		var result = this.promise.end(func, error);
		this.promise = undefined;
		return def.promise;
	} else {
		var error = function(fail) {
			var def = new Deferred();
			error_handler(fail);
			def.resolve();
			return def.promise;
		}
		var result = this.promise.end(func);
		this.promise = undefined;
		return result;
	}
	
};



//module.exports = chain;
module.exports = chainFactory;

/*

a = {};

a.FunctionA = function FunctionA(){
  var fName = arguments.callee.toString().match(/function ([^\(]+)/)[1]
  alert('Hi, I\'m in a function named '+fName)
}

a.FunctionB = function FunctionB(){
  alert(arguments.callee.toString().match(/function ([^\(]+)/)[1]);
}

function FunctionC(){
  a.FunctionA();
  a.FunctionB();
}
FunctionC();*/



/*
var obj = {
    a: true,
    b: function(){alert('function b');},
    c: function(){alert('function c');},
    end: function(){alert('function end');}
};
var objFactory = {
    create: function() { 
        var val = {};
        for (key in obj) {
            val[key] = obj[key];
        }
        return val;
    }
};
var objWrapper = {};
objWrapper.__obj = objFactory.create();
objWrapper.__rewrap_function_name = 'end';
objWrapper.__wrap = function(fname) {
    console.log('begin wrap', this);
    for (var key in this) {
        console.log(key);
        if (this.hasOwnProperty(key) && typeof this[key] === 'function') {
            console.log(key, this);
            delete this[key];
        }
    }
    this.__proto__.__obj = objFactory.create();
    for (var key in this.__obj) {
        console.log(key);
        if (this.__obj.hasOwnProperty(key) && typeof this.__obj[key] === 'function') {
            this[key] = (function(self) {
            	var fname = key;
                return function() {
                    var obj = self.__proto__.__obj
                    console.log('function <' + fname + '> fired', self, self.__proto__.__obj, obj);
                    if(typeof obj[fname] === 'function') {
                        var result = obj[fname].apply(obj, arguments);
                        if (fname === self.__proto__.__rewrap_function_name) {
                            self.__wrap(key);
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


objWrapperFactory = {
    create: function() {
        var o = Object.create(objWrapper);
        delete o.__obj;
		console.log(objWrapper, o);
        o.__wrap();
        return o;
    }
}

var o = objWrapperFactory.create();
//o.b();
obj.d = function(v1, v2, v3) {alert('function d ' + v1 + ' ' + v2 + ' ' + v3);};
console.log(o, obj);
o.end();
console.log(o, o.__proto__.__obj, obj);
o.d(true, true, true);
o.d(false, true);
*/