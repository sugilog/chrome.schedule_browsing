// dample
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
      { day: 2, hour: 23, minute: 55 },
      { day: 2, hour: 23, minute: 56 },
      { day: 3, hour:  0, minute: 40 },
      { day: 4, hour:  0, minute: 40 },
    ]
  },
};

var _extend, _grep, _core, _event;

_extend = function() {
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

_grep = function( object, callback ) {
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

_core = {
  config: {
    time: function( config ) {
      var now = new Date();
      now.setHours( config.hour );
      now.setMinutes( config.minute );
      now.setSeconds( 0 );
      return now;
    },
    getAll: function( date ) {
      var uuid, schedule,
          sets = {},
          day = ( date || new Date() ).getDay(),
          now = Date.now();

      for ( uuid in settings ) {
        schedule = _grep(
          settings[ uuid ].schedules,
          function( _, set ) {
            return set.day === day && _core.config.time( set ).getTime() > now
          }
        )[ 0 ];

        if ( schedule ) {
          sets[ uuid ] = _core.config.time( schedule );
        }
      }

      return sets;
    }
  },
  util: function() {
    tomorrow: function() {
      var date = new Date();
      date.setDate( date.getDate() + 1 );
      return date;
    },
    setAlarm: function( callback ) {
      chrome.alarms.onAlarm.addListener( callback );
    },
    controller: function( alarm ) {
      if ( _core.name.isMine( alarm.name ) ) {
        var uuid = _core.name.parse( alarm.name );

        if ( uuid === 0 ) {
          // initForTomorrow callback
        }
        else {
          _event.fire( uuid );
        }
      }
    }
  },
  init: function() {
    _event.addAll();
    _core.util.setAlarm( _event.callback );
    _core.initForTomorrow();
  },
  initForTomorrow: function() {
    // time > 23:00
    _event.addAll( core.util.tomorrow() );
    // tomorrow 2300 alarm set

    // else
    // today 2300 alarm set
  },
  name: function( uuid ) {
    return [ _core.name.tag, uuid ].join( _core.name.separator );
  },
  count: function( count ) {
    _core.count.counter = ( _core.count.counter || 0 ) + count;

    // To hide badge; set empty string.
    chrome.browserAction.setBadgeText(
      { text: ( _core.count.counter === 0 ? "" : _core.count.counter.toString() ) }
    );
  },
};

_extend(
  _core.name,
  {
    rname: /^ScheduleBrowsing/,
    tag: "ScheduleBrowsing",
    separator: "#",
    parse: function( name ) {
      return Number( name.split( _core.name.separator )[ 1 ] );
    },
    isMine: function( name ) {
      return name && _core.name.rname.test( name );
    }
  }
);

_event = {
  addAll: function( date ) {
    var uuid,
        sets = _core.config.getAll( date );

    for ( uuid in sets ) {
      _event.add( uuid, sets[ uuid ] );
    }
  },
  addNext: function( uuid ) {
    var time = _core.config.getAll()[ uuid ];

    if ( time ) {
      _event.add( uuid, time );
    }
  },
  add: function( uuid, time ) {
    _core.count( 1 );

    chrome.alarms.create(
      _core.name( uuid ),
      {
        when: time.getTime()
      }
    )
  },
  fire: function( uuid ) {
    var setting = settings[ uuid ];
    _core.count( -1 );

    chrome.tabs.create({
      url:    setting.url,
      active: true
    });

    setTimeout( function() {
      _event.addNext( uuid );
    }, 1000 );
  },
};

_core.init();
