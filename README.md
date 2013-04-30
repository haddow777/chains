Chains Node Library
===================

This library is a node module that provides a robust mechanism for chaining asynchronous function calls into an ordered promise based chain. It easily handles multiple chains and chain reuse without conflict between chains. 

One of the most amazing aspects about this library is its ability to tie chains together, thereby giving the programmer the ultimate in control over the execution of their program. 

As an example, lets say you create 3 chain objects. It's as easy as this:

	var chainFactory = require('chains'),
	    chain1 = chainFactory.create(),
	    chain2 = chainFactory.create(),
	    chain3 = chainFactory.create();

Now, each chain can have functions attached to them quite simply through the func() function.

	chain1.func( function() { console.log('First function of chain1 fired'); });

Additional functions can be added to each of the chains in the same way. Now, the chain will quite simply begin execution of the function as soon as it is entered, so this example isn't too usefull to us. If you would like to experiment with the library, the easiest way is to use setTimeout, as you can control it's execution. (*NOTE*: for the moment, as the library is quite young, it is tied to the medikoo/deferred node library for its promises. I would suggest also using that library as using another is untested at the moment)

	var Deffered = require('deffered');
	
	chain1.func(function() {
		var deferred = new Deferred();
		setTimeout(function() {
			console.log('First Run');
			deferred.resolve();
		}, 1500);
		return deferred.promise;
	});

You can add a series of these functions with various timeouts to each chain to see how each chain executes them. You will notice that within each chain, each function added will execute in the order added. Between the chains though, the functions will execute in parallel. This is great and all, but there is more. What if you want each chain to execute in parallel up to a point, but the code running in chain3 needs to stop half way and wait for the code in chain2 to fully execute before continuing? Well the chains library can handle that as well. Lets say that you have added 5 functions to each of those chains. Chain2 is only going to have those 5 functions and stop. At the end of a chain, we tell it so by calling its end() function like so: 

	var promise = chain2.end();

Notice, that when an end() function is called without a parameter, it returns a promise that will be resolved only after the chain has successfully and fully executed. Now this promise can be attached to another chain like so:

	chain3.attachPromise(promise);

After doing this, you can continue adding functions to chain3. Any functions added after this point will not be run until after chain2 has fully executed though.

Also note, that once chain2 has had its end() function called, you can begin adding functions to it again. These functions will never interfere with the chain that you just ended or with any chains that it was attached to. Even though you are using the same chain object, you are actually creating a whole new chain.

I would like to point out some added abilities at this point as well. First of all, you can pass a function through the end() function, which will be called just before the end() of the promise chain. It should be noted though, that whatever this functions returns will be the return value of the end() function. So, if you don't return a promise that is fullfilled at the end of the promise chain, it will be impossible to attach this chain to another.

Also, there is a convenience method supplied to automatically link multiple chains created using the same chain object. Here's how this works:

	var options = {
		cycle: true
	};
	
	var chain1 = chainFactory.create(options);
	
	chain1.func(...);
	chain1.func(...);
	chain1.end();
	chain1.func(...);
	chain1.func(...);
	chain1.end();

Notice that an option of cycle = true is passed in an object through the create. This will tell the chain object to link all chains it creates together. So here we have a number of functions added to a chain and then the end() function is called. Normally any functions added afterwards would execute in parallel to the first set. In this case though, they will wait until the first chain finishes executing to run. You should note that currently, a chain that cycles prevents a promise from being returned from the end() function, so this type of chain can't be linked to another for right now.

So why do this? Well, *remember that the chain will contain any errors thrown*. So this way, you can group chains by the type of functionality you are running and periodically let any errors out and then move onto the next group of functionality you want linked without having to constantly make new chain objects.

There is of course a function given to override this at any point as well.

	chain1.cycle(true);
	chain1.func(...);
	chain1.func(...);
	chain1.func(...);
	chain1.end(); //returns nothing
	chain1.func(...);//waits until the previous functions have all finished
	chain1.func(...);
	chain1.func(...);
	chain1.cycle(false);
	var promise = chain1.end();
	chain1.func(...);//will not wait and will begin executing in parallel
	
	chain2.attachPromise(promise);
	chain2.func(...);//will wait until the end of chain1 at the point this promise was returned

It should also be noted, at least at this point in the libraries development, due to the fact that the library currently uses medikoo/deferred library to handle the promises, any errors thrown in the chain will be contained by the chain until the end() function is called. As I am new to nodes deferred libraries, I'm not sure if this a common trait to each of them, but for the moment, it is a trait inherited by this library. To help with this, the func() funciton does provide an error function callback that can be added.

	chain1.func(function(wins) { 
		//wins is a value returned by the previous function in the chain
	},
	function(fail) {
		//fail is whatever is passed to the reject() function of the previous
		//promise
	});
	
Well, this is good and all, but what if you have functions that return values that you want passed on to the next function? Well as just 	mentioned, you can do this:
	
	chain1.func(function() { return true });
	chain1.func(function(wins) { 
		if (wins) {
			console.log('The first function returned true');
		}
	});

What if you have a function that does something that takes a while and so returns a promise? Well, in reality, the chains library is built specifically for that purpose. All you need to do is return that promise in the function and the chain will automatically attach it to the chain. So in effect, the chain will hold up execution of the following functions until your process has finished and resolved its promise.

	chain1.func(function() {
		var promise = lengthyFunction();
		return promise;
	});
	chain1.func( function() {
		console.log('This won't fire until lengthyFunction() resolves');
	});

Okay, this is good and all, but how can I get values to pass from one function i the chain to other values in the chain that just the next one? Simple, you can attach an object with almost any value you like with addValues like so:

	var obj = {
		value1: true,
		value2: 'value',
		value3: { id: 1, big: 'small'}
	};
	
	chain1.addValues(obj);

Then from that point on you can access these values like this:

	chain1.func( function(wins, vals) {
		console.log('Big = ' + vals.value3.big);
	});

This is good and all for normal execution functions and deferral functions that already return promises, but
what about a deferral function that returns through a callback function. Of course, one method is to use
the Deferred's inbuilt promisify functionality to promisify the library. If for some reason, you can't do that
though, the chains library also provides a method for handling this situation. It is pretty young and might 
change in the future, but for the moment here is the pattern you can follow:

	chain1.addValues({value1: value1, value2: value2});

	chain1.promisify(function(handler, vals) {
		functionThatDefers(vals.value1, vals.value2, handler);
	});

Simple huh? Well sort of, this is actually the first step. You might have a question or two, such as, where
does the handler come from and where to the values returned by the function go? I thought I would quickly
explain that before moving onto the second step. First, handler is a function passed through the anonymous
function by the chains object itself. The nice thing about this is that the chains object doesn't try to
guess where your callback function is placed, you specifically put it in the right position. The values 
returned to the handler callback are then stored in the vals object in the form of the arguments array. Lets
for the examples sake say that he callback returned the values error and value. You can handle it this way:

	chain1.func(function(wins, vals) {
		var error = vals.arguments[0],
			value = vals.arguments[1];
	});

As a convenience method, you can also do this:

	chain1.addValues({value1: value1, value2: value2});

	chain1.promisify(function(handler, vals) {
		functionThatDefers(vals.value1, vals.value2, handler);
	}, 
	function(wins, vals) {
		var error = vals.arguments[0],
			value = vals.arguments[1];
	});

Pretty cool huh? Okay, but what if you have a large number of repetitive function calls to make that would normally be handled in a loop. This won't work:

	var arrayVals = [0, 1, 2..99] //100 values
	chain1.addValues({arrayVals: arrayVals});
	
	for (var i = 0; i < arrayVals.length; i++) {
		chain1.func( function(wins, vals) {
			var promise = lengthyFunction(vals.arrayVals[i]);
			return promise;
		});
	}

When building the chain, by its very nature, the building of the chain will race ahead of the execution of the chain. This means that the counter value 'i' will be out of sync with functions being executed in the promise chain. Don't worry though, the chains library has a way of dealing with this. There are a number of loop specific functions to promisify loop characteristics. Here's an example:

	var arrayVals = [0, 1, 2..99] //100 values
	chain1.addValues({arrayVals: arrayVals});
	
	chain1.startLoop(); //by default, the loop will start at 0 and count by 1
	
	for (var i = 0; i < arrayVals.length; i++) {
		chain1.func( function(wins, vals) {
			var count = vals.count;
			var promise = lengthyFunction(vals.arrayVals[count]);
			return promise;
		}
		chain1.next();
	}
	chain1.endLoop();

A counter variable is automatically maintained and passed in with the vals parameter along with your custom values. Make note of this as you wouldn't want to conflict with this value by using the 'count' value yourself. In fact, there is also a vals.chain value automatically set, which is a reference to the chain object itself.

Two more things about the loop functions. The startLoop function can take two parameters:

	chain1.startLoop(startValue, interval);

The start value is the initial value of the counter. The interval is how much the counter is changed each time next() is called. So if you wanted, you could do this:

	chain1.startLoop((arrayVals.length - 1), -1);

In this scenario, the counter would start at 99 and count down to 0;

The second thing is the endLoop() function. It is there to close the promisified loop without disturbing the rest of the chain. This way, you could include several separate loops in the same chain. This is of course for your convenience. If you need a more complicated looping system, such as nested loops, you could either maintain the counters yourself through the vals parameter object or even by linking multiple chains together.

Getting back to the endLoop() function. If the loop is the last thing you are doing in the chain, you can also simply just call the end() function without calling endLoop(). The chain will handle that fine.

*Sold yet? Wait! There is more.* What if you could customise the chain with functions specific to something you would like to do? Wouldn't it be easier to have functions attached to the chain that you could pass values to rather than having to pass functions to? Well, the chains library handles that as well. You can inherit the chains library into your module, create your own functions, and graft them onto the chain. Here's an example how:

	var chainFactory = require('chains');
	
	var customFunctions = {
		function1: function(val, handler, err) {
			var self = this, vals = this.values;
			var error_handler;
			if (typeof err === 'function'){
				error_handler = err;
			} 
			else {
				error_handler = function(fail) {
					console.log(fail);
				}
			}
			if (this.promise === undefined) {
				this.promise = lengthyFunction(val);
				this.promise = this.promise.then(function(win) { return win; }, error_handler);
			} 
			else {
				this.promise = this.promise.then(function() {
					return lengthyFunction(val);
				}, error_handler);
			}
			if (typeof handler === 'function') {
				this.promise = this.promise.then(function(win, vals) { 
					handler(win, vals);
				}, function(fail) { console.log('function1 failed: ', fail );});
			}
		},
		function2: function(...) {...},
		function3: function(...) {...}
	};
	
	var customFunctionsFactory = {
		create: function (options) {
			//an options object needs to be passed to the chains object
			if (options === undefined) {
				options = {};
			}
			if (options.mixins === undefined) {
				options.mixins = customFunctions;
			} else {
				//this allows other libraries to inherit yours and customize the chain through yours
				for (property in customFunctions) {
					options.mixins[property] = customFunctions[property];
				}
			}
			return chainFactory.create(options);
		}
	}
	
	module.exports = customFunctionsFactory;


## License 

(The MIT License)

Copyright (c) 2013 Jordan Haddow &lt;haddow777 at gmail dot com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
