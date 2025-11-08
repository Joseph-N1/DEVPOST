import React from 'react';
import SectionTitle from './SectionTitle';

export default function DashboardSection({ title, subtitle, children }) {
  return (
    <section className="space-y-4">
      {title || subtitle ? (
        <SectionTitle title={title} subtitle={subtitle} />
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
