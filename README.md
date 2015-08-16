Screentime
==========

[Screentime] is a small tool that helps you start thinking of your website traffic in terms of time instead of hits (Pageviews, visits, etc). You can define areas of the page, called Fields, and then Screentime will keep track of how much time each Field is on screen for. You can also use it to track smaller elements, like ad units.

Screentime only handles the client side work. You'll need to provide your own backend to post the data to.

## How it works
You specify some DOM elements that you want to track and then every second Screentime checks the viewport to see which ones are in view. It tracks the viewable seconds for each element/field and then issues a report every 2 seconds (you can adjust the interval). The report is passed to a callback function that you can use to post the data to your server.

If the user switches tabs, the timer stops (using Addy Osmani's [Page Visibility polyfill](https://github.com/addyosmani/visibly.js)). The timer doesn't require that the user be active, just that the screen elements are visible.

## Usage
jQuery is NOT required in this version. Pass in the selector for each **unique element** you want to track, including a name for each. The callback option receives an object containing the data.

Make sure you import the screentime module into your AngularJS module. Also make sure you pull the '$screentime' factory into your controller too.

```javascript
var app = angular.module('exampleApp', ['screentime']);

app.controller('MainCtrl', function($screentime, $scope, $timeout) {

}
```

From here you can simply call $starttime.start.

```javascript
$screentime.start({

  fields: [
    { selector: '#top',
      name: 'Top'
    },
    { selector: '#middle',
      name: 'Middle'
    },
    { selector: '#bottom',
      name: 'Bottom'
    },
    // Fields defined but not on page should be ignored
    { selector: '#missing-elem',
      name: 'Not on page'
    }
  ],

  // This is the interval in which the callback methods
  // below gets called.
  // Data is recorded every second but the callback is called
  // on the interval you specify.
  reportInterval: 1,

  callback: function(data, log) {

    console.log(data);

    // log format will be based on fields you placed inside
    // $screentime.start. So this will be something like
    // { Top: 0, Middle: 0, Bottom: 0 }
    console.log(log);

    // Not required: In this example we're binding
    // this to local scope for testing/displaying
    // in UI.
    $timeout(function() {
      $scope.times = log;
    });

  }
});
```

## Installation

Via [bower][]:

	$ bower install screentime

## Options
#### `fields` array (required)
An array of object listing the DOM elements you want to track. Each object should specify the `selector` property and a `name` property.

#### `reportInterval` number
The interval, in seconds, used to issue a report. The default is 2 seconds.

#### `percentOnScreen` string
This determines what percentage of the field must be on screen for it to be considered in view. The default is `50%`. One exception to this rule: if a field occupies the majority of the viewport it will be considered in view regardless of its viewable percentage.

#### `callback` function
The callback function that receives the screentime data.

## Methods
#### `reset`
Calling `$screentime.reset()` will reset the counter.
