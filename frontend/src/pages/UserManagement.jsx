import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, Edit2, 
  Trash2, X, Shield, KeyRound, Loader2, CheckCircle2, AlertTriangle, Building, Lock
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'employee', 
    department: 'general' 
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiCall('GET', '/users');
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setErrorMsg(err.message || 'Failed to fetch enterprise users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      const added = await apiCall('POST', '/users', newUser);
      setUsers(prev => [added, ...prev]);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'employee', department: 'general' });
      triggerSuccess(`Successfully registered ${added.name}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      const updated = await apiCall('PATCH', `/users/${editingUser.id}`, {
        role: editingUser.role,
        department: editingUser.department
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingUser(null);
      triggerSuccess(`Updated permissions for ${updated.name}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (window.confirm(`Revoke enterprise access for ${userToDelete.name} (${userToDelete.email})?`)) {
      try {
        await apiCall('DELETE', `/users/${userToDelete.id}`);
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        triggerSuccess(`Revoked access for ${userToDelete.name}`);
      } catch (err) {
        alert(err.message || 'Failed to revoke user access');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    if (role.endsWith('admin')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
    if (role === 'manager') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Superadmin RBAC Directory</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage enterprise access privileges, departments, and live authentication credentials.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users or roles..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/70"
              />
            </div>
            <button 
              onClick={() => { setErrorMsg(''); setShowAddUser(true); }}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Loading enterprise users from database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground space-y-2">
              <Shield className="w-10 h-10 opacity-40 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No users match your criteria</p>
              <p className="text-xs">Try searching for a different name, role, or email.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-5">Name</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">Access Role</th>
                    <th className="py-3.5 px-5">Created</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-card-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {u.id === currentUser?.id && (
                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">(Current Session)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground font-mono">{u.email}</td>
                      <td className="py-3.5 px-5 text-card-foreground font-medium uppercase tracking-wide text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                          {u.department || 'general'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getRoleColor(u.role)}`}>
                          <Shield className="w-3 h-3" />
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground text-[11px]">{u.created_at || 'Existing'}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => { setErrorMsg(''); setEditingUser({ ...u }); }}
                            title="Edit Permissions"
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            title="Revoke Access"
                            disabled={u.id === currentUser?.id}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.id === currentUser?.id 
                                ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground' 
                                : 'border-destructive/30 hover:bg-destructive/10 text-destructive'
                            }`}
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
          )}
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowAddUser(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-xl relative z-10">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    Register Enterprise Account
                  </h3>
                  <button onClick={() => setShowAddUser(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddUser}>
                  <div className="p-5 space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                      <input required type="text" value={newUser.name}
                        onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Rachel Green"
                        className="w-full mt-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Corporate Email</label>
                      <input required type="email" value={newUser.email}
                        onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="rachel@company.com"
                        className="w-full mt-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                      <input required type="password" value={newUser.password}
                        onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Temporary password..."
                        className="w-full mt-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
                        <select value={newUser.department}
                          onChange={e => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full mt-1 px-2.5 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground">
                          <option value="general">General</option>
                          <option value="hr">HR</option>
                          <option value="finance">Finance</option>
                          <option value="legal">Legal</option>
                          <option value="it">IT & Tech</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Access Role (RBAC)</label>
                        <select value={newUser.role}
                          onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full mt-1 px-2.5 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground">
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="hr_admin">HR Admin</option>
                          <option value="legal_admin">Legal Admin</option>
                          <option value="finance_admin">Finance Admin</option>
                          <option value="it_admin">IT Admin</option>
                          <option value="admin">System Superadmin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 border-t border-border flex justify-end gap-2.5">
                    <button type="button" onClick={() => setShowAddUser(false)}
                      className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2">
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Create User
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Role Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-xl relative z-10">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Modify Permissions: {editingUser.name}
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateRole}>
                  <div className="p-5 space-y-4">
                    <div className="p-3 bg-secondary/40 rounded-xl border border-border text-xs text-muted-foreground">
                      <p><strong className="text-foreground">Email:</strong> {editingUser.email}</p>
                      <p className="mt-1"><strong className="text-foreground">Current Level:</strong> {editingUser.role}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Department</label>
                      <select value={editingUser.department || 'general'}
                        onChange={e => setEditingUser(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground">
                        <option value="general">General</option>
                        <option value="hr">HR</option>
                        <option value="finance">Finance</option>
                        <option value="legal">Legal</option>
                        <option value="it">IT & Tech</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Access Role</label>
                      <select value={editingUser.role}
                        onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground">
                        <option value="employee">Employee (Public/General Docs)</option>
                        <option value="manager">Manager (Read & Upload Dept Docs)</option>
                        <option value="hr_admin">HR Admin (Full HR & Employee Access)</option>
                        <option value="legal_admin">Legal Admin (Contracts & Compliance)</option>
                        <option value="finance_admin">Finance Admin (Financial Statements)</option>
                        <option value="it_admin">IT Admin (Architecture & Infrastructure)</option>
                        <option value="admin">System Superadmin (Unrestricted Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 border-t border-border flex justify-end gap-2.5">
                    <button type="button" onClick={() => setEditingUser(null)}
                      className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2">
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Permissions
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
