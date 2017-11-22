'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin,
	  crypto = require('crypto'),
  	  jwt = require('jsonwebtoken'),
  	  config=require('../config');

const UnverifiedUserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	emailId: {
		type: String,
		required: true
		//unique:true
	},
	mobile: {
		type: String
	},
	accessToken:{
		type: String
	},
	fbId: {
		type: String
	},
	city: {
		type: String
	},
	gender:{
		type: String
	},
	motive:{
		type: String
	},
	password:String,
	hash: String,
	salt: String,
	loggedIn: Boolean,
	token:String,
	passlink:String,
	passlinkExpiry:Date
});

UnverifiedUserSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UnverifiedUserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
	return this.hash === hash;
};

UnverifiedUserSchema.methods.generateJwt = function() {
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 365);
	var secret = config.MY_SECRET ;
	console.log('secret',secret)
	var token = jwt.sign({
		_id: this._id,
		email: this.email,
		name: this.name,
		exp: parseInt(expiry.getTime() / 1000),
	}, secret); // DO NOT KEEP YOUR SECRET IN THE CODE!

		return token;
};
UnverifiedUserSchema.methods.setLoggedIn = function(token) {
	this.loggedIn=true;
	this.token=token;
	this.save()
	return true;
};
UnverifiedUserSchema.methods.generatePasslink=function(){
	var pass;
	if(this.passlinkExpiry){
		if(this.passlinkExpiry<Date.now()){
			pass=crypto.randomBytes(3).toString('hex');
			this.passlink=pass
			console.log("pass link is:",pass)
		}
	}
	else{
		pass=crypto.randomBytes(3).toString('hex');
		this.passlink=pass
		console.log("pass is:",pass)
	}
	
	console.log("passlink is:",this.passlink)
	this.passlinkExpiry=Date.now()+3600000; // 1 hour
	this.save()
	return this.passlink
}
UnverifiedUserSchema.methods.verifyPasslink=function(pass){
	if(this.passlink==pass){
		return true;
	}
	return false
}
UnverifiedUserSchema.plugin(mongooseApiQuery)
UnverifiedUserSchema.plugin(createdModified, { index: true })

const UnverifiedUser = mongoose.model('UnverifiedUser', UnverifiedUserSchema)
module.exports = UnverifiedUser
