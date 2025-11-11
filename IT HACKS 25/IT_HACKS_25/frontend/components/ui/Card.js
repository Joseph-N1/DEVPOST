// frontend/components/ui/Card.js
export default function Card({ children, className = '' }) {
  return (
    <div className={`responsive-card card-flex ${className}`}>
      {children}
    </div>
  );
}
