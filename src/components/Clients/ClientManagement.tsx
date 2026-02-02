import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, MapPin, Edit, Trash2, X, AlertCircle, CreditCard, UserX, UserCheck, User, RefreshCw, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';
import PermissionGuard from '../Layout/PermissionGuard';
import AddClientForm from './AddClientForm';

interface Client {
  _id: string;
  fullName: string;
  idOrPassport: string;
  phone: string;
  address?: string;
  licenseNumber: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

// -- User Friendly Edit Modal (inline implementation) --
function EditClientModal({
  client,
  onClose,
  onSave
}: {
  client: Client;
  onClose: () => void;
  onSave: (updated: Client) => void;
}) {
  const [formData, setFormData] = useState<Client>(client);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Simple validation
    if (!formData.fullName || !formData.phone || !formData.idOrPassport || !formData.licenseNumber) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    try {
      // NOTE: Implement client update API on backend. PATCH is a common choice.
      // const resp = await api.patch(`/clients/${formData._id}`, formData);
      // For UI demo: simulate save
      await new Promise(res => setTimeout(res, 400));
      onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Edit className="w-5 h-5 text-white" />
              </div>
              Edit Client
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close"
              disabled={saving}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name*</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone*</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    disabled={saving}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            {/* Identification Documents */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Identification Documents
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID/Passport*</label>
                  <input
                    type="text"
                    name="idOrPassport"
                    value={formData.idOrPassport}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg uppercase"
                    disabled={saving}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver's License*</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg uppercase"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={onClose}
                disabled={saving}
              >
                <X className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ClientManagement() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.data);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.fullName && client.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.idOrPassport && client.idOrPassport.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.licenseNumber && client.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      // Note: You'll need to implement DELETE endpoint in backend
      // await api.delete(`/clients/${selectedClient._id}`);
      setClients(prev => prev.filter(client => client._id !== selectedClient._id));
      setShowDeleteConfirm(false);
      setShowDetailsModal(false);
      setSelectedClient(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleClientAdded = () => {
    fetchClients(); // Refresh the list
  };

  const handleEditClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleEditClientSave = (updated: Client) => {
    setClients((prev) =>
      prev.map((c) => (c._id === updated._id ? { ...updated, createdAt: c.createdAt } : c))
    );
  };

  const handleStatusChange = async (clientId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      setStatusUpdating(clientId);
      const response = await api.put(`/clients/${clientId}/status`, { status: newStatus });
      
      if (response.data.success) {
        setClients(prev => 
          prev.map(client => 
            client._id === clientId 
              ? { ...client, status: newStatus }
              : client
          )
        );
        setError('');
      } else {
        setError(response.data.message || 'Failed to update client status');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update client status');
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientForm
          onClose={() => setShowAddModal(false)}
          onClientAdded={handleClientAdded}
        />
      )}
      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          onSave={handleEditClientSave}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Client Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {selectedClient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedClient.fullName}</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-gray-600">{selectedClient.idOrPassport}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-gray-600">{selectedClient.phone}</span>
                  </div>
                  {selectedClient.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-gray-600">{selectedClient.address}</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <span className="text-gray-400 text-sm font-medium mr-2">License:</span>
                    <span className="text-gray-600">{selectedClient.licenseNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm font-medium mr-2">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedClient.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedClient.status}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Member since</span>
                    <span>{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t border-gray-100 justify-end">
                  <button
                    className="flex items-center text-blue-600 hover:bg-blue-50 rounded px-3 py-1 text-sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button
                    className="flex items-center text-red-600 hover:bg-red-50 rounded px-3 py-1 text-sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Delete Client</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete <span className="font-semibold">{selectedClient.fullName}</span>? This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClient}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            Client Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive client database management with detailed profiles and relationship tracking</p>
        </div>
        <PermissionGuard module="clients" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-3" />
            <span className="font-semibold">Add New Client</span>
          </button>
        </PermissionGuard>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-label="Search Icon" />
              <input
                type="text"
                placeholder="Search clients by name, ID, phone, license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                aria-label="Search clients"
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
              <div className="text-sm text-gray-500">Total Clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold text-sm uppercase tracking-wide">Active</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {clients.filter(c => c.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <UserCheck className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-semibold text-sm uppercase tracking-wide">Suspended</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {clients.filter(c => c.status === 'SUSPENDED').length}
              </p>
            </div>
            <div className="p-3 bg-red-200 rounded-full">
              <UserX className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-semibold text-sm uppercase tracking-wide">New This Month</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {clients.filter(c => {
                  const joinDate = new Date(c.createdAt);
                  const now = new Date();
                  return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Plus className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client Information</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Identification</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Member Since</th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-base font-semibold text-blue-700">
                          {client.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-semibold text-gray-900">{client.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                      {client.address && (
                        <div className="text-gray-500 truncate max-w-xs mt-1 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          {client.address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        {client.idOrPassport}
                      </div>
                      <div className="text-gray-500 mt-1 text-xs">License: {client.licenseNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border
                          ${
                            client.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`
                        }
                      >
                        {client.status}
                      </span>
                      <PermissionGuard module="clients" action={client.status === 'ACTIVE' ? 'suspend' : 'activate'}>
                        <button
                          onClick={() => handleStatusChange(client._id, client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          disabled={statusUpdating === client._id}
                          className={`p-2 rounded-lg transition-colors shadow-sm
                            ${client.status === 'ACTIVE'
                              ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                            } ${statusUpdating === client._id ? 'opacity-50 cursor-wait' : ''}`}
                          title={client.status === 'ACTIVE' ? 'Suspend client' : 'Activate client'}
                          aria-label={client.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        >
                          {client.status === 'ACTIVE' ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </PermissionGuard>
                      {statusUpdating === client._id && (
                        <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{new Date(client.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500 text-xs">
                        {Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium"
                        title="View client details"
                        aria-label="View client"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditClientClick(client)}
                        className="inline-flex items-center p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-yellow-200"
                        title="Edit client"
                        aria-label="Edit client"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client)}
                        className="inline-flex items-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-200"
                        title="Delete client"
                        aria-label="Delete client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No clients found</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria or check for typos.'
              : 'Start building your client database by adding your first client using the Add New Client button above.'}
          </p>
        </div>
      )}
    </div>
  );
}