/*!
 * visibly - v0.6 Aug 2011 - Page Visibility API Polyfill
 * http://github.com/addyosmani
 * Copyright (c) 2011 Addy Osmani
 * Dual licensed under the MIT and GPL licenses.
 *
 * Methods supported:
 * visibly.onVisible(callback)
 * visibly.onHidden(callback)
 * visibly.hidden()
 * visibly.visibilityState()
 * visibly.visibilitychange(callback(state));
 */

(function(){window.visibly={q:document,p:undefined,prefixes:["webkit","ms","o","moz","khtml"],props:["VisibilityState","visibilitychange","Hidden"],m:["focus","blur"],visibleCallbacks:[],hiddenCallbacks:[],genericCallbacks:[],_callbacks:[],cachedPrefix:"",fn:null,onVisible:function(i){if(typeof i=="function"){this.visibleCallbacks.push(i)}},onHidden:function(i){if(typeof i=="function"){this.hiddenCallbacks.push(i)}},getPrefix:function(){if(!this.cachedPrefix){for(var i=0;b=this.prefixes[i++];){if(b+this.props[2]in this.q){this.cachedPrefix=b;return this.cachedPrefix}}}},visibilityState:function(){return this._getProp(0)},hidden:function(){return this._getProp(2)},visibilitychange:function(i){if(typeof i=="function"){this.genericCallbacks.push(i)}var t=this.genericCallbacks.length;if(t){if(this.cachedPrefix){while(t--){this.genericCallbacks[t].call(this,this.visibilityState())}}else{while(t--){this.genericCallbacks[t].call(this,arguments[0])}}}},isSupported:function(i){return this.cachedPrefix+this.props[2]in this.q},_getProp:function(i){return this.q[this.cachedPrefix+this.props[i]]},_execute:function(i){if(i){this._callbacks=i==1?this.visibleCallbacks:this.hiddenCallbacks;var t=this._callbacks.length;while(t--){this._callbacks[t]()}}},_visible:function(){window.visibly._execute(1);window.visibly.visibilitychange.call(window.visibly,"visible")},_hidden:function(){window.visibly._execute(2);window.visibly.visibilitychange.call(window.visibly,"hidden")},_nativeSwitch:function(){this[this._getProp(2)?"_hidden":"_visible"]()},_listen:function(){try{if(!this.isSupported()){if(this.q.addEventListener){window.addEventListener(this.m[0],this._visible,1);window.addEventListener(this.m[1],this._hidden,1)}else{if(this.q.attachEvent){this.q.attachEvent("onfocusin",this._visible);this.q.attachEvent("onfocusout",this._hidden)}}}else{this.q.addEventListener(this.cachedPrefix+this.props[1],function(){window.visibly._nativeSwitch.apply(window.visibly,arguments)},1)}}catch(i){}},init:function(){this.getPrefix();this._listen()}};this.visibly.init()})();

/*!
 * Screentime.js | v0.2
 * Copyright (c) 2015 Rob Flaherty (@robflaherty)
 * Licensed under the MIT and GPL licenses.
 */

angular.module('screentime', []);

angular.module('screentime')

.factory('$screentime',

  function($window) {

    var defaults = {
      fields: [],
      percentOnScreen: '50%',
      reportInterval: 1,
      callback: function(){}
    };

    var counter = {};
    var cache = {};
    var log = {};
    var looker = null;
    var started = false;
    var options = defaults;
    var reporter = null;

    /*
     * Constructors
     */

    function Field(elem) {
      this.selector = elem.selector;
      this.$elem = document.body.querySelector(elem.selector);
      this.name = elem.name;
      this.top = this.$elem.getBoundingClientRect().top;
      this.height = this.$elem.offsetHeight;
      this.bottom = this.top + this.height;
      this.width = this.$elem.offsetWidth;
    }

    function Viewport() {
      this.top = $window.pageYOffset;
      this.height = $window.innerHeight;
      this.bottom = this.top + this.height;
      this.width = $window.innerWidth;
    }

    function onScreen(viewport, field) {
      var cond, buffered, partialView;

      // Field entirely within viewport
      if ((field.bottom <= viewport.bottom) && (field.top >= viewport.top)) {
        return true;
      }

      // Field bigger than viewport
      if (field.height > viewport.height) {

        cond = (viewport.bottom - field.top) > (viewport.height / 2) && (field.bottom - viewport.top) > (viewport.height / 2);

        if (cond) {
          return true;
        }

      }

      // Partially in view
      buffered = (field.height * (options.percentOnScreen/100));
      partialView = ((viewport.bottom - buffered) >= field.top && (field.bottom - buffered) > viewport.top);

      return partialView;
    }

    function checkViewport() {
      var viewport = new Viewport();

      for (var key in cache) {
        var val = cache[key];
        if (onScreen(viewport, val)) {
          log[key] += 1;
          counter[key] += 1;
        }
      };
    }

    function report() {
      var data = {};

      for (var key in counter) {
        var val = counter[key];
        if (val > 0) {
          data[key] = val;
          counter[key] = 0;
        }
      };

      if (Object.keys(data).length > 0) {
        options.callback.call(this, data, log);
      }
    }

    function startTimers() {

      if (!started) {
        checkViewport();
        started = true;
      }

      looker = setInterval(function() {
        checkViewport();
      }, 1000);

      reporter = setInterval(function() {
        report();
      }, options.reportInterval * 1000);

    }

    function stopTimers() {
      clearInterval(looker);
      clearInterval(reporter);
    }

    var reset = function() {
      stopTimers();

      cache.forEach(function(val, key) {
        log[key] = 0;
        counter[key] = 0;
      });

      startTimers();
    };

    var start = function(newOptions) {

      options = angular.extend({}, defaults, newOptions);

      // Convert percent string to number
      options.percentOnScreen = parseInt(options.percentOnScreen.replace('%', ''), 10);

      if (!options.fields.length) {
        return;
      }

      options.fields.forEach(function(fieldOption) {
        if (document.body.querySelector(fieldOption.selector) !== null) {
          var field = new Field(fieldOption);
          cache[field.name] = field;
          counter[field.name] = 0;
          log[field.name] = 0;
        }
      });

      startTimers();

      visibly.onHidden(function() {
        stopTimers();
      });

      visibly.onVisible(function() {
        stopTimers();
        startTimers();
      });
    };

    return {
      start: start,
      reset: reset
    };

  });