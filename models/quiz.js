'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const QuizSchema = new mongoose.Schema({
	sno: {
		type: String
	},
	question: {
		type: String
	},
	answer: {
		type: String
	},
	incorrect_1: {
		type: String
	},
	incorrect_2: {
		type: String
	},
	incorrect_3: {
		type: String
	},
	example: {
		type: String
	}
});

QuizSchema.plugin(mongooseApiQuery)
QuizSchema.plugin(createdModified, { index: true })

const Quiz = mongoose.model('Quiz', QuizSchema)
module.exports = Quiz