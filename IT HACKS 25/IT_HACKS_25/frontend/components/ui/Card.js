// frontend/components/ui/Card.js
const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default Card;
