import { User } from '../types';
import AdminPanel from './AdminPanel';
import CustomerPanel from './CustomerPanel';

export default function Dashboard({ user }: { user: User }) {
  return (
    <div>
      {user.role === 'admin' ? <AdminPanel /> : <CustomerPanel />}
    </div>
  );
}
