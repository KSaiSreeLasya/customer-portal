import { User } from '../types';
import AdminPanel from './AdminPanel';
import CustomerPanel from './CustomerPanel';

export default function Dashboard({ user, activeTab }: { user: User; activeTab: string }) {
  const token = localStorage.getItem('token') || '';

  return (
    <div>
      {user.role === 'admin' ? <AdminPanel activeTab={activeTab} /> : <CustomerPanel user={user} token={token} />}
    </div>
  );
}
