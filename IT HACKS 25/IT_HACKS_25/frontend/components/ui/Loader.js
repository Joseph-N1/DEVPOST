// frontend/components/ui/Loader.js
const Loader = ({ size = 6, label = 'Loading...' }) => {
  const dim = size; // tailwind h/w units (eg 6 => h-6 w-6)
  return (
    <div className="flex items-center gap-3">
      <div className={`animate-spin rounded-full border-2 border-b-transparent h-${dim} w-${dim}`} />
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

export default Loader;
