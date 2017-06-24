'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	errors = require('restify-errors'),
	  dateTime = require('node-datetime'),
	  multer = require('multer'),
	  mongoose = require('mongoose'),
	  config = require('../config'),
	  nJwt = require('njwt'),
	  qs=require('qs')
		
const Article = require('../models/article')
const Word= require('../models/word')
const User= require('../models/user')


var authnjwt = function(req,res,next){
	//let token = req.headers.authorization.split(" ")[1];
	let token = req.authorization.credentials
	nJwt.verify(token,config.MY_SECRET,function(err,verifiedJwt){
  if(err){
    console.log(err); // Token has expired, has been tampered with, etc
	var jsRes={"status":"Tampered/Expired token"};
	res.send(400,jsRes);
	
  }else{
	var jwtbody=verifiedJwt.body
	var id=jwtbody['_id'];	
    console.log(verifiedJwt," ",token); // Will contain the header and body
	User.findById(mongoose.mongo.ObjectId(id),
	function(err, doc) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
		console.log("doc is"+doc);
		if(doc!=null && doc.token==token){
			next()
		}
        else{
			res.header('Location',"/admin");
			res.send(200,{"status":"Not found/Wrong Credentials"})
		}
			

    })
  }
});
}


var storageArticle	=	multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './uploads/articles');
	},
	filename: function (req, file, callback) {
		var filename=file.originalname.split(".");
	 var extension=filename[filename.length-1];
	filename.pop();
	var name=filename.join();
	console.log("storing with "+name);
		callback(null, name + '-' + Date.now()+'.'+extension);
	}
})

var uploadArticle = multer({ storage : storageArticle}).single('file')

/*----------------------------------------------------------------------------------------------*/

server.post('/register',function(req,res,next){
	  var user = new User();
	
	console.log("registering:")
	req.body=qs.parse(req.body)
	console.log(qs.parse(req.body))
	//var body=JSON.parse(req.params)
	//console.log(body)
	user.emailId=req.body.emailId

		if(req.body.mobile!=null){
			user.name=req.body.name
			user.setPassword(req.body.password);
			user.mobile=req.body.mobile
			user.country=req.body.country
			user.city=req.body.city
			
		}
		else{
			user.name=req.body.username
			user.fbId=req.body.fbId
			user.accessToken=req.body.accessToken
		}

	  user.save(function(err) {
		if (err!=null) {
			log.error(err)
			res.send(400,{"message":err.message,"status":false})
			return
		}
	    var token;
	    token = user.generateJwt();
		var state = user.setLoggedIn(token);
		if(state==true){
			console.log("sending token:",token)
			res.status(200);
			res.json({
			  "message" : token,
			  "status": true
			});	
		}
	  });
	})


/*----------------------------------------------------------------------------------------------*/

server.post('/addArticle',function(req, res, next){
	console.log("adding article")
	uploadArticle(req,res,function(err) {
		if(err) {
			return res.end(err+" Error uploading file.");
		}
		else {
			console.log(req.file);	
			console.log(req.body);
			let data={}
			if(req.file!=null){ 
				data={
					'title':req.body.title,
					'imagePath':req.file.path || {},
					'desc':req.body.desc
				}
			}
			else{
				data={
					'title':req.body.title,
					'imagePath':'',
					'desc':req.body.desc
				}
			}
			
			let article = new Article(data)
			console.log(article)
			
			article.save(function(err) {

				if (err!=null) {
					log.error(err)
					return next(new errors.InternalError(err.message))
					next()
				}

				res.send(201,"ADDED")
				next()

			})
		}	
	});

})

	
server.post('/articles', function(req, res, next) {
	console.log("Sending articles");
	Article.find(
	{},
	[],
	{
		skip:0 // Starting Row
		//limit:10, // Ending Row
		
	},
	function(err, doc) {

        if (err) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
	
        res.send(doc)
        next()

    })

})
server.post('/getArticleDetails', function(req, res, next) {
	console.log("Sending article details");
	Article.findById(mongoose.mongo.ObjectId(req.body.id),
	function(err, doc) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
		console.log("article doc is"+doc);
		if(doc!=null)
			res.send(doc)
        else
			res.send(200,"Not found")
		next()

    })

})

server.post('/removeArticle',function(req, res, next) {
	console.log("removing articles");
	Article.findByIdAndRemove(mongoose.mongo.ObjectId(req.body.id),
	function(err) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
        else
			res.send(200,"DELETED")
		next()

    })

})

server.post('/updateArticle',function(req, res, next){
	console.log("updating article")
	console.log("start----------------================")
	let id=null;
	console.log(req);
	if(typeof req.query.id=="undefined"){
		console.log("inside if ");
		id=req.body.id;
		
	}
	else{
		console.log("else part");
		id=req.query.id;
	}

	console.log("end----------------================")
	console.log("ID IS ______________--------------"+id);
	Article.findById(mongoose.mongo.ObjectId(id),
	function(err,article){
		if(err!=null){
			log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
		}
		else{
			console.log("updating")
			
			uploadArticle(req,res,function(err) {
				if(err) {
					return res.end(err+" Error uploading file.");
				}
				else {
					console.log(req.file);	
					console.log(req.body);
					
					article.title=req.body.title
					article.desc=req.body.desc
					if(req.file!=null)
						article.imagePath=req.file.path 
					
					
			
					article.save(function(err) {

						if (err!=null) {
							log.error(err)
							return next(new errors.InternalError(err.message))
							next()
						}

						res.send(201,"File Updated")
						next()

					})
				}	
			});
			
			
		}
			
	})
})

/*----------------------------------------------------------------------------------------------*/


/*server.post('/addUser',function(req, res, next) {
	let data = req.body || {}
	console.log("adding user",data)
	data={
		"name":req.body.name,
		"email":req.body.email,
		"mobile":req.body.mobile,
		"password":req.body.password
	}
	let user = new User(data)
	console.log(user)
	
	 user.save(function(err) {

		if (err!=null) {
			log.error(err)
			return next(new errors.InternalError(err.message))
			next()
		}

		res.send(201,"ADDED")
		next()

	})

})

server.post('/registerUsers', function(req, res, next) {
	console.log("Sending registration");
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		User.find(
		{},
		[],
		{
			skip:index, // Starting Row
			//limit:10, // Ending Row
			//sort:{
				//date: -1 //Sort by Date Added DESC
			//}
		},
		function(err, doc) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
		
	        res.send(doc)
	        next()

	    })

})

server.post('/getUserDetails', function(req, res, next) {
	console.log("Sending user details");
	User.findById(mongoose.mongo.ObjectId(req.body.id),
	function(err, doc) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
		console.log("doc is"+doc);
		if(doc!=null)
			res.send(doc)
        else
			res.send(200,"Not found")
		next()

    })

})

server.post('/updateUser',function(req, res, next){
	console.log("updating user" + req.body.id)
	User.findById(mongoose.mongo.ObjectId(req.body.id),
	function(err,word){
		if(err!=null){
			log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
		}
		else{
			console.log("updating",user)
			user.name=req.body.name
			user.email=req.body.email
			user.password=req.body.password
			user.mobile=req.body.mobile
			console.log("updated",user)
			user.save(function(err){
				if(err!=null){
				log.error(err)
					return next(new errors.InternalError(err.message))
					next()	
				}
				res.send(200,"UPDATED")
				next()
			})
		}
			
	})
})

server.post('/removeUser',function(req, res, next) {
	console.log("removing user");
	User.findByIdAndRemove(mongoose.mongo.ObjectId(req.body.id),
	function(err) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
        else
			res.send(200,"DELETED")
		next()

    })

})*/




/*----------------------------------------------------------------------------------------------*/


server.post('/addWord',function(req, res, next) {
	//console.log(req.headers.authorization.split(" ")[1])
	let data = req.body || {}
	console.log("adding word",data)
	data={
		"word":req.body.word,
		"partofspeech":req.body.partofspeech,
		"meaning":req.body.meaning,
		"example":req.body.example,
		"synonym":req.body.synonym,
		"pzn":req.body.pzn
	}
	let word = new Word(data)
	console.log(word)
	
	 word.save(function(err) {

		if (err!=null) {
			log.error(err)
			return next(new errors.InternalError(err.message))
			next()
		}

		res.send(201,"ADDED")
		next()

	})

})

server.post('/words', function(req, res, next) {
	console.log("Sending words");
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		Word.find(
		{},
		[],
		{
			skip:index, // Starting Row
			//limit:10, // Ending Row
			//sort:{
				//date: -1 //Sort by Date Added DESC
			//}
		},
		function(err, doc) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
		
	        res.send(doc)
	        next()

	    })

})
server.post('/getWordDetails', function(req, res, next) {
	console.log("Sending word details");
	Word.findById(mongoose.mongo.ObjectId(req.body.id),
	function(err, doc) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
		console.log("doc is"+doc);
		if(doc!=null)
			res.send(doc)
        else
			res.send(200,"Not found")
		next()

    })

})

server.post('/updateWord',function(req, res, next){
	console.log("updating word" + req.body.id)
	Word.findById(mongoose.mongo.ObjectId(req.body.id),
	function(err,word){
		if(err!=null){
			log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
		}
		else{
			console.log("updating",word)
			word.word=req.body.word
			word.meaning=req.body.meaning
			word.pzn=req.body.pzn
			word.partofspeech=req.body.partofspeech
			word.synonyms=req.body.synonyms
			word.example=req.body.example
			console.log("updated",word)
			word.save(function(err){
				if(err!=null){
				log.error(err)
					return next(new errors.InternalError(err.message))
					next()	
				}
				res.send(200,"UPDATED")
				next()
			})
		}
			
	})
})

server.post('/removeWord',function(req, res, next) {
	console.log("removing word");
	Word.findByIdAndRemove(mongoose.mongo.ObjectId(req.body.id),
	function(err) {

        if (err!=null) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }
        else
			res.send(200,"DELETED")
		next()

    })

})

