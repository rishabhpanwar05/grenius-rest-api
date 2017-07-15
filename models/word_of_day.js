'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const WordOfDaySchema = new mongoose.Schema({
	date: {
		type: Date
	},
	word: {
		type: String
	},
	meaning: {
		type: String
	},
	synonym: {
		type: String
	},
	pzn: {
		type: String
	},
	pos: {
		type: String
	},
	example: {
		type: String
	},
	imagePath:{
		type:String
	}
});

WordOfDaySchema.plugin(mongooseApiQuery)
WordOfDaySchema.plugin(createdModified, { index: true })

const WordOfDay = mongoose.model('WordOfDay', WordOfDaySchema)
module.exports = WordOfDay