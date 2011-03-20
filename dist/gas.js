/*!
 * GAS - Google Analytics on Steroids v0.1
 *
 * Copyright 2011, Direct Performance
 * Licensed under the MIT license.
 *
 * @author Eduardo Cereto <eduardo.cereto@directperformance.com.br>
 * @version $Revision$
 *
 * $Date$
 */


(function(window, undefined) {
    window._gas = window._gas || [];
    if (typeof _gas._functions === 'undefined') {
        _gas._functions = {};
    }

    function bind(obj, evt, fnc) {
        if (obj.addEventListener) {
            obj.addEventListener(evt, fnc, false);
            return true;
        } else if (obj.attachEvent) {
            return obj.attachEvent('on' + evt, fnc);
        }
        else {
            obj['on' + evt] = fnc;
        }
    }


    function track_form(form) {

        function tag_element(e) {
            console.log(arguments);
            var el = e.target;
            var el_name = el.name || el.id || el.type;
            var action_name = e.type;
            var form_name = form.name || form.id;

            form_name = form_name ? ' (' + form_name + ')' : '';

            _gas.push(['_trackEvent',
                'Form Tracking', //category
                'form' + form_name, //action
                el_name + ' (' + action_name + ')' //label
            ]);
        }

        var i, el;
        for (i in form.elements) {
            el = form.elements[i];
            if (['button', 'submit'].indexOf(el.type) >= 0) {
                //Button
                bind(el, 'click', tag_element);
            }
            else {
                //Text field
                bind(el, 'change', tag_element);
            }
        }
        bind(form, 'submit', tag_element);
    }

    _gas._functions._trackForms = function() {
        for (var i in document.forms) {
            track_form(document.forms[i]);
        }
    }
})(window);


/*!
 * GAS - Google Analytics on Steroids v0.1
 *
 * Copyright 2011, Direct Performance
 * Licensed under the MIT license.
 *
 * @author Eduardo Cereto <eduardo.cereto@directperformance.com.br>
 * @version $Revision$
 *
 * $Date$
 */


(function(window, undefined) {

var document = window.document;
window._gaq = window._gaq || [];

var _gas_pushed_functions = window._gas || [];

// Avoid duplicate definition
if (_gas_pushed_functions._accounts_length >= 0) {
    return;
}

//Shortcuts
var toString = Object.prototype.toString,
    hasOwn = Object.prototype.hasOwnProperty,
    push = Array.prototype.push,
    slice = Array.prototype.slice,
    trim = String.prototype.trim,
    indexOf = Array.prototype.indexOf,
    url = document.location.href;


var _gas = {
    _accounts: {},
    _accounts_length: 0,
    _hooks: {},
    _functions: _gas_pushed_functions._functions || {},
    _queue: _gas_pushed_functions
};

_gas._functions._addHook = function(fn, cb) {
    if (typeof fn === 'string' && typeof cb === 'function') {
        if (typeof this._hooks[fn] === 'undefined') {
            this._hooks[fn] = [];
        }
        this._hooks[fn].push(cb);
    }
};

// Watchout for circular calls
_gas._functions._trackException = function(exception, message) {
    _gas.push(['_trackEvent',
        'Exception ' + (exception.name || 'Error'),
        message || exception.message || exception,
        url
    ]);
}

_gas.push = function() {
    var args = slice.call(arguments),
        sub = args.shift(),
        i, foo, hooks, acct_name;

    if (typeof sub === 'function') {
        // Pushed functions are executed right away
        return _gaq.push(sub);

    }else if (typeof sub === 'object' && sub.length > 0) {
        foo = sub.shift();

        if (indexOf.call(foo, '.') >= 0) {
            acct_name = foo.split('.')[0];
            foo = foo.split('.')[1];
        }

        // Execute hooks
        hooks = this._hooks[foo];
        if (hooks && hooks.length > 0) {
            for (i = 0; i < hooks.length; i++) {
                try {
                    hooks[i].apply(null, sub);
                }catch (e) {
                    if (foo !== '_trackException') {
                        _gas.push(['_trackException', e]);
                    }
                }
            }
        }

        // Call internal GAS functions
        if (hasOwn.call(this._functions, foo)) {
            try {
                this._functions[foo].apply(this, sub);
            }catch (e) {
                if (foo !== '_trackException') {
                    _gas.push(['_trackException', e]);
                }
            }
        }
        // Intercept _setAccount calls
        if (foo.indexOf('_setAccount') >= 0) {
            acct_name = acct_name || String(this._accounts_length + 1);
            this._accounts[acct_name] = sub[0];
            this._accounts_length++;
            return _gaq.push([acct_name + '.' + foo, sub[0]]);
        }

        // Call Original _gaq, for all accounts
        var acc_foo;
        for (i in this._accounts) {
            if (hasOwn.call(this._accounts, i)) {
                acc_foo = i + '.' + foo;
                args = sub.slice();
                args.unshift(acc_foo);
                console.log('calling _gaq', args);
                _gaq.push(args);
            }
        }
    }
};

// Execute previous functions
while (_gas_pushed_functions.length > 0) {
    _gas.push(_gas_pushed_functions.shift());
}


window._gas = _gas;

// Import ga.js
(function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = (
            'https:' == document.location.protocol ?
                'https://ssl' :
                'http://www'
        ) +
            '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
})();

})(window);


