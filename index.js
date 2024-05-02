require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const dns = require('dns');
const mongoose = require('mongoose');

// Connect to mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Create a schema
const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }}, { timestamps: true })


// Create a model
let URL = mongoose.model('URL', urlSchema);



// Create and save URL
const createAndSaveURL = (url, shorturl, done) => {
  let newURL = new URL({original_url: url, short_url: shorturl})

   newURL.save(function(err, data) {
    if (err) return console.error(err);
    done(null, data)
  })

  return true;
}

// Find URL by full address
const findURLByName = function(url, done ){
  URL.findOne({original_url: url}, function(err, data) {
    if (err) return console.error(err);
    done(null, data);
  })
};

// Find URL by short address
const findShort = function(shorturl, done) {
  URL.findOne({short_url: shorturl}, function(err, data) {
    if (err) return console.error(err);
    done(null, data);
  })
}

// Find last added short
const findLastShort = function(done) {
  URL.findOne().sort({ createdAt: -1 }).exec((err, data) => {
    if (err) console.error('Error:', err);
    done(null, data)
  })
}



// Generate new short_url
const generateShortUrlAndSave = function(url, res) {
  // Generate new number
  let newShortUrl;

  findLastShort((err, data) => {
    if (err) console.error("Error: ", err);
    if (!data || data.length === 0) {
      newShortUrl = 1;
    } else {
      // If existed, add one to short url number !
      newShortUrl = data.short_url + 1;
    }

    // Create and save new URL
    createAndSaveURL(url, newShortUrl, (err, data) => {
      if (err) console.error("Error: ", err);
      res.json({ original_url: data.original_url, short_url: data.short_url })
    })
  })


}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Body parser to read html file
app.use(bodyParser.urlencoded({ extended: false }));

// Post 
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url;

  const regex = /^(https?:\/\/)(www.)?\w+\.\w+/i;

  const check = regex.test(url);

  if (!check) {
    res.json({error: 'invalid url'})
  } else {
    findURLByName(url, (err, data) => {
      if (err) console.error("Error", err);
      if (!data || data.length === 0) {
        // If not found in database, create new and return json
        generateShortUrlAndSave(url, res);
      } else {
        // If found in database, return json with data
        res.json({ original_url: data.original_url, short_url: parseInt(data.short_url)})
      }
    });

  } 


});

// Get
app.get('/api/shorturl/:shorturl?', function(req, res) {
  const shortUrl = req.params.shorturl;


  findShort(shortUrl, (err, data) => {
    if (err) console.error("Error :", err);

    if (!data || data.length === 0) {
      res.redirect('/');
    } else {
      const url = data.original_url;
      res.redirect(url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
