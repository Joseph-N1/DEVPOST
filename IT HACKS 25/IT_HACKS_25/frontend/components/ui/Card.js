// frontend/components/ui/Card.js
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 transition-all duration-200 hover:shadow-lg ${className}`}>
      {children}
    </div>
  );
}
