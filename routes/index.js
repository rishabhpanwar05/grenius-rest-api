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
	  qs=require('qs'),
	  googleTranslate = require('google-translate')(config.MY_GOOGLE_API_KEY),
	  csv = require("fast-csv"),
	  fs=require("fs"),
	  moment = require('moment'),
	  nodemailer = require('nodemailer')
	  
var transport = nodemailer.createTransport({
        host:"smtp.gmail.com",
		port: 465,
		secure: true,
        auth:{
			type: 'OAuth2',
			user: config.mailUser,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			refreshToken: config.refreshToken
	   
        }
});
/*
var transport = nodemailer.createTransport({
        service: 'gmail',
		auth: {
			user: config.mailUser,
			pass: config.mailPass
		}
});
*/
  	
const Article = require('../models/article')
const ArticleDash = require('../models/articledash')
const Word= require('../models/word')
const WordHi= require('../models/word_hi')
const User= require('../models/user')
const Quiz= require('../models/quiz')
const WordOfDay=require('../models/word_of_day')
const Category=require('../models/category')
const Bookmark=require('../models/bookmark')
const Institute=require('../models/institute')
const TitleInstitute=require('../models/titleinstitute')

var authnjwt = function(req,res,next){
	//let token = req.headers.authorization.split(" ")[1];
	req.body=qs.parse(req.body)
	console.log(req.body)
	let token = req.body.sessionId || req.authorization.credentials 
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

/*----------------------------------Registering User------------------------------------------------------------*/

server.post('/register',function(req,res,next){
	  
	
	console.log("registering:")
	
	console.log(req.body)
	//var body=JSON.parse(req.params)
	//console.log(body)
	req.body=qs.parse(req.body)
	User.findOne({ emailId:req.body.emailId  }, function (err, user) {
      if (err) {
			console.log(err)
			res.send(200,{"message":"error","id":"none","name":"null","status":false});
			next()
		}
        if(user) {
			console.log("Already registered")
		  if(req.body.mobile==null){
			  console.log("redirecting to login")
			  var token = user.generateJwt();
			var state = user.setLoggedIn(token);
			if(state==true){
				res.status(200);
				res.session=token;
				res.json({
				  "message" : token,
				  "id":user.fbId,
				  "name":user.name,
				  "status":true
				});	
			}
			next()
			return
		  }
		  else{
			res.send(200,{"message":"Already Registered","id":"none","name":"null","status":false});
			next()
			return  
		  }
        	
		}
		var user = new User();
		user.emailId=req.body.emailId
		if(req.body.city!=null)
			user.city=req.body.city
		if(req.body.mobile!=null){
			user.name=req.body.name
			user.setPassword(req.body.password);
			user.mobile=req.body.mobile
			
		}
		else{
			user.name=req.body.username
			user.fbId=req.body.fbId
			user.accessToken=req.body.accessToken
		}

	  user.save(function(err) {
		if (err!=null) {
			log.error(err)
			res.send(200,{"message":err.message,"id":"none","name":"null","status":false})
			return
		}
	    var token;
	    token = user.generateJwt();
		var state = user.setLoggedIn(token);
		if(state==true){
			console.log("sending token:",token)
			res.send(200,{
			  "message" : token,
			  "id":user.emailId,
			  "name":user.name,
			  "status": true
			});
			next()
			return
		}
	  });
	})
	})
server.post('/login',function(req,res,next){
	console.log("logging in")
	req.body=qs.parse(req.body)
	console.log(req.body)
	//req.body.emailId=req.body.emailId.trim()
	User.findOne({ emailId: req.body.emailId }, function (err, user) {
      if (err) {
			console.log(err)
			res.send(200,{"message":"error","id":"none","name":"null","status":false});
			next()
		}
      // Return if user not found in database
      if (!user) {
			console.log("User not found")
        	res.send(200,{"message":"NotFound","id":"none","name":"null","status":false});
			next()
			return
      }
      // Return if password is wrong
      if (!user.validPassword(req.body.password)) {
        res.send(200,{"message":"incorrect","id":"none","name":"null","status":false});
		next()
		return;
      }
      // If credentials are correct, return the user object
      // If a user is found
		if(user){
			var token = user.generateJwt();
			var state = user.setLoggedIn(token);
			if(state==true){
				res.send(200,{
				  "message" : token,
				  "id":user.emailId,
				  "name":user.name,
				  "status":true
				});	
			}
		}
	});
})

server.post('/logout',function(req, res,next){
	req.body=qs.parse(req.body)
    User.findOne({emailId:req.body.emailId},
		function(err, user) {

			if (err!=null) {
				log.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			}
			console.log("user is"+user);
			user.token=''
			user.loggedIn=false
			user.save(function(err){
				if (err!=null) {
				log.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
				}
				res.send(200)
			})
	})
  })

/*------------------------------------Articles----------------------------------------------------------*/

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
					'imagePath':req.body.imagePath,
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


/*-------------------------------------Dashboard Articles---------------------------------------------------------*/



server.post('/addArticleDashboard',function(req, res, next){
	console.log("adding article for dashboard")
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
					'imagePath':req.body.imagePath,
					'desc':req.body.desc
				}
			}
			
			let articledash = new ArticleDash(data)
			console.log(articledash)
			
			articledash.save(function(err) {

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

server.post('/dashboardArticles', function(req, res, next) {
	console.log("Sending articles for dashboard");
	ArticleDash.find(
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

server.post('/removeArticleDashboard',function(req, res, next) {
	console.log("removing articles from dashboard");
	ArticleDash.findByIdAndRemove(mongoose.mongo.ObjectId(req.body.id),
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


/*------------------------------------------Commented----------------------------------------------------*/


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




/*-----------------------------------------Word-----------------------------------------------------*/

server.post('/addWord',function(req, res, next) {
	
		var docs=[];
		csv
		 .fromPath('./word.csv', {headers : ["sno", "word", "meaning", "synonym", "pzn", "pos", "example","imagePath","hf"]})
		 .on("data", function(data){
			 console.log(data);
			 docs.push(data)
			 //console.log("here",docs)
		 })
		 .on("end", function(){
			 console.log("done-------------------------------------------------------------------------------------------",docs);
			 var count = 0;
			docs.forEach(function(doc){
				var word = new Word();
				word.sno=doc.sno
				word.word=doc.word
				word.meaning=doc.meaning
				word.synonym=doc.synonym
				word.pzn=doc.pzn
				word.pos=doc.pos
				word.example=doc.example
				word.imagePath=doc.imagePath
				word.hf=doc.hf
				console.log("here",word)
				word.save(function(err){
					if (err!=null) {
						log.error(err)
						return next(new errors.InternalError(err.message))
						next()
					}
					count++;
					if( count == docs.length ){
						sendResponse();
					}
				});
			});
			function sendResponse(){
					res.send(200,"ADDED")
			}
			 
		 });
})
/*server.post('/addWord',function(req, res, next) {

})


/*
server.post('/addWord',function(req, res, next) {
	//console.log(req.headers.authorization.split(" ")[1])
	let data = req.body || {}
	console.log("adding word",data)
	data={
		"sno":req.body.sno,
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

})*/


server.post('/translate', function(req,res,next){
	console.log("translating")
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		Word.find(
		{},
		[],
		{
			skip:index, // Starting Row
			//limit:10 // Ending Row
			//sort:{
				//date: -1 //Sort by Date Added DESC
			//}
		},
		function(err, docs) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
		docs.forEach(function(doc){
			//console.log(doc)
			let word_tr=new WordHi()
			word_tr.sno=doc.sno
			word_tr.word=doc.word
			googleTranslate.translate(doc.word, 'hi', function(err, translation) {
				console.log(translation);
				word_tr.translated=translation.translatedText
				word_tr.save(function (err) {
					if (err!=null) {
						log.error(err)
						return next(new errors.InternalError(err.message))
						next()
					}
					
				})
				
				
				
				Word.findOne(
					{sno:doc.sno},
					[],
					{},
					function(err, word) {

				        if (err!=null) {
				            log.error(err)
				            return next(new errors.InvalidContentError(err.errors.name.message))
				        }
						console.log("word is"+word);
						if(word!=null){
							word.translated=word_tr.translated
							word.save(function(err) {

								if (err!=null) {
									log.error(err)
									return next(new errors.InternalError(err.message))
									next()
								}
							})
						}
				     	//next()  
				    })
				
				
				
				console.log(translation);
				// =>  { translatedText: 'Hallo', originalText: 'Hello', detectedSourceLanguage: 'en' }
			    })
				
		})
		res.send(200,"TRANSLATED")
	    
		//next()
	})
})

server.post('/wordshi', function(req, res, next) {
	console.log("Sending words hi");
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		WordHi.find(
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
			console.log("done")
	        next()
	    })

})


server.post('/updateHi',function(req, res, next) {
		console.log("updating translations")
		var docs=[];
		csv
		 .fromPath('./updatehi.csv', {headers : ["_id", "translated","word", "sno"]})
		 .on("data", function(data){
			 console.log(data);
			 docs.push(data)
			 //console.log("here",docs)
		 })
		 .on("end", function(){
			 console.log("done-------------------------------------------------------------------------------------------",docs);
			 var count = 0;
			
			docs.forEach(function(doc){
				
				
				Word.findOne(
					{word:doc.word},
					[],
					{},
					function(err, word) {

				        if (err!=null) {
				            log.error(err)
				            return next(new errors.InvalidContentError(err.errors.name.message))
				        }
						console.log("word is"+word);
						if(word!=null){
							word.translated=doc.translated
							word.save(function(err) {

								if (err!=null) {
									log.error(err)
									return next(new errors.InternalError(err.message))
									next()
								}
							})
						}
						WordHi.findOne(
							{word:doc.word},
							[],
							{},
							function(err, word) {

								if (err!=null) {
									log.error(err)
									return next(new errors.InvalidContentError(err.errors.name.message))
								}
								console.log("word is"+word);
								if(word!=null){
									word.translated=doc.translated
									word.save(function(err) {

										if (err!=null) {
											log.error(err)
											return next(new errors.InternalError(err.message))
											next()
										}
									})
								}
								next()  
							})
				     	next()  
				    })
		 });
		 res.send(200,"UPDATED")
})
})


server.post('/words', function(req, res, next) {
	console.log("Sending words");
	let data = req.body || {}
		let index = 0
		//if(data!=null)
		//	index=data.index
		Word.find(
		{},
		[],
		{
			skip:index // Starting Row
			//limit:10 // Ending Row
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
			console.log("done")
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

/*server.post('/updateWord',function(req, res, next){
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
})*/

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

/*-----------------------------------------Quiz-----------------------------------------------------*/

server.post('/addQuiz',function(req, res, next){
	console.log("adding quiz")
			console.log(req.body);
			let data={}
				data={
					'sno':req.body.sno,
					'question':req.body.question,
					'answer':req.body.answer,
					'incorrect_1':req.body.incorrect_1,
					'incorrect_2':req.body.incorrect_2,
					'incorrect_3':req.body.incorrect_3,
					'example':req.body.example
				}
			let quiz = new Quiz(data)
			console.log(quiz)
			
			quiz.save(function(err){

				if (err!=null) {
					log.error(err)
					return next(new errors.InternalError(err.message))
					next()
				}

				res.send(201,"ADDED")
				next()

			})

})

	
server.post('/quizzes', function(req, res, next) {
	
	console.log("Sending quizzes");
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		Quiz.find(
		{},
		[],
		{
			skip:index // Starting Row
			//limit:10 // Ending Row
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


/*----------------------------------------Word Of The Day------------------------------------------------------*/

server.post('/addWordOfDay',function(req, res, next) {
	let data = {}
	console.log("adding word of day",data)
	data={
		"date":req.body.date,
		"word":req.body.word,
		"meaning":req.body.meaning,
		"synonym":req.body.synonym,
		"pzn":req.body.pzn,
		"pos":req.body.partofspeech,
		"example":req.body.example,
		"imagePath":req.body.imagePath
	}
	let word= new WordOfDay(data)
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

server.post('/addWordOfDayCsv',function(req, res, next) {
	
		var docs=[];
		csv
		 .fromPath('./wordofday.csv', {headers : ["date", "word", "meaning","synonym","pzn","pos","example","imagePath"]})
		 .on("data", function(data){
			 console.log(data);
			 docs.push(data)
			 //console.log("here",docs)
		 })
		 .on("end", function(){
			 console.log("done-------------------------------------------------------------------------------------------",docs);
			 var count = 0;
			
			docs.forEach(function(doc){
				var  word= new WordOfDay()
				
				word.date=doc.date
				word.word=doc.word
				word.synonym=doc.synonym
				word.meaning=doc.meaning
				word.pzn=doc.pzn
				word.pos=doc.pos
				word.example=doc.example
				word.imagePath=doc.imagePath		
	
				console.log("here",word)
				word.save(function(err){
					if (err!=null) {
						log.error(err)
						return next(new errors.InternalError(err.message))
						next()
					}
					count++;
					if( count == docs.length ){
						sendResponse();
					}
				});
			});
			function sendResponse(){
					res.send(200,"ADDED")
			}
			 
		 });
})
server.post('/wordOfDay', function(req, res, next) {
	console.log("Sending word of day");
	//var user_ip=getClientAddress(req)
	//console.log("ip is",ip)
	//satelize.satelize({ip:user_ip}, function(err, payload) {
		//console.log(payload)
	//});
	var datetime = new Date();
	
	//now.setTimezone("America/Los_Angeles");
	//console.log(now.getDate());
	
	let data = req.body || {}
		WordOfDay.find(
		{
			date:{$lte:datetime} 
		},
		[],
		{
			//skip:0, // Starting Row
			limit:0, // Ending Row
			sort:{
				date: -1 //Sort by Date Added DESC
			}			
		},
		function(err, docs) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
	
	        res.send(docs[0])
			console.log("done")
	        next()

	    })
})

server.post('/monthlyWordOfDay', function(req, res, next) {
	console.log("Sending monthly word of day");
	//var user_ip=getClientAddress(req)
	//console.log("ip is",ip)
	//satelize.satelize({ip:user_ip}, function(err, payload) {
		//console.log(payload)
	//});
	//var datetime = new Date();
	
	//now.setTimezone("America/Los_Angeles");
	//console.log(datetime)
	//console.log(datetime-30);
	var now=moment().utc().format();
	console.log(now)
	var monthold=moment().subtract(1, 'months')
	let data = req.body || {}
		WordOfDay.find(
		{
			date:{$lte:now,$gte:monthold} 
		},
		[],
		{
			//skip:0, // Starting Row
			limit:0, // Ending Row
			sort:{
				date: -1 //Sort by Date Added DESC
			}			
		},
		function(err, docs) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
	
	        res.send(docs)
			console.log("done")
	        next()

	    })
})

/*----------------------------------------Category------------------------------------------------------*/

server.post('/addCategory',function(req, res, next) {
	
		var docs=[];
		csv
		 .fromPath('./category.csv', {headers : ["sno", "category", "synonym", "meaning"]})
		 .on("data", function(data){
			 console.log(data);
			 docs.push(data)
			 //console.log("here",docs)
		 })
		 .on("end", function(){
			 console.log("done-------------------------------------------------------------------------------------------",docs);
			 var count = 0;
			
			docs.forEach(function(doc){
				var category = new Category();
				
				category.sno=doc.sno
				category.category=doc.category
				category.synonym=doc.synonym
				category.meaning=doc.meaning
				
				console.log("here",category)
				category.save(function(err){
					if (err!=null) {
						log.error(err)
						return next(new errors.InternalError(err.message))
						next()
					}
					count++;
					if( count == docs.length ){
						sendResponse();
					}
				});
			});
			function sendResponse(){
					res.send(200,"ADDED")
			}
			 
		 });
})

server.post('/category', function(req, res, next) {
	console.log("Sending Categories");
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		Category.find(
		{},
		[],
		{
			skip:index // Starting Row
			//limit:10 // Ending Row
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
			console.log("DONE!")
	        next()
	    })
})

/*------------------------------------Bookmarks------------------------------------------------------*/
server.post('/addBookmark',authnjwt,function(req,res,next){
	console.log("Adding Bookmarks")
	console.log(req.body)
	var words = req.body.words
	console.log(words)
	var userId=req.body.userId;
	Bookmark.findOneAndRemove({userId:userId},function(err,bookmark){
			if (err) {
				res.send(404,{"message":err,"status":false});
				next()
			}
			bookmark = new Bookmark();
			bookmark.userId=req.body.userId
			if(words!=null){
				words.forEach(function(word){
				bookmark.words.push(word)
			})
			}
			bookmark.save(function(err) {
				if (err!=null) {
					log.error(err)
					res.send(404,{"message":err,"status":false});
					next()
				}
				else{
					res.send(200,{"message":"ADDED","status":true})
				}
			})
			
		})
})


server.post('/bookmarks',authnjwt,function(req,res,next){
	
		
		console.log("Sending Bookmarks")
	
	req.body=qs.parse(req.body);
	console.log(req.body)
	
	Bookmark.findOne({'userId':req.body.userId},function(err,bookmark){
			if (err) {
				res.send(404,{"message":err,"status":false});
				next()
			}
			var words;
			console.log("Bookmark is:",bookmark)
			if(bookmark){
				console.log(bookmark)
				words=bookmark.words
				console.log(words)
				
			}
			else{
				words=[]	
			}
			res.send(200,words);
			next()
			
		})
})

/*-----------------------------------Forgot password--------------------------------------------------*/

server.post('/generatePasscode',function(req,res,next){
	console.log("generating passcode")
	
	req.body=qs.parse(req.body)
	console.log(req.body)
	User.findOne({ emailId: req.body.emailId }, function (err, user) {
      if (err) {
			console.log(err)
			res.send(200,{"message":"error","status":false});
			next()
		}
      // Return if user not found in database
      if (!user) {
			console.log("User not found")
        	res.send(200,{"message":"User Not Found","status":false});
			next()
			return
      }
      // If a user is found
		if(user){
			if(!user.fbId){
				var passcode = user.generatePasscode();
				console.log("User is "+user)
				var mailOptions = {
					from: ''+config.mailUser+'', // sender address
					to: req.body.emailId, // list of receivers
					subject: "Wordly Account Password Reset", // Subject line
					text: "", // plaintext body
					html: "Hi <b>"+ user.name +",</b><br><br>You recently requested to reset your password for your Wordly account. In your app, key in the passkey below to reset your password. This password reset is only valid for the next hour.<br><br><b>"+
							passcode+"</b><br><br>If you did not request a password reset, please ignore this email or contact support if you have questions.<br><br>Thanks,<br><b>Team Wordly</b>" // html body
				}; 
				transport.sendMail(mailOptions, function(error, info){
					if(error){
						return res.send(error);
					}
					return res.send(200,{"message":"Mail sent successfully","status":true});
				}); 
			}
			else{
				res.send(200,{"message":"User Registered using Fb","status":false});
			}
			
			next()
		}
	});	 
})

server.post('/verifyPasscode',function(req,res,next){
	console.log("verifying passcode")
	
	req.body=qs.parse(req.body)
	console.log(req.body)
	User.findOne({ emailId: req.body.emailId }, function (err, user) {
      if (err) {
			console.log(err)
			res.send(200,{"message":err,"status":false});
			next()
		}
      // Return if user not found in database
      if (!user) {
			console.log("User not found")
        	res.send(200,{"message":"User Not Found","status":false});
			next()
			return
      }
      // If a user is found
		if(user){
			var status = user.verifyPasscode(req.body.passcode);
			if(status==true){
				res.send(200,{"message":"Passcode Verified successfully","status":true});
			}
			else{
				res.send(200,{"message":"Wrong Passcode","status":false});
			}
			next()
		}
	});	 
})
server.post('/updatePassword',function(req,res,next){
	console.log("updating passcode")
	
	req.body=qs.parse(req.body)
	console.log(req.body)
	User.findOne({ emailId: req.body.emailId }, function (err, user) {
      if (err) {
			console.log(err)
			res.send(200,{"message":err,"status":false});
			next()
		}
      // Return if user not found in database
      if (!user) {
			console.log("User not found")
        	res.send(200,{"message":"User Not Found","status":false});
			next()
			return
      }
      // If a user is found
		if(user){
			var status = user.verifyPasscode(req.body.passcode);
			if(status==true){
				user.setPassword(req.body.password);
				user.save(function(err) {

				if (err!=null) {
					log.error(err)
					return next(new errors.InternalError(err.message))
					next()
				}

				res.send(200,{"message":"Password Updated successfully","status":true});
				next()

			})
				
			}else{
				res.send(200,{"message":"Wrong Passcode","status":false});
			}
			next()
		}
	});	 
})



/*-----------------------------------Institutions--------------------------------------------------*/

server.post('/addInstitute',function(req, res, next) {
	let data = {}
	console.log("adding institute",data)
	data={
		"name":req.body.name,
		"type":req.body.type,
		"sno":req.body.sno,
		"short_desc":req.body.short_desc,
		"long_desc":req.body.long_desc,
		"url":req.body.url,
		"imagePath":req.body.imagePath,
		"location":req.body.location
	}
	let institute= new Institute(data)
	console.log(institute)
	
	 institute.save(function(err) {

		if (err!=null) {
			log.error(err)
			return next(new errors.InternalError(err.message))
			next()
		}

		res.send(201,"ADDED")
		next()

	})
})


server.post('/institutes', function(req, res, next) {
	console.log("Sending institutes");
	let data = req.body || {}
		Institute.find(
		{},
		[],
		{
		},
		function(err, doc) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
	
	        res.send(doc)
			console.log("done")
	        next()
	    })

})


/*-----------------------------------Title Institutions--------------------------------------------------*/

server.post('/addTitleInstitute',function(req, res, next) {
	let data = {}
	console.log("adding title institute",data)
	data={
		"name":req.body.name,
		"url":req.body.url,
		"imagePath":req.body.imagePath,
		"location":req.body.location
	}
	let titleinstitute= new TitleInstitute(data)
	console.log(titleinstitute)
	
	 titleinstitute.save(function(err) {

		if (err!=null) {
			log.error(err)
			return next(new errors.InternalError(err.message))
			next()
		}

		res.send(201,"ADDED")
		next()

	})
})


server.post('/titleinstitute', function(req, res, next) {
	console.log("Sending title institute");
	let data = req.body || {}
		TitleInstitute.find(
		{},
		[],
		{
		},
		function(err, doc) {

	        if (err) {
	            log.error(err)
	            return next(new errors.InvalidContentError(err.errors.name.message))
	        }
	
	        res.send(doc)
			console.log("done")
	        next()
	    })

})
