var path = require( "path" ),
  rootPath = path.normalize( __dirname + "/.." ),
  env = process.env.NODE_ENV || "development";

var bunyan = require( "bunyan" );

var upload = {
  fileSizeLimit: 10 * 1024 * 1024, //Currently not workable
  uploadDir: path.normalize( rootPath + "/public/uploads" )
};

var config = {
  development: {
    root: rootPath,
    app: {
      name: "fileupload"
    },
    upload: upload,
    port: 3000
  },

  test: {
    root: rootPath,
    app: {
      name: "fileupload"
    },
    upload: upload,
    port: 3000
  },

  production: {
    root: rootPath,
    app: {
      name: "fileupload"
    },
    upload: upload,
    port: 3000
  }
};

global.logger = bunyan.createLogger( {
  name: config[ env ].app.name,
  streams: [ {
    level: "info",
    path: path.normalize( upload.uploadDir + "/fileupload.log" ),
    period: "1d",   // Daily rotation
    count: 7        // Keep 3 back copies
  } ]
} );

module.exports = config[ env ];
