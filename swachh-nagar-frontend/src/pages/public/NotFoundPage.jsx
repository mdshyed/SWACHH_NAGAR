import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-8xl mb-6">🗑️</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-3">404</h1>
      <p className="text-xl text-gray-600 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-8 max-w-md">Looks like this page ended up in the garbage bin. Let's get you back on track.</p>
      <Link to="/" className="btn-primary px-8 py-3">Go Home</Link>
    </div>
  </div>
);

export default NotFoundPage;
