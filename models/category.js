'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const CategorySchema = new mongoose.Schema({
	sno: {
		type: String
	},
	category: {
		type: String
	},
	synonym: {
		type: String
	},
	meaning: {
		type: String
	}
});

CategorySchema.plugin(mongooseApiQuery)
CategorySchema.plugin(createdModified, { index: true })

const Category = mongoose.model('Category', CategorySchema)
module.exports = Category