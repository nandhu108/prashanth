'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/** One rating+comment per registration, submitted via the attendee's own ticket link. */
const FeedbackSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
