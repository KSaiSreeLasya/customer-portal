import { User } from '../types';
import AdminPanel from './AdminPanel';
import CustomerPanel from './CustomerPanel';

export default function Dashboard({ user, activeTab }: { user: User; activeTab: string }) {
  return (
    <div>
      {user.role === 'admin' ? <AdminPanel activeTab={activeTab} /> : <CustomerPanel />}
    </div>
  );
}
