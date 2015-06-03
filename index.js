var rss_url = 'http://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss';

var config = require('./config.json');
var directory = config.outdir;

var FeedParser = require('feedparser'),
	request = require('request'),
	fs = require('fs'),
	path = require('path'),
	sanitize = require('sanitize-filename');

var feedparser = new FeedParser(),
	rss_req = request(rss_url);

rss_req.on('error', function(err) {
	throw err;
});

feedparser.on('error', function(err) {
	throw err;
});
feedparser.on('readable', function() {
	var stream = this
		, item;

	while (item = stream.read()) {
		var title = item.title
			, date = new Date(item.pubDate)
			, enclosures = item.enclosures;

		if(enclosures != null) {
			enclosures.forEach(function(enc, i) {
				var enc_url = enc.url
					, extension = path.extname(enc_url)
					, fetch_req = request(enc_url)
					, full_title = title + ' ' + i;

				fetch_req.on('error', function(err) {
					console.log('Could not fetch ' + full_title + ': ' + err);
				});

				fetch_req.on('response', function(res) {
					var datestring = date.toISOString().substring(0, 10)
						, filename = sanitize(datestring + '_' + full_title + extension)
						, full_filename = path.join(directory, filename);

					if(!fs.existsSync(full_filename)) {
						var writeStream = fs.createWriteStream(full_filename);

						fetch_req.on('end', function() {
							console.log('Fetched ' + full_title);
						});

						fetch_req.pipe(writeStream);
					}
				});
			});
		}
	}
});

// go!
rss_req.pipe(feedparser);