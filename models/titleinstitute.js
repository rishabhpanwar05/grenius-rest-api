'use strict'

const mongoose = require('mongoose'),
	  mongooseApiQuery = require('mongoose-api-query'),
      createdModified = require('mongoose-createdmodified').createdModifiedPlugin

const TitleinstituteSchema = new mongoose.Schema({
	name: {
		type: String
	},
	url:{
		type: String
	},
	imagePath:{
		type: String
	},
	location:{
		type: String
	}
});

TitleinstituteSchema.plugin(mongooseApiQuery)
TitleinstituteSchema.plugin(createdModified, { index: true })

const Titleinstitute = mongoose.model('Titleinstitute', TitleinstituteSchema)
module.exports = Titleinstitute