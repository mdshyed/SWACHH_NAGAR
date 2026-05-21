import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blogs/${slug}`).then((r) => setBlog(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-16"><Spinner size="xl" /></div></div>;
  if (!blog) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-16"><p className="text-gray-500">Post not found.</p><Link to="/blog" className="btn-primary mt-4">Back to Blog</Link></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">← Back to Blog</Link>
        <div className="card">
          {blog.coverImage?.url && <img src={blog.coverImage.url} alt={blog.title?.en} className="w-full h-56 object-cover rounded-xl mb-6" />}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">{blog.category}</span>
            <span className="text-xs text-gray-400">{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{blog.title?.en}</h1>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: blog.content?.en }} />
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
