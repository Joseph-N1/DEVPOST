// frontend/components/ui/Loader.js
const Loader = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center gap-3">
      {/* fixed size to avoid Tailwind dynamic class issues */}
      <div className="animate-spin rounded-full border-2 border-b-transparent h-6 w-6" />
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

export default Loader;
