'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const InstituteSchema = new mongoose.Schema({
	name: {
		type: String
	},
	type:{
		type: String
	},
	sno:{
		type: Number
	},
	short_desc:{
		type: String
	},
	long_desc:{
		type: String
	},
	url:{
		type: String
	},
	imagePath:{
		type: String
	},
	location:{
		type: String
	}
});

InstituteSchema.plugin(mongooseApiQuery)
InstituteSchema.plugin(createdModified, { index: true })

const Institute = mongoose.model('Institute', InstituteSchema)
module.exports = Institute