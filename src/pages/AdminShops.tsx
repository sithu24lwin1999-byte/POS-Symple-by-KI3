import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, Button, Badge, Input } from '@/components/ui';
import { Search, Plus, MoreVertical, Filter, X, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc as firestoreDoc, deleteDoc } from 'firebase/firestore';

export default function AdminShops() {
  const location = useLocation();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [newShop, setNewShop] = useState({ name: '', owner: '', phone: '', plan: '30000 MMK' });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "shops"));
      const shopsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(shopsData);
    } catch (err) {
      console.error("Error fetching shops: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setShowCreateModal(true);
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleCreateShop = async () => {
    if (!newShop.name || !newShop.owner) return;
    
    try {
      const shopData = {
        ...newShop,
        status: 'ACTIVE',
        expiry: '2027-12-31',
        ownerId: 'default-owner-id' // Ideally from auth or user selection
      };
      const docRef = await addDoc(collection(db, "shops"), shopData);
      setShops([{ id: docRef.id, ...shopData }, ...shops]);
      setShowCreateModal(false);
      setNewShop({ name: '', owner: '', phone: '', plan: '30000 MMK' });
    } catch (err) {
      console.error("Error adding shop: ", err);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(firestoreDoc(db, "shops", id), { status: newStatus });
      setShops(shops.map(shop => shop.id === id ? { ...shop, status: newStatus } : shop));
      setActiveMenu(null);
    } catch (err) {
      console.error("Error updating status: ", err);
    }
  };

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Shop Management</h1>
          <p className="text-slate-500">View and manage all tenant shops on the platform.</p>
        </div>
        <Button 
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" /> Add New Shop
        </Button>
      </div>

      <Card className="p-0 overflow-hidden flex flex-col bg-slate-50 border-none shadow-none">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 w-72 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search shops or owners..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 text-slate-600 border-slate-200 bg-white shadow-sm">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
             </div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Shop Details</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{shop.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">ID: {shop.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{shop.owner}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{shop.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{shop.plan}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Exp: {shop.expiry}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={shop.status === 'ACTIVE' ? 'success' : shop.status === 'EXPIRED' ? 'danger' : 'warning'} className="uppercase text-[10px] tracking-wider px-2 py-0.5">
                      {shop.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === shop.id ? null : shop.id)}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeMenu === shop.id && (
                      <div className="absolute right-8 top-10 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-10 overflow-hidden">
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          onClick={() => changeStatus(shop.id, 'ACTIVE')}
                        >
                          Set Active
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          onClick={() => changeStatus(shop.id, 'SUSPENDED')}
                        >
                          Suspend
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete Shop
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredShops.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No shops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-semibold text-slate-800">Add New Shop</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                <Input 
                  placeholder="e.g. City Mart Branch 4" 
                  value={newShop.name}
                  onChange={(e) => setNewShop({...newShop, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                <Input 
                  placeholder="e.g. Kyaw Zin" 
                  value={newShop.owner}
                  onChange={(e) => setNewShop({...newShop, owner: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <Input 
                  placeholder="e.g. 09-123456789" 
                  value={newShop.phone}
                  onChange={(e) => setNewShop({...newShop, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newShop.plan}
                  onChange={(e) => setNewShop({...newShop, plan: e.target.value})}
                >
                  <option value="30000 MMK">30,000 MMK / Month (Basic)</option>
                  <option value="50000 MMK">50,000 MMK / Month (Pro)</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="bg-white">
                Cancel
              </Button>
              <Button onClick={handleCreateShop} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                <CheckCircle2 className="w-4 h-4" /> Create Shop
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
