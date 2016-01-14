var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var geocoder = require('geocoder');

// Configuration
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs')

// Override (POST ?_method=DELETE)
app.use(methodOverride('_method'));

// DB setup
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoUrl = process.env.MONGOLAB_URI || "mongodb://localhost:27017/birds";
var db;
MongoClient.connect(mongoUrl, function(err, database){
  if (err) {
    console.log(err);
  }
  console.log("connected!");
  db = database;
  process.on('exit', db.close);
})

// custom middleware to log req body, params and query
app.use(function(req, res, next){
  console.log("body:", req.body, "params:", req.params, "query:", req.query);
  next();
});

// Routes
app.get('/', function(req, res){
  db.collection('sightings').find({}).sort({date:-1}).limit(3).toArray(function(err, results){
    res.render('index', {sightings: results});
  })
});

app.get('/demo', function(req, res){
  db.collection('sightings').find({}).toArray(function(err, results){
    res.json(results);
  })
});

app.get('/sightings/new', function(req, res){
  res.render('form');
});

app.get('/sighting/:id/edit', function(req, res){
  db.collection('sightings').findOne(
    {_id: ObjectId(req.params.id)},
    function(err, result){
      res.render('edit', {sighting: result});
    }
  )
});

app.post('/sightings', function(req, res){

  geocoder.geocode(req.body.sighting.location, function ( err, data ) {
    var lati = data.results[0].geometry.location.lat;
    var longi = data.results[0].geometry.location.lng;
    db.collection('sightings').insert(
      {sighting: req.body.sighting.sighting,
      location: req.body.sighting.location,
      latitude: lati,
      longitude: longi,
      date: Date()},
      function(err, result){
        res.redirect('/');
      }
    )
   });
});

app.patch('/sightings/:id', function(req, res){
  geocoder.geocode(req.body.sighting.location, function ( err, data ) {
    var lati = data.results[0].geometry.location.lat;
    var longi = data.results[0].geometry.location.lng;
    db.collection('sightings').update(
      {_id: ObjectId(req.params.id)},
      {$set: { sighting: req.body.sighting.sighting, 
        location: req.body.sighting.location,
        latitude: lati,
        longitude: longi }},
      function(err, result){
        res.redirect('/');
      }
    )
  });
});

app.get('/api/sightings', function(req, res){
  db.collection('sightings').find({}).toArray(function(err, results){
    res.json(results);
  })
});

app.listen(process.env.PORT || 3000);
