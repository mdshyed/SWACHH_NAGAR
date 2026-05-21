const Blog = require('../models/Blog.model');
const slugify = require('../utils/slugify');
const { uploadImage } = require('../services/image.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { paginate, paginatedResponse } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const getAll = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { category, tag } = req.query;
  const query = { status: 'published' };
  if (category) query.category = category;
  if (tag) query.tags = tag;

  const [blogs, total] = await Promise.all([
    Blog.find(query).populate('author', 'name avatar').sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(query),
  ]);
  res.json(new ApiResponse(200, paginatedResponse(blogs, total, page, limit)));
});

const getBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).populate('author', 'name avatar');
  if (!blog) throw new ApiError(404, 'Blog post not found');
  blog.views += 1;
  await blog.save();
  res.json(new ApiResponse(200, blog));
});

const create = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, tags } = req.body;
  const slug = `${slugify(title.en)}-${Date.now()}`;

  let coverImage;
  if (req.file) {
    coverImage = await uploadImage(req.file.buffer, 'blogs');
  }

  const blog = await Blog.create({ title, content, excerpt, category, tags: tags || [], slug, author: req.user._id, coverImage });
  res.status(201).json(new ApiResponse(201, blog, 'Blog post created'));
});

const update = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) throw new ApiError(404, 'Blog not found');
  res.json(new ApiResponse(200, blog, 'Blog updated'));
});

const publish = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, { status: 'published', publishedAt: new Date() }, { new: true });
  if (!blog) throw new ApiError(404, 'Blog not found');
  res.json(new ApiResponse(200, blog, 'Blog published'));
});

const toggleLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, 'Blog not found');

  const idx = blog.likes.indexOf(req.user._id);
  if (idx === -1) { blog.likes.push(req.user._id); blog.likeCount += 1; }
  else { blog.likes.splice(idx, 1); blog.likeCount -= 1; }
  await blog.save();

  res.json(new ApiResponse(200, { likeCount: blog.likeCount, liked: idx === -1 }));
});

module.exports = { getAll, getBySlug, create, update, publish, toggleLike };
