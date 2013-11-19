// sample
var settings = {
  12345: {
    url: "http://google.com",
    title: "Google",
    description: "",
    schedules: [
      { day: 1, hour:  0, minute: 45 },
      { day: 2, hour: 13, minute: 31 },
    ]
  },
  45678: {
    url: "http://jquery.com",
    title: "jQuery",
    description: "jQuery write less, do more.",
    schedules: [
      { day: 1, hour: 23, minute: 45 },
      { day: 1, hour:  0, minute: 40 },
      { day: 2, hour: 23, minute:  8 },
      { day: 3, hour:  0, minute: 40 },
      { day: 4, hour:  0, minute: 40 },
    ]
  },
};

var extend = function() {
  var source, key,
      i = 1,
      l = arguments.length,
      base = arguments[ 0 ];

  for ( ; i < l; i++ ) {
    source = arguments[ i ];

    for ( key in source ) {
      if ( source[ key ] ) {
        base[ key ] = source[ key ];
      }
    }
  }

  return base;
};

var grep = function( object, callback ) {
  var i, result,
      isArray = (function( _object ){
        var type = ({}).toString.call( _object );
        return type =~ /Array/;
      })( object );

  result = ( isArray ? [] : {} );

  if ( isArray ) {
    for ( i = 0; i < object.length; i++ ) {
      if ( callback( i, object[ i ] ) ) {
        result.push( object[ i ] );
      }
    }
  }
  else {
    for ( i in object ) {
      if ( callback( i, object[ i ] ) ) {
        result[ i ] = object[ i ];
      }
    }
  }

  return result;
};

var core = {
  counter: 0,
  count: function( count ) {
    core.counter = core.counter + count;
    chrome.browserAction.setBadgeText( { text: core.counter.toString() } );
  },
  config: {
    time: function( config ) {
      var now = new Date();
      now.setHours( config.hour );
      now.setMinutes( config.minute );
      now.setSeconds( 0 );
      return now;
    },
    getAll: function() {
      var uuid, schedule,
          sets = {},
          day = new Date().getDay(),
          now = Date.now();

      for ( uuid in settings ) {
        schedule = grep(
          settings[ uuid ].schedules,
          function( _, set ) {
            return set.day === day && core.config.time( set ).getTime() > now
          }
        )[0];

        if ( schedule ) {
          sets[ uuid ] = core.config.time( schedule );
        }
      }

      return sets;
    }
  },
  name: function( uuid ) {
    return [ core.name.tag, uuid ].join( core.name.separator );
  },
};

extend(
  core.name,
  {
    rname: /^ScheduleBrowsing/,
    tag: "ScheduleBrowsing",
    separator: "#",
    parse: function( name ) {
      return Number( name.split( core.name.separator )[ 1 ] );
    },
    isMine: function( name ) {
      return name && core.name.rname.test( name );
    }
  }
);

var event = {
  addAll: function() {
    var uuid,
        sets = core.config.getAll();

    for ( uuid in sets ) {
      event.add( uuid, sets[ uuid ] );
    }
  },
  add: function( uuid, time ) {
    core.count( 1 );

    chrome.alarms.create(
      core.name( uuid ),
      {
        when: time.getTime()
      }
    )
  },
  callback: function( alarm ) {
    if ( core.name.isMine( alarm.name ) ) {
      core.count( -1 );

      var set,
          uuid = core.name.parse( alarm.name );

      set = settings[ uuid ];

      chrome.tabs.create({
        url:    set.url,
        active: true
      });
    }
  },
  set: function() {
    chrome.alarms.onAlarm.addListener( event.callback );
  },
};

event.addAll();
event.set();

