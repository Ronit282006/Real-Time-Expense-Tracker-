import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
        <Outlet />
      </main>
    </div>
  );
}
