var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');

var dbName = process.argv[2] || 'test';
var webapp = process.argv[3] || 'webapp';
var portListen = process.argv[4] || 3000;

var collectionCounters;
var collectionUser;
var collectionService;
var collectionCompany;

function insertDirect(collection, obj, res, next) {
	collection.insertOne(obj, {}, function (e) {
		if (e) {
			if (next) {
				return next(e)
			}
		}
		
		if (res) {
			res.send(obj)
		}
	})
}

function insert(collection, primaryKey, obj, res, next) {
	if (primaryKey == "id" && obj.id == undefined) {
		var query = {name: collection.collectionName};
		var update = {$inc: {lastId: 1}};
		var options = {upsert: true, returnOriginal: false};
		
		var findAndModifyCallback = function(error, result) {
			if (error == null && result.lastErrorObject.n == 1) {
				obj.id = result.value.lastId;
				console.log("findAndModifyCallback - result:", result, " - obj:", obj);
				insertDirect(collection, obj, res, next);
			}
		}
		
		collectionCounters.findOneAndUpdate(query, update, options, findAndModifyCallback);  
	} else {
		insertDirect(collection, obj, res, next);
	}
}

// verfica se existem os registros base
MongoClient.connect('mongodb://localhost:27017/' + dbName, function(err, db) {
	var db = db;
	collectionCounters = db.collection("crud_counters");
	collectionUser = db.collection("crud_user");
	collectionService = db.collection("crud_service");
	collectionCompany = db.collection("crud_company");
	
	collectionUser.find({"name":"admin"}).toArray(function (e, list) {
		if (e) {
			console.log("error in find admin:", e);
		}
		
		if (list.length == 0) {
			insert(collectionUser, "id", {name:"admin", password:"123456", path:"/app/crud_service/0/0/0", roles:"{\"crudCompany\":{},\"crudService\":{},\"crudUser\":{}}"});
		}
	})
	
	collectionService.find().toArray(function (e, list) {
		if (e) {
			console.log("error in find services:", e);
		}
		
		if (list.length == 0) {
			var crudService = {name:"crudService", menu:"admin", filterFields:"id,name", fields:"{\"id\":{\"type\":\"i\",\"hiden\":true},\"menu\":{},\"name\":{},\"template\":{},\"title\":{},\"filterFields\":{},\"isOnLine\":{\"type\":\"b\"},\"fields\":{\"readOnly\":true},\"saveAndExit\":{\"type\":\"b\"}}"};
			insert(collectionService, "id", crudService);
			var crudCompany = {name:"crudCompany", menu:"admin", filterFields:"id,name,category", fields:"{\"id\":{\"type\":\"i\"},\"name\":{},\"category\":{}}"};
			insert(collectionService, "id", crudCompany);
			var crudUser = {name:"crudUser", menu:"admin", filterFields:"id,name,company", fields:"{\"id\":{\"type\":\"i\"},\"company\":{\"type\":\"i\",\"service\":\"crudCompany\"},\"name\":{},\"path\":{},\"password\":{\"type\":\"p\"},\"roles\":{},\"menu\":{},\"authctoken\":{}}"};
			insert(collectionService, "id", crudUser);
		}
	})
});

var app = express();
app.use('/', express.static(webapp));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

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
	
	if (primaryKey == undefined || primaryKey == null) {
		primaryKey = "id";
	}
	
	if (primaryKey == "id") {
		id = parseInt(id);
	}
	
	req.searchQuery = {};
	req.searchQuery[primaryKey] = id;
	console.log('searchQuery :', req.searchQuery);
	return next();
})

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

app.post('/rest/authc', function (req, res, next) {
	console.log("req.body:", req.body);
	var obj = req.body;
	// localiza o usuario
	var searchQuery = {"name":obj.userId, "password":obj.password};
	console.log("find: searchQuery:", searchQuery);
	collectionUser.find(searchQuery).toArray(function (e, users) {
		console.log("find: users:", users);
		
		if (e) {
			return next(e);
		}
		
		if (users.length == 1) {
			var user = users[0];
			user.authctoken = guid();
			// this.entityManager.merge(user); 
			var loginResponse = {};
			loginResponse.user = user;
			var roles = JSON.parse(user.roles);
			var names = Object.keys(roles);
			
			collectionService.find({name: { $in: names } }).toArray(function (e, services) {
				console.log("find: services:", services);
				
				if (e) {
					return next(e);
				}
				
				loginResponse.crudServices = services;
				res.send(loginResponse);
			})
		}
	})
});

app.get('/rest/:collectionName', function (req, res, next) {
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

app.post('/rest/:collectionName', function (req, res, next) {
	var primaryKey = req.query.primaryKey;
	var obj = req.body;
	insert(req.collection, primaryKey, obj, res, next);
});

app.put('/rest/:collectionName/:id', function(req, res, next) {
	var obj = req.body;
	delete obj["_id"];
	
	req.collection.updateOne(req.searchQuery, {$set:obj}, {}, function(e, result) {
	    if (e) {
	    	return next(e)
	    }
	    
		console.log("updateOne:", result);
		
		if (result.modifiedCount == 1) {
			res.send(obj);
		}
	})
});

app.get('/rest/:collectionName/:id', function (req, res, next) {
	req.collection.findOne(req.searchQuery, function (e, result) {
		console.log("findOne:", result);
		
		if (e) {
			return next(e);
		}
		
		res.send(result);
	});
});

app.delete('/rest/:collectionName/:id', function(req, res, next) {
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
