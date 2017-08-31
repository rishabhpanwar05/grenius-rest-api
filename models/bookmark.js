'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const BookmarkSchema = new mongoose.Schema({
	userId: {
		type: String
	},
	words:{
		type: []}
});

BookmarkSchema.plugin(mongooseApiQuery)
BookmarkSchema.plugin(createdModified, { index: true })

const Bookmark = mongoose.model('Bookmark', BookmarkSchema)
module.exports = Bookmark