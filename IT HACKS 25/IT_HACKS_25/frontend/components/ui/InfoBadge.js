// frontend/components/ui/InfoBadge.js
const InfoBadge = ({ label, value, color = 'gray' }) => {
  const palette = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${palette[color] || palette.gray}`}>
      <strong className="mr-1">{label}:</strong>
      <span>{value}</span>
    </span>
  );
};

export default InfoBadge;
