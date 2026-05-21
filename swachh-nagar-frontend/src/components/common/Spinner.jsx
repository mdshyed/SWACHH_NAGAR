const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10', xl: 'h-16 w-16' };

const Spinner = ({ size = 'md', className = '' }) => (
  <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 ${sizes[size]} ${className}`} role="status" aria-label="Loading" />
);

export default Spinner;
