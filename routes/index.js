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
	  fs=require("fs")
		
const Article = require('../models/article')
const ArticleDash = require('../models/articledash')
const Word= require('../models/word')
const WordHi= require('../models/word_hi')
const User= require('../models/user')
const Quiz= require('../models/quiz')
const WordOfDay=require('../models/word_of_day')
const Category=require('../models/category')


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

/*----------------------------------Registering User------------------------------------------------------------*/

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
	
	var stream = fs.createReadStream("test.csv");
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
	
	let data = req.body || {}
		let index = 0
		if(data!=null)
			index=data.index
		Word.find(
		{},
		[],
		{
			skip:index, // Starting Row
			limit:10 // Ending Row
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
			
			let word_tr=new WordHi()
			word_tr.sno=doc.sno
			word_tr.word=doc.word
			googleTranslate.translate(doc.word, 'hi', function(err, translation) {
				word_tr.translated=translation.translatedText
				word_tr.save(function (err) {
					if (err!=null) {
						log.error(err)
						return next(new errors.InternalError(err.message))
						next()
					}
					
				})
				console.log(translation);
				// =>  { translatedText: 'Hallo', originalText: 'Hello', detectedSourceLanguage: 'en' }
			    })
				
		})
		res.send(200,"TRANSLATED")
	    
		next()
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

server.post('/wordOfDay', function(req, res, next) {
	console.log("Sending words");
	
	var datetime = new Date();
	console.log(datetime);

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





