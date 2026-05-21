const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { en: { type: String, required: true }, hi: String },
    slug: { type: String, unique: true, index: true },
    excerpt: { en: String, hi: String },
    content: { en: { type: String, required: true }, hi: String },
    coverImage: { url: String, publicId: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    category: { type: String, enum: ['tips', 'news', 'awareness', 'success_story'], default: 'awareness' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    publishedAt: Date,
  },
  { timestamps: true }
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

module.exports = mongoose.model('Blog', blogSchema);
