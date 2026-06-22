import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, UserCheck, ShieldAlert, Edit2, 
  Trash2, X, Shield, Landmark, Scale, HelpCircle, KeyRound
} from 'lucide-react';

const DEMO_USERS = [
  { id: '1', name: 'System Administrator', email: 'admin@company.com', role: 'admin', department: 'IT', joined: 'Jun 12, 2025' },
  { id: '2', name: 'Sarah Connor', email: 'sarah.c@company.com', role: 'hr_admin', department: 'HR', joined: 'Aug 04, 2025' },
  { id: '3', name: 'John Doe', email: 'john.doe@company.com', role: 'manager', department: 'Finance', joined: 'Sep 21, 2025' },
  { id: '4', name: 'Alice Smith', email: 'alice.s@company.com', role: 'employee', department: 'Marketing', joined: 'Nov 11, 2025' },
  { id: '5', name: 'Bob Johnson', email: 'bob.j@company.com', role: 'employee', department: 'Engineering', joined: 'Jan 15, 2026' }
];

export default function UserManagement() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', department: 'general' });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const added = {
      id: Date.now().toString(),
      ...newUser,
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    setUsers(prev => [...prev, added]);
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'employee', department: 'general' });
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to revoke this user\'s enterprise access?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (role.endsWith('admin')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (role === 'manager') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full p-6 md:p-10 relative z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">User Directory</h1>
            </div>
            <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">Administer corporate access and Department permissions (RBAC).</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
              />
            </div>
            <button 
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/15 bg-white/[0.01] text-[10px] font-bold text-[#8b92a5] uppercase tracking-widest">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Access Role</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-300">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-4 px-6 text-slate-400 font-semibold">{u.department}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-widest ${getRoleColor(u.role)}`}>
                        <Shield className="w-3 h-3" />
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{u.joined}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddUser(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              ></motion.div>

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b1020] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-md font-black tracking-tight text-white uppercase flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-purple-400" />
                    Register New Account
                  </h3>
                  <button 
                    onClick={() => setShowAddUser(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddUser}>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={newUser.name}
                        onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Sarah Connor"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500/50 text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Corporate Email</label>
                      <input 
                        required
                        type="email" 
                        value={newUser.email}
                        onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="sarah.c@company.com"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500/50 text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Department</label>
                      <input 
                        required
                        type="text" 
                        value={newUser.department}
                        onChange={e => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="HR"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500/50 text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Access Role</label>
                      <select 
                        value={newUser.role}
                        onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-[#0a0f1d] border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500/50 text-white"
                      >
                        <option value="employee">Employee (Standard View)</option>
                        <option value="manager">Manager (Read & Upload)</option>
                        <option value="hr_admin">HR Administrator</option>
                        <option value="legal_admin">Legal Administrator</option>
                        <option value="admin">System Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white/10 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
