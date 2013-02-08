


var chainFactory = require('..'),
	Deferred = require('deferred'),
	b_red = '\u001b[41m',
	b_green = '\u001b[42m',
	black = '\u001b[30m',
	reset = '\u001b[0m',
	bold = '\u001b[2m';


module.exports["chain parallel async test"] = function(beforeExit, assert) {
	var count = 0,
		chain = chainFactory.create();
	chain.addValues({a: 15});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 1) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	chain.end();
	chain.addValues({a: 22});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 0) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain.end();
};


module.exports["chain ordered startAfter async test"] = function(beforeExit, assert) {
	var count = 0,
		chain = chainFactory.create();
	chain.addValues({a: 15});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 0) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	var promise = chain.end();
	chain.startAfter(promise);
	chain.addValues({a: 22});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 1) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain.end();
};


module.exports["chain ordered cycle option async test"] = function(beforeExit, assert) {
	var count = 0,
		chain = chainFactory.create({cycle: true});
	chain.addValues({a: 15});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 0) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	chain.end();
	chain.addValues({a: 22});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 1) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain.end();
};


module.exports["chain ordered cycle function async test"] = function(beforeExit, assert) {
	var count = 0,
		chain = chainFactory.create();
	chain.cycle(true);
	chain.addValues({a: 15});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 0) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	chain.end();
	chain.addValues({a: 22});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 1) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain.end();
};

module.exports["chain ordered cycle function reversal async test"] = function(beforeExit, assert) {
	var count = 0,
		chain = chainFactory.create({cycle: true});
	chain.cycle(true);
	chain.addValues({a: 15});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 1) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	chain.cycle(false);
	chain.end();
	chain.addValues({a: 22});
	chain.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 0) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain.end();
};



module.exports["chain connection async test"] = function(beforeExit, assert) {
	var count = 0,
		chain1 = chainFactory.create(),
		chain2 = chainFactory.create();
	chain1.addValues({a: 15});
	chain1.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 0) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});

	chain2.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 15 && count === 1) {
				assert.ok(true);
			} else {
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},1500);
		return deferred.promise;
	});
	chain1.attachPromise(chain2.end());

	chain1.addValues({a: 22});
	chain1.func(function(win, vals) {
		var deferred = new Deferred();
		setTimeout(function() {
			if (vals.a === 22 && count === 2) {
				assert.ok(true);
			} else { 
				assert.ok(false);
			}
			count++;
			deferred.resolve();
		},100);
		return deferred.promise;
	});
	chain1.end();
};
