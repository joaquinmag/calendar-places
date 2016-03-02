var Bluebird = require('bluebird');
var Request = Bluebird.promisifyAll(require('request'));
var moment = require('moment');
var _ = require('lodash');

var DATE_FORMAT = 'MMMM D, YYYY [at] hh:mmA';
var GEOLOCATION_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json?';
var CARTODB_API_URL = '.cartodb.com/api/v2/sql?';
var SPATIAL_PROJECTION = 4326; // Not the same Mercator projection from Google, but works with CartoDb.


module.exports = function (ctx, done) {
  var err;

  if (!ctx.data) {
      err = new Error('Unexpected error: Missing data.');
      return done(err);
  }

  if (!ctx.data.title) {
    err = new Error('Unexpected error: Missing title.');
    return done(err);
  }

  if (!ctx.data.where) {
      err = new Error('Unexpected error: Missing where information.');
      return done(err);
  }

  if (!ctx.data.starts) {
      err = new Error('Unexpected error: Missing starts information.');
      return done(err);
  }

  if (!ctx.data.ends) {
      err = new Error('Unexpected error: Missing ends information.');
      return done(err);
  }

  var title = ctx.data.title;
  var where = ctx.data.where;
  var starts = parseDateToMoment(ctx.data.starts);
  var ends = parseDateToMoment(ctx.data.ends);
  var geolocation = requestGeolocation(where, ctx.data.GMAPS_API_KEY);

  Bluebird.join(title, starts, ends, geolocation, savePoint)
  .then(function() {
    done(null, 'Success!');
  })
  .catch(function(err) {
    console.log(err);
    done(err);
  });

  function savePoint(title, starts, ends, geo) {

    var insertSQL = 'INSERT INTO calendar_places (event, starts, ends, the_geom) VALUES (\''
                    + title + '\',\''
                    + starts.format() + '\',\''
                    + ends.format() + '\','
                    + 'ST_SetSRID(ST_Point(' + geo.lng + ',' + geo.lat + '), ' + SPATIAL_PROJECTION + '))';
    var url = 'https://' + ctx.data.CARTODB_ACCOUNT + CARTODB_API_URL + 'q=' + encodeURIComponent(insertSQL) + '&api_key=' + ctx.data.CARTODB_API_KEY;

    return Request.getAsync(url)
    .get(1) // I only want the body response
    .then(JSON.parse)
    .then(function(data) {
      if (data.error) {
        return Bluebird.reject('Error at cartoDB call: ' + data.error);
      } else {
        return Bluebird.resolve('Calendar place saved.');
      }
    });
  }

  function requestGeolocation(where, api_key) {
    var url = GEOLOCATION_API_URL + 'address=' + encodeURIComponent(where) + '&key=' + api_key;

    return Request.getAsync(url)
    .get(1) // I only want the body response
    .then(JSON.parse)
    .then(function(data) {
      if (data.status == "OK") {
        return Bluebird.resolve(data.results[0].geometry.location); // I select the first option
      } else {
        return Bluebird.reject(data.status);
      }
    });
  }

  function parseDateToMoment(date) {
    return new Promise(function(resolve, reject) {
      var momentDate = moment(date, DATE_FORMAT);
      if (momentDate.isValid()) {
        resolve(momentDate);
      } else {
        reject('Unexpected date format: ' + date);
      }
    });
  }
};
