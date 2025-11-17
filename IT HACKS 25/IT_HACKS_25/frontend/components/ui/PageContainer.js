// frontend/components/ui/PageContainer.js
export default function PageContainer({ children, wide = false }) {
  // wide=false uses max-w-4xl for focused content, wide=true uses max-w-7xl
  const base = wide ? "max-w-7xl" : "max-w-4xl";
  return (
    <div className={`${base} mx-auto w-full px-4 sm:px-6 lg:px-8`}>
      {children}
    </div>
  );
}
