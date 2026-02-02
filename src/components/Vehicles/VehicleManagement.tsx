import React, { useState, useEffect } from 'react';
import { Plus, Search, Car, Edit, Trash2, X, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../lib/permissions';
import PermissionGuard from '../Layout/PermissionGuard';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  dailyRate: number;
  dateOut?: string;
  timeOut?: string;
  dateIn?: string;
  timeIn?: string;
  createdAt: string;
  status?: 'Available' | 'Booked' | 'Maintenance';
}

const VEHICLE_STATUSES = ['Available', 'Booked', 'Maintenance'] as const;
type VehicleStatus = typeof VEHICLE_STATUSES[number];

export default function VehicleManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // New: State for tracking which vehicle is updating status, and the new status being applied
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data);
      } else {
        setError('Failed to fetch vehicles');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const formatTime = (value?: string) => {
    if (!value) return 'N/A';
    return value;
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      await api.delete(`/vehicles/${selectedVehicle._id}`);
      setVehicles(prev => prev.filter(vehicle => vehicle._id !== selectedVehicle._id));
      setShowDeleteConfirm(false);
      setShowDetailsModal(false);
      setSelectedVehicle(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleVehicleAdded = () => {
    fetchVehicles(); // Refresh the list
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleVehicleEdited = () => {
    setShowEditModal(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  // NEW: Function to update a vehicle's status
  const handleChangeVehicleStatus = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
    setStatusLoadingId(vehicle._id);
    try {
      const response = await api.patch(`/vehicles/${vehicle._id}/status`, { status: newStatus });
      if (response.data.success) {
        setVehicles(prev =>
          prev.map(v =>
            v._id === vehicle._id
              ? { ...v, status: newStatus }
              : v
          )
        );
      } else {
        setError(response.data?.message || 'Failed to update vehicle status');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update vehicle status.');
    } finally {
      setStatusLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Friendly success/error/toast notifications could be added here */}

      {showAddModal && (
        <AddVehicleForm
          onClose={() => setShowAddModal(false)}
          onVehicleAdded={handleVehicleAdded}
        />
      )}

      {showEditModal && selectedVehicle && (
        <EditVehicleForm
          vehicle={selectedVehicle}
          onClose={() => setShowEditModal(false)}
          onVehicleEdited={handleVehicleEdited}
        />
      )}

      {showDetailsModal && selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showDeleteConfirm && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Delete Vehicle</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </span>
                ? <br /> <span className="text-red-500">This action cannot be undone.</span>
              </p>
              <div className="mt-5 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVehicle}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
              <Car className="w-6 h-6 text-white" />
            </div>
            Fleet Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive vehicle fleet control with real-time status tracking and management tools</p>
        </div>
        <PermissionGuard module="vehicles" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-3" />
            <span className="font-semibold">Add New Vehicle</span>
          </button>
        </PermissionGuard>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
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
                placeholder="Search vehicles by make, model, license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                aria-label="Search vehicles"
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{vehicles.length}</div>
              <div className="text-sm text-gray-500">Total Vehicles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold text-sm uppercase tracking-wide">Available</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {vehicles.filter(v => v.status === 'Available').length}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <Car className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-semibold text-sm uppercase tracking-wide">Booked</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {vehicles.filter(v => v.status === 'Booked').length}
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 font-semibold text-sm uppercase tracking-wide">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">
                {vehicles.filter(v => v.status === 'Maintenance').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vehicle Information</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Specifications</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rental Period</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Daily Rate</th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                          <Car className="w-6 h-6 text-blue-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-semibold text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{vehicle.licensePlate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{vehicle.color || <span className="text-gray-400 italic">Not specified</span>}</div>
                      <div className="text-sm text-gray-500">Year: {vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border
                            ${
                              vehicle.status === 'Available'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : vehicle.status === 'Booked'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`
                          }
                        >
                          {vehicle.status || 'Available'}
                        </span>
                        <PermissionGuard module="vehicles" action="update">
                          <select
                            className={`text-xs rounded-lg border-gray-300 py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm
                            ${statusLoadingId === vehicle._id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-blue-400'}
                            `}
                            value={vehicle.status || 'Available'}
                            onChange={e => handleChangeVehicleStatus(vehicle, e.target.value as VehicleStatus)}
                            disabled={statusLoadingId === vehicle._id}
                            aria-label="Change vehicle status"
                          >
                            {VEHICLE_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </PermissionGuard>
                        {statusLoadingId === vehicle._id && (
                          <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">Out: {vehicle.dateOut ? formatDate(vehicle.dateOut) : <span className="text-gray-400 italic">Not set</span>}</div>
                        <div className="text-gray-500">{vehicle.timeOut ? formatTime(vehicle.timeOut) : <span className="text-gray-400 italic">--:--</span>}</div>
                        <div className="font-medium mt-1">In: {vehicle.dateIn ? formatDate(vehicle.dateIn) : <span className="text-gray-400 italic">Not set</span>}</div>
                        <div className="text-gray-500">{vehicle.timeIn ? formatTime(vehicle.timeIn) : <span className="text-gray-400 italic">--:--</span>}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">KSH {vehicle.dailyRate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowDetailsModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium"
                          title="View vehicle details"
                          aria-label="View vehicle"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditClick(vehicle)}
                          className="inline-flex items-center p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-yellow-200"
                          title="Edit vehicle"
                          aria-label="Edit vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle)}
                          className="inline-flex items-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-200"
                          title="Delete vehicle"
                          aria-label="Delete vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No vehicles found</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria or check for typos.'
              : 'Start building your fleet by adding your first vehicle using the Add New Vehicle button above.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Add Vehicle Form Component
function AddVehicleForm({
  onClose,
  onVehicleAdded,
}: {
  onClose: () => void;
  onVehicleAdded?: () => void;
}) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    dateOut: '',
    timeOut: '',
    dateIn: '',
    timeIn: '',
    dailyRate: 0,
    status: 'Available' as VehicleStatus, // Added status default for Add
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' ? +value : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.licensePlate ||
      !formData.dailyRate
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/vehicles', formData);

      if (response.data.success) {
        onClose();
        if (onVehicleAdded) {
          onVehicleAdded();
        }
      } else {
        setError(response.data.message || 'Failed to add vehicle.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Add New Vehicle
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Vehicle Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="make" className="block text-sm font-semibold text-gray-700 mb-2">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    placeholder="e.g., Toyota"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-semibold text-gray-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    placeholder="e.g., Hiace"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    placeholder="e.g., White"
                  />
                </div>
              </div>
            </div>

            {/* Registration & Pricing */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                </div>
                Registration & Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="licensePlate" className="block text-sm font-semibold text-gray-700 mb-2">
                    License Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg uppercase"
                    placeholder="e.g., KDG 530X"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dailyRate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Daily Rate (KSH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="dailyRate"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    placeholder="e.g., 5000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rental Schedule */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Rental Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dateOut" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Out
                  </label>
                  <input
                    type="date"
                    id="dateOut"
                    name="dateOut"
                    value={formData.dateOut}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="timeOut" className="block text-sm font-semibold text-gray-700 mb-2">
                    Time Out
                  </label>
                  <input
                    type="time"
                    id="timeOut"
                    name="timeOut"
                    value={formData.timeOut}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="dateIn" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date In
                  </label>
                  <input
                    type="date"
                    id="dateIn"
                    name="dateIn"
                    value={formData.dateIn}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="timeIn" className="block text-sm font-semibold text-gray-700 mb-2">
                    Time In
                  </label>
                  <input
                    type="time"
                    id="timeIn"
                    name="timeIn"
                    value={formData.timeIn}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Status */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Vehicle Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    required
                  >
                    {VEHICLE_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <X className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${loading && 'opacity-60 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Adding Vehicle...
                  </>
                ) : (
                  <>
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add Vehicle
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

// Edit Vehicle Form Component -- User Friendly Modal
function EditVehicleForm({
  vehicle,
  onClose,
  onVehicleEdited,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onVehicleEdited?: () => void;
}) {
  // Clone vehicle values as state
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color || '',
    licensePlate: vehicle.licensePlate,
    dateOut: vehicle.dateOut || '',
    timeOut: vehicle.timeOut || '',
    dateIn: vehicle.dateIn || '',
    timeIn: vehicle.timeIn || '',
    dailyRate: vehicle.dailyRate,
    status: vehicle.status || 'Available', // include status for edits
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' ? +value : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.licensePlate ||
      !formData.dailyRate
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put(`/vehicles/${vehicle._id}`, formData);

      if (response.data.success) {
        onClose();
        if (onVehicleEdited) {
          onVehicleEdited();
        }
      } else {
        setError(response.data.message || 'Failed to update vehicle.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Edit className="h-6 w-6 mr-2 text-yellow-600" /> Edit Vehicle
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="White"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                  disabled // Editing license plate is typically restricted
                />
                <span className="text-xs text-gray-400 italic">License plate can not be changed.</span>
              </div>
              <div>
                <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate (KSH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="dailyRate"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Out
                </label>
                <input
                  type="date"
                  id="dateOut"
                  name="dateOut"
                  value={formData.dateOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label htmlFor="timeOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Out
                </label>
                <input
                  type="time"
                  id="timeOut"
                  name="timeOut"
                  value={formData.timeOut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Date In
                </label>
                <input
                  type="date"
                  id="dateIn"
                  name="dateIn"
                  value={formData.dateIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label htmlFor="timeIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <input
                  type="time"
                  id="timeIn"
                  name="timeIn"
                  value={formData.timeIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* NEW: Status select */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  {VEHICLE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100"
              >
                <X className="-ml-1 mr-2 h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${loading && 'opacity-60 cursor-not-allowed'}`}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Edit className="h-4 w-4 mr-1" /> Save Changes
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

// Vehicle Details Modal Component
function VehicleDetailsModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Car className="mr-2 h-6 w-6 text-blue-600" /> Vehicle Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
                <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Status:</span>
                <span className="text-gray-600">{vehicle.status || 'Available'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Color:</span>
                <span className="text-gray-600">{vehicle.color || <span className="italic text-gray-400">N/A</span>}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 text-sm font-medium mr-2 w-20">Rate:</span>
                <span className="text-gray-600">KSH {vehicle.dailyRate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {vehicle.dateOut && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-600">
                    Out: {new Date(vehicle.dateOut).toLocaleDateString()} {vehicle.timeOut}
                  </span>
                </div>
              )}
              {vehicle.dateIn && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-600">
                    In: {new Date(vehicle.dateIn).toLocaleDateString()} {vehicle.timeIn}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Added on</span>
                <span>{new Date(vehicle.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}