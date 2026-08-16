import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }} className="px-4 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
