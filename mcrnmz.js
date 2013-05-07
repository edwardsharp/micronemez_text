var createServer = require("http").createServer;
var readFile = require("fs").readFile;
var sys = require("sys");
var url = require("url");
DEBUG = false;

var mcrnmz = exports;

var NOT_FOUND = "Not Found\n";

function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain"
                     , "Content-Length": NOT_FOUND.length
                     });
  res.end(NOT_FOUND);
}

var getMap = {};

mcrnmz.get = function (path, handler) {
  getMap[path] = handler;
};
var server = createServer(function (req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    var handler = getMap[url.parse(req.url).pathname] || notFound;

    res.simpleText = function (code, body) {
      res.writeHead(code, { "Content-Type": "text/plain"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    res.simpleJSON = function (code, obj) {
      var body = new Buffer(JSON.stringify(obj));
      res.writeHead(code, { "Content-Type": "text/json"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    handler(req, res);
  }
});

mcrnmz.listen = function (port, host) {
  server.listen(port, host);
  sys.puts("Server at http://" + (host || "127.0.0.1") + ":" + port.toString() + "/");
};

mcrnmz.close = function () { server.close(); };

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

mcrnmz.staticHandler = function (filename) {
  var body, headers;
  var content_type = mcrnmz.mime.lookupExtension(extname(filename));

  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }

    sys.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        sys.puts("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        sys.puts("static file " + filename + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  }
};

mcrnmz.mime = {
  // returns MIME type for extension, or fallback, or octet-steam
  lookupExtension : function(ext, fallback) {
    return mcrnmz.mime.TYPES[ext.toLowerCase()] || fallback || 'application/octet-stream';
  },

  // List of most common mime-types, stolen from Rack and jack-, thx d00dz
  TYPES : { ".css"   : "text/css"
          , ".csv"   : "text/csv"
          , ".gif"   : "image/gif"
          , ".gz"    : "application/x-gzip"
          
          , ".htm"   : "text/html"
          , ".html"  : "text/html"
          , ".ico"   : "image/vnd.microsoft.icon"
          , ".jpeg"  : "image/jpeg"
          , ".jpg"   : "image/jpeg"
          , ".js"    : "application/javascript"
          , ".json"  : "application/json"
          , ".log"   : "text/plain"
          , ".m3u"   : "audio/x-mpegurl"
          , ".m4v"   : "video/mp4"
          , ".mov"   : "video/quicktime"
          , ".mp3"   : "audio/mpeg"
          , ".mp4"   : "video/mp4"
          , ".mp4v"  : "video/mp4"
          , ".mpeg"  : "video/mpeg"
          , ".mpg"   : "video/mpeg"
          , ".ogg"   : "application/ogg"
          , ".png"   : "image/png"
          , ".svg"   : "image/svg+xml"
          , ".svgz"  : "image/svg+xml"
          , ".tar"   : "application/x-tar"
          , ".tbz"   : "application/x-bzip-compressed-tar"
          , ".txt"   : "text/plain"
          , ".wav"   : "audio/x-wav"
          , ".wma"   : "audio/x-ms-wma"
          , ".wmv"   : "video/x-ms-wmv"
          , ".xhtml"   : "application/xhtml+xml"
          , ".xml"   : "application/xml"
          , ".xsl"   : "application/xml"
          , ".xslt"  : "application/xslt+xml"
          , ".zip"   : "application/zip"
          }
};
