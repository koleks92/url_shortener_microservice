require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const dns = require('dns');
const { URL } = require('url');


let data = []

// Create and save URL
const createAndSaveURL = (newUrl, newShort) => {
  const url = { original_url: newUrl, short_url: newShort};
  data.push(url);
}

// Find URL by full address
const findUrl = (url) => {
  return data.find(obj => obj.original_url === url);
}

// Find URL by short address
const findShort = (shortUrl) => {
  return data.find(obj => obj.short_url === parseInt(shortUrl));
}




// Generate new short_url
const generateShortUrlAndSave = (url) => {
  // Generate new number
  let shortUrl = data.length + 1;

  // Add to database
  createAndSaveURL(url, shortUrl);
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

  // Check if url was provided
  if (!url || url === '') {
    res.json({error: 'invalid url'});
  }

  // Check if valid URL object
  let urlObj;
  try {
    urlObj = new URL(url).hostname;
  } catch (err) {
    res.json({error: 'invalid url'})
  } 

  // CHeck if URL object exists
  dns.lookup(urlObj, (err, address, family) => {
    if (err) res.json({error: 'invalid url'})

    // Check if url in database
    let urlCheck = findUrl(url);
    if (!urlCheck) {
      // Create and save new URL
      generateShortUrlAndSave(url);
      // Find in database
      urlCheck = findUrl(url);
      res.json(urlCheck);
    } else {
      res.json(urlCheck);
    }
  })
});

// Get
app.get('/api/shorturl/:shorturl?', function(req, res) {
  const shortUrl = req.params.shorturl;

  // Find in database
  const shortCheck = findShort(shortUrl);

  // Redirect to address
  if (!shortCheck) {
    res.redirect('/');
  } else {
    res.redirect(shortCheck.original_url);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
