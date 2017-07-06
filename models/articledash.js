'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const ArticleDashSchema = new mongoose.Schema({
	title: {
		type: String
	},
	imagePath:{
		type: String
	},
	desc:{
		type: String
	}
});

ArticleDashSchema.plugin(mongooseApiQuery)
ArticleDashSchema.plugin(createdModified, { index: true })

const ArticleDash = mongoose.model('ArticleDash', ArticleDashSchema)
module.exports = ArticleDash