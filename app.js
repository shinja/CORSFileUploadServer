var express = require( "express" ),
  config = require( "./config/config" );

var app = express();

require( "./config/express" )( app, config );

app.listen( config.port, function() {
  logger.info( "Express server listening on port " + config.port );
} );
