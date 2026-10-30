import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, Edit2, 
  Trash2, X, Shield, KeyRound, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet 
} from 'lucide-react';
import { apiCall, API_BASE } from '../utils/api';
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

  const [exportingUsers, setExportingUsers] = useState(false);

  const handleExportUsers = async () => {
    try {
      setExportingUsers(true);
      const downloadUrl = `${API_BASE}/users/export?format=csv`;
      const token = localStorage.getItem('enterprise_token');
      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("User directory export failed");
      const blob = await res.blob();
      const filename = `VeriRAG_User_Directory_${new Date().toISOString().slice(0,10)}.csv`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to export user directory: " + err.message);
    } finally {
      setExportingUsers(false);
    }
  };

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
      alert("You cannot revoke access for your own active session.");
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

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    if (role?.endsWith('admin') || role === 'manager') {
      return 'bg-secondary text-foreground border-border';
    }
    return 'bg-secondary text-muted-foreground border-border';
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              User Management & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Enterprise directory, role-based access privileges, department scopes, and authentication records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by name, email, or role..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>
            <button
              onClick={handleExportUsers}
              disabled={exportingUsers}
              className="px-3.5 py-2 bg-card border border-border hover:bg-secondary text-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Download full enterprise user directory report as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span>{exportingUsers ? 'Exporting...' : 'Export Directory (CSV)'}</span>
            </button>
            <button 
              onClick={() => { setErrorMsg(''); setShowAddUser(true); }}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs">Loading enterprise user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground space-y-2">
              <Shield className="w-8 h-8 opacity-40 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No users match your criteria</p>
              <p className="text-xs">Try searching for a different name, role, or email.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Corporate Email</th>
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-5">Access Role</th>
                    <th className="py-3 px-5">Created</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-foreground flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-secondary border border-border text-foreground flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{u.name}</div>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] text-primary font-medium">(Active Session)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground font-mono">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[11px] font-medium border border-border">
                          {u.department || 'general'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                          <Shield className="w-3 h-3" />
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground text-[11px]">{u.created_at || 'Active'}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => { setErrorMsg(''); setEditingUser({ ...u }); }}
                            title="Edit Permissions"
                            className="p-1 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            title="Revoke Access"
                            disabled={u.id === currentUser?.id}
                            className={`p-1 rounded-md border transition-colors ${
                              u.id === currentUser?.id 
                                ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground' 
                                : 'border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10'
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
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowAddUser(false)}
                className="absolute inset-0 bg-black/60" 
              />

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-xl relative z-10"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <span>Register Enterprise User</span>
                  </h3>
                  <button onClick={() => setShowAddUser(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddUser}>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        value={newUser.name}
                        onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Corporate Email</label>
                      <input 
                        required 
                        type="email" 
                        value={newUser.email}
                        onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="name@company.com"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Initial Password</label>
                      <input 
                        required 
                        type="password" 
                        value={newUser.password}
                        onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Department</label>
                        <select 
                          value={newUser.department}
                          onChange={e => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                        >
                          <option value="general">General</option>
                          <option value="hr">HR</option>
                          <option value="finance">Finance</option>
                          <option value="legal">Legal</option>
                          <option value="it">IT Support</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Access Role (RBAC)</label>
                        <select 
                          value={newUser.role}
                          onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="hr_admin">HR Admin</option>
                          <option value="legal_admin">Legal Admin</option>
                          <option value="finance_admin">Finance Admin</option>
                          <option value="it_admin">IT Admin</option>
                          <option value="admin">Superadmin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-secondary/40 border-t border-border flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
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
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-black/60" 
              />

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-xl relative z-10"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Modify Permissions: {editingUser.name}</span>
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateRole}>
                  <div className="p-4 space-y-3.5">
                    <div className="p-3 bg-secondary/50 rounded-lg border border-border text-xs text-muted-foreground">
                      <p><strong className="text-foreground">Email:</strong> {editingUser.email}</p>
                      <p className="mt-0.5"><strong className="text-foreground">Current Role:</strong> {editingUser.role}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Assigned Department</label>
                      <select 
                        value={editingUser.department || 'general'}
                        onChange={e => setEditingUser(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                      >
                        <option value="general">General</option>
                        <option value="hr">HR</option>
                        <option value="finance">Finance</option>
                        <option value="legal">Legal</option>
                        <option value="it">IT Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Access Role</label>
                      <select 
                        value={editingUser.role}
                        onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                      >
                        <option value="employee">Employee (Public/General Workspace)</option>
                        <option value="manager">Manager (Read & Upload Department Docs)</option>
                        <option value="hr_admin">HR Admin (Full HR & Employee Scope)</option>
                        <option value="legal_admin">Legal Admin (Contracts & Compliance)</option>
                        <option value="finance_admin">Finance Admin (Financial Statements)</option>
                        <option value="it_admin">IT Admin (Infrastructure & Architecture)</option>
                        <option value="admin">System Superadmin (Unrestricted Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-secondary/40 border-t border-border flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
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
