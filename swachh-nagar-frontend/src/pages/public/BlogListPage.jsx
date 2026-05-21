import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const BlogCard = ({ blog }) => (
  <Link to={`/blog/${blog.slug}`} className="card hover:shadow-card-hover transition-shadow block group">
    {blog.coverImage?.url && (
      <img src={blog.coverImage.url} alt={blog.title?.en} className="w-full h-40 object-cover rounded-lg mb-4 group-hover:opacity-90 transition-opacity" />
    )}
    <div className="flex items-center gap-2 mb-2">
      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">{blog.category}</span>
      <span className="text-xs text-gray-400">{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
    </div>
    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{blog.title?.en}</h3>
    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{blog.excerpt?.en}</p>
    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
      <span>👁️ {blog.views}</span>
      <span>❤️ {blog.likeCount}</span>
    </div>
  </Link>
);

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs?limit=12').then((r) => setBlogs(r.data.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Awareness & Blog</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Learn about cleanliness initiatives, government schemes, and how you can make a difference in your city.</p>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          blogs.length === 0 ? (
            <div className="card text-center py-16"><div className="text-4xl mb-3">📝</div><p className="text-gray-500">No articles published yet.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BlogListPage;
