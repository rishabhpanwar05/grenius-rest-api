'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const ArticleSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	imagePath:{
		type: String
	},
	desc:{
		type: String,
		required: true
	}
});

ArticleSchema.plugin(mongooseApiQuery)
ArticleSchema.plugin(createdModified, { index: true })

const Article = mongoose.model('Article', ArticleSchema)
module.exports = Article