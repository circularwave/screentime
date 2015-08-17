/*!
 * screentime.js | v0.3.3
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

      if (this.$elem !== null) {
        this.name = elem.name;
        this.top = this.$elem.getBoundingClientRect().top;
        this.height = this.$elem.offsetHeight;
        this.bottom = this.top + this.height;
        this.width = this.$elem.offsetWidth;
      }
    }

    function Viewport() {
      this.top = $window.pageYOffset;
      this.height = $window.innerHeight;
      this.bottom = this.top + this.height;
      this.width = $window.innerWidth;
    }

    function onScreen(viewport, field) {
      var cond, buffered, partialView;

      // Get new data on element
      field = new Field({selector:field.selector,name:field.name});

      if (field.height === 0 && field.width === 0) {
        return false;
      }

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
          console.log(val.name + ' counter hit');
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

    function stopTimerIfHidden(timer) {
      if (visibly.visibilityState() === 'hidden') {
        clearInterval(timer);
      }
    }

    function startTimers() {

      if (!started) {
        checkViewport();
        started = true;
      }

      looker = setInterval(function() {
        checkViewport();
        stopTimerIfHidden(looker);
      }, 1000);

      reporter = setInterval(function() {
        report();
        stopTimerIfHidden(reporter);
      }, options.reportInterval * 1000);

    }

    function stopTimers() {
      clearInterval(looker);
      clearInterval(reporter);
    }

    var reset = function() {
      stopTimers();

      for (var key in cache) {
        log[key] = 0;
        counter[key] = 0;
      }

      startTimers();
    };

    var start = function(newOptions) {
      options = angular.extend({}, defaults, newOptions);

      // Convert percent string to number
      options.percentOnScreen = parseInt(options.percentOnScreen.replace('%', ''), 10);

      if (options.fields.length <= 0) {
        stopTimers();
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

      if (visibly.visibilityState() === 'visible') {
        stopTimers();
        startTimers();
      }

      visibly.onHidden(function() {
        stopTimers();
      });

      visibly.onVisible(function() {
        stopTimers();
        startTimers();
      });
    };

    var stop = function(name) {
      // If no name was provided we assume stop everything
      if (typeof name === 'undefined') {
        stopTimers();
      } else {
        for (var i = 0; i < options.fields.length; i++) {
          if (options.fields[i].name === name) {
            delete cache[options.fields[i].name];
            delete counter[options.fields[i].name];
            delete log[options.fields[i].name];
            options.fields.splice(i, 1);
          }
        }

        if (options.fields.length == 0) {
          stopTimers();
        }
      }
    };

    return {
      start: start,
      reset: reset,
      stop: stop
    };

  });