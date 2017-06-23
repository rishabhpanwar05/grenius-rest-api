'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const WordSchema = new mongoose.Schema({
	word: {
		type: String,
		required: true
	},
	partofspeech: {
		type: String
	},
	meaning: {
		type: String,
		required: true
	},
	example: {
		type: String,
		required: true
	},
	synonym: {
		type: String
	},
	pzn: {
		type: String,
		required: true
	}
});

WordSchema.plugin(mongooseApiQuery)
WordSchema.plugin(createdModified, { index: true })

const Word = mongoose.model('Word', WordSchema)
module.exports = Word