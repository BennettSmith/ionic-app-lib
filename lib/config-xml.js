var utils = require('./utils'),
    Q = require('q');

var ConfigXml = module.exports;

ConfigXml.setConfigXml = function setConfigXml(options) {
  // console.log('setConfigXml')
  var fs = require('fs');
  var path = require('path');
  var xml2js = require('xml2js');
  var d = Q.defer();

  // var self = this;
  var madeChange = false;

  try {
    var configXmlPath = path.resolve('config.xml');

    if(!fs.existsSync(configXmlPath)) {
      // working directory does not have the config.xml file
      if(options.errorWhenNotFound) {
        d.reject('Unable to locate config.xml file. Please ensure the working directory is at the root of the app where the config.xml should be located.');
      } else {
        d.resolve();
      }
      return d.promise;
    }

    var configString = fs.readFileSync(configXmlPath, { encoding: 'utf8' });

    var parseString = xml2js.parseString;
    parseString(configString, function (err, jsonConfig) {
      if(err) {
        d.reject(err);
        return utils.fail('Error parsing ' + configXmlPath + ': ' + err);
      }

      if(!jsonConfig.widget) {
        throw new Error('\nYour config.xml file is invalid. You must have a <widget> element.');
      } else if(jsonConfig.widget && !jsonConfig.widget.content) {
        throw new Error('\nYour config.xml file does not have a <content> element. \nAdd something like: <content src="index.html"/>');
      }

      if(options.devServer) {
        if( !jsonConfig.widget.content[0].$['original-src'] ) {
          jsonConfig.widget.content[0].$['original-src'] = jsonConfig.widget.content[0].$.src;
          madeChange = true;
        }
        if(jsonConfig.widget.content[0].$.src !== options.devServer) {
          jsonConfig.widget.content[0].$.src = options.devServer;
          madeChange = true;
        }

      } else if(options.resetContent) {

        if( jsonConfig.widget.content[0].$['original-src'] ) {
          jsonConfig.widget.content[0].$.src = jsonConfig.widget.content[0].$['original-src'];
          delete jsonConfig.widget.content[0].$['original-src'];
          madeChange = true;
        }
      }

      if(madeChange) {
        var xmlBuilder = new xml2js.Builder();
        configString = xmlBuilder.buildObject(jsonConfig);
        fs.writeFileSync(configXmlPath, configString);
      }

      d.resolve();
    });

  } catch(e) {
    d.reject(e);
    utils.fail('Error updating ' + configXmlPath + ': ' + e);
  }

  return d.promise;
}