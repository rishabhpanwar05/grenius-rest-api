'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const WordHiSchema = new mongoose.Schema({
	sno: {
		type: Number
	},
	word: {
		type: String
	},
	translated:{
		type:String
	}
});

WordHiSchema.plugin(mongooseApiQuery)
WordHiSchema.plugin(createdModified, { index: true })

const WordHi = mongoose.model('WordHi', WordHiSchema)
module.exports = WordHi