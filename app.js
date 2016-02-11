var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');

var dbName = process.argv[2] || 'test';
var webapp = process.argv[3] || 'webapp';
var portListen = process.argv[4] || 3000;

var app = express();
app.use('/', express.static(webapp));
app.use(bodyParser());

app.param('collectionName', function(req, res, next, collectionName){
	console.log('[param] collectionName :', req);
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log('Client IP:', ip);
	console.log('Request Type:', req.method);
	var dbId = req.query.db;
	console.log('dbId : ', dbId);
	var primaryKey = req.query.primaryKey;
	console.log('primaryKey : ', primaryKey);
	
	MongoClient.connect('mongodb://localhost:27017/' + dbName, function(err, db) {
		req.db = db;
		req.collection = db.collection(collectionName);
		return next();
	});
})

app.param('id', function(req, res, next, id) {
	console.log('[param] id :', req);
	var primaryKey = req.query.primaryKey;
	var id = req.params.id;
	
	if (primaryKey == undefined || primaryKey == null || primaryKey == "id") {
		primaryKey = "_id";
		id = new ObjectID(id);
	}
	
	req.searchQuery = {};
	req.searchQuery[primaryKey] = id;
	console.log('searchQuery :', req.searchQuery);
	return next();
})

app.get('/rest/private/:collectionName', function (req, res, next) {
	var fieldQuery = req.query.fieldQuery;
	var valueQuery = req.query.valueQuery;
	var searchQuery = undefined;
	
	if (fieldQuery != undefined && valueQuery != undefined) {
		searchQuery = {};
		searchQuery[fieldQuery] = valueQuery;
	}
	
	console.log("find: searchQuery:", searchQuery);
	
	req.collection.find(searchQuery).toArray(function (e, results) {
		console.log("find: results:", results);
		
		if (e) {
			return next(e);
		}
		
		res.send(results);
	})
});

app.post('/rest/private/:collectionName', function (req, res, next) {
	var primaryKey = req.query.primaryKey;
	var obj = req.body;
	obj._id = undefined;

	req.collection.insertOne(obj, {}, function (e, insertResults) {
		if (e) {
			return next(e)
		}
		
		if (primaryKey == undefined || primaryKey == null || primaryKey == "id") {
			var insertedId = insertResults.insertedId;
			console.log('insertedId :', insertedId);
			console.log('obj insert :', obj);
			var searchQuery = {_id: insertedId};
			console.log('searchQuery :', searchQuery);
			
			req.collection.updateOne(searchQuery, {$set: {id: insertedId}}, {}, function(e, result) {
			    if (e) {
			    	return next(e)
			    }
			    
				obj.id = insertedId;
				res.send(obj)
			})
		} else {
			res.send(obj)
		}
	})
});

app.put('/rest/private/:collectionName/:id', function(req, res, next) {
	req.collection.updateOne(req.searchQuery, {$set:req.body}, {}, function(e, result) {
	    if (e) {
	    	return next(e)
	    }
	    
	    res.send((result===1)?{msg:'success'}:{msg:'error'})
	})
});

app.get('/rest/private/:collectionName/:id', function (req, res, next) {
	req.collection.findOne(req.searchQuery, function (e, result) {
		console.log("findOne:", result);
		
		if (e) {
			return next(e);
		}
		
		res.send(result);
	});
});

app.delete('/rest/private/:collectionName/:id', function(req, res, next) {
	req.collection.deleteOne(req.searchQuery, {}, function(e, result){
		if (e) return next(e)
		res.send((result===1)?{msg:'success'}:{msg:'error'})
	})
})

var server = app.listen(portListen, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
