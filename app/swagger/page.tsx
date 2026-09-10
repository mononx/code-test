'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p style={{ padding: '20px' }}>Loading API Documentation...</p>,
});

export default function SwaggerPage() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px' }}>
      <SwaggerUI url="/api/doc" />
    </div>
  );
}