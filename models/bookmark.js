'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const BookmarkSchema = new mongoose.Schema({
	userId: {
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
	},
	imagePath:{
		type: String
	},
	hf:{
		type:String
	},
	translated:{
		type:String
	}
});

BookmarkSchema.plugin(mongooseApiQuery)
BookmarkSchema.plugin(createdModified, { index: true })

const Bookmark = mongoose.model('Bookmark', BookmarkSchema)
module.exports = Bookmark