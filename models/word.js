'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const WordSchema = new mongoose.Schema({
	sno: {
		type: String
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
	}
});

WordSchema.plugin(mongooseApiQuery)
WordSchema.plugin(createdModified, { index: true })

const Word = mongoose.model('Word', WordSchema)
module.exports = Word