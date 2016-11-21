var express = require("express"),
cors = require("cors"),
formidable = require("formidable"),
util = require("util"),
path = require("path"),
fs = require("fs-extra"),
config = require("../../config/config"),
async = require("async"),
router = express.Router();

module.exports = function(app) {
    app.use("/upload", router);
};

var parseForm = function(req, res, next) {

    var formActions = {
        progress: function(bytesReceived, bytesExpected) {
            var percent_complete = (bytesReceived / bytesExpected) * 100;
            logger.info(percent_complete.toFixed(2));
        },
        file: function(name, file) {
            logger.info("onfile", name, file);
        },
        field: function(name, value) {
            logger.info("onfield", name, value);
        },
        end: function() {
            /* Temporary location of our uploaded file */
            logger.info(this);
            var temp_path = this.openedFiles[0].path;
            /* The file name of the uploaded file */
            var file_name = this.openedFiles[0].name;
            /* Location where we want to copy the uploaded file */
            var new_location = config.upload.uploadDir;
            logger.info("onend", temp_path, file_name);
        },
        error: function(err) {
            logger.error("Error:", err);
        }
    };

    return new Promise(function(resolve, reject) {

        var form = new formidable.IncomingForm();
        form.keepExtensions = true;
        form.hash = "md5";

        // form.on("progress", formActions.progress);
        // form.on("file", formActions.file);
        // form.on("field", formActions.field);
        // form.on("end", formActions.end);
        // form.on("error", formActions.error);

        form.parse(req, function(err, fields, files) {
              logger.info(err, util.inspect({
                fields: fields,
                files: files
              }));

            if (err || !Object.keys(files).length) {
                return reject(err);
            }

            var orig_name = files[Object.keys(files)[0]].name;
            var temp_path = files[Object.keys(files)[0]].path;
            // var temp_path = files["uploadFile"].path;
            var filename = fields["filename"] ? fields["filename"]
            : fields["keepFilename"] === "true" ?  orig_name.substring(0, orig_name.lastIndexOf(".")) + "_" + (Date.now() / 1000 | 0)  + orig_name.substring(orig_name.lastIndexOf("."))
            : path.basename(temp_path); //keep using the original name.
            var dest = path.join(config.upload.uploadDir, fields["folderPrefix"] || "", filename);

            resolve({
                fields: fields,
                files: files,
                filename: filename,
                temp_path: temp_path,
                dest: dest
            });
        });
    });
}

var copyFile = function(options) {
    return new Promise(function(resolve, reject) {
        fs.copy(options.temp_path, options.dest, function(err) {
            if (err) {
                reject(err);
            } else {
                options.valid = true;
                resolve(options);
            }
        });
    });
}

router.get("/*", cors(), function(req, res, next) {

    logger.info(req.params);
    var filename = req.params[0];
    var p = path.join(config.upload.uploadDir, filename);

    var options = {
        root: config.upload.uploadDir,
        dotfiles: 'deny',
        headers: {
            'Content-Disposition': 'inline; filename=' + filename
        }
    };

    res.sendFile(filename, options, function(err) {
        if (err) {
            next(err);
        } else {
            logger.info('Sent:', filename);
        }
    });
});

router.post("/", cors(), function(req, res, next) {

    var promise = parseForm(req, res, next);
    promise.then(form => {
        return copyFile(form);
    })
    .then(options => {
        res.status(200).json(options);
    })
    .catch(err => {
        next(err);
    });
});
