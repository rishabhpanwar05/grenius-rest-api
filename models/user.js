'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin,
	  crypto = require('crypto'),
  	  jwt = require('jsonwebtoken'),
  	  config=require('../config');

const UserSchema = new mongoose.Schema({
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
	hash: String,
	salt: String,
	loggedIn: Boolean,
	token:String,
	passcode:String,
	passcodeExpiry:Date
});

UserSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
	return this.hash === hash;
};

UserSchema.methods.generateJwt = function() {
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
UserSchema.methods.setLoggedIn = function(token) {
	this.loggedIn=true;
	this.token=token;
	this.save()
	return true;
};
UserSchema.methods.generatePasscode=function(){
	var pass;
	if(this.passcodeExpiry<Date.now()){
		pass=crypto.randomBytes(5).toString('hex');
	}
	this.passcode=pass
	this.passcodeExpiry=Date.now()+3600000; // 1 hour
	this.save()
	return pass
}
UserSchema.methods.verifyPasscode=function(pass){
	if(this.passcode==pass){
		return true;
	}
	return false
}

UserSchema.plugin(mongooseApiQuery)
UserSchema.plugin(createdModified, { index: true })

const User = mongoose.model('User', UserSchema)
module.exports = User
