import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  X,
  Calendar,
  Car,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import PermissionGuard from "../Layout/PermissionGuard";
import AddBookingForm from "./AddBookingForm";
import EditBookingModal from "./EditBookingModal";
import BookingDetailsModal from "./BookingDetailsModal";

interface Client {
  _id: string;
  fullName: string;
  phone: string;
  address?: string;
}

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  dailyRate: number;
  color?: string;
}

interface Booking {
  _id: string;
  client: Client;
  vehicle?: Vehicle;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Cancelled";
  createdAt: string;
}

const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const BookingManagement: React.FC = () => {

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  // Fetch data
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      if (res.data.success) setBookings(res.data.data);
      else setError("Failed to fetch bookings");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      if (res.data.success) setClients(res.data.data);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      if (res.data.success) setVehicles(res.data.data);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchClients();
    fetchVehicles();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        b.client.fullName.toLowerCase().includes(q) ||
        b.vehicle?.make.toLowerCase().includes(q) ||
        b.vehicle?.model.toLowerCase().includes(q) ||
        b.vehicle?.licensePlate.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!selectedBooking) return;
    try {
      await api.delete(`/bookings/${selectedBooking._id}`);
      setBookings((prev) => prev.filter((b) => b._id !== selectedBooking._id));
      setShowDeleteConfirm(false);
      setSelectedBooking(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBookingId(booking._id);
    setShowEditModal(true);
  };

  const refreshBookings = () => fetchBookings();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Modals */}
      {showAddModal && (
        <AddBookingForm
          onClose={() => setShowAddModal(false)}
          onBookingAdded={refreshBookings}
          clients={clients}
          vehicles={vehicles}
        />
      )}
      {showEditModal && editingBookingId && (
        <EditBookingModal
          isOpen={showEditModal}
          bookingId={editingBookingId}
          onClose={() => setShowEditModal(false)}
          onUpdate={refreshBookings}
        />
      )}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Inline Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Confirm Delete</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close Delete Confirmation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Booking Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive booking control with real-time tracking and revenue management</p>
        </div>
        <PermissionGuard module="bookings" action="create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-3" />
            <span className="font-semibold">Add New Booking</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Enhanced Search & Filter with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-label="Search Icon" />
                <input
                  type="text"
                  placeholder="Search bookings by client, vehicle, license plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  aria-label="Search bookings"
                  autoFocus
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Booking["status"] | "all")
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
              <div className="text-sm text-gray-500">Total Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold text-sm uppercase tracking-wide">Active</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {bookings.filter(b => b.status === 'Active').length}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 font-semibold text-sm uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {bookings.filter(b => b.status === 'Completed').length}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-full">
              <Calendar className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-semibold text-sm uppercase tracking-wide">Cancelled</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {bookings.filter(b => b.status === 'Cancelled').length}
              </p>
            </div>
            <div className="p-3 bg-red-200 rounded-full">
              <XCircle className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rental Period</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const days = calculateDays(b.startDate, b.endDate);
                  const total = days * (b.vehicle?.dailyRate ?? 0);
                  return (
                    <tr key={b._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                            <Calendar className="w-6 h-6 text-blue-700" />
                          </div>
                          <div className="ml-4">
                            <div className="text-base font-semibold text-gray-900">#{b._id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-green-700" />
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-semibold text-gray-900">{b.client.fullName}</div>
                            <div className="text-sm text-gray-500">{b.client.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {b.vehicle ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                              <Car className="w-5 h-5 text-purple-700" />
                            </div>
                            <div className="ml-3">
                              <div className="text-base font-semibold text-gray-900">{b.vehicle.make} {b.vehicle.model}</div>
                              <div className="text-sm text-gray-500">{b.vehicle.licensePlate}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{new Date(b.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(b.endDate).toLocaleDateString()}</div>
                          <div className="text-xs text-blue-600 font-semibold mt-1">{days} day{days > 1 && "s"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-lg font-bold text-gray-900">KSH {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
                          <div className="text-xs text-gray-500">KSH {b.vehicle?.dailyRate?.toLocaleString("en-KE") || 0}/day</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border
                          ${
                            b.status === 'Active'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : b.status === 'Completed'
                              ? 'bg-gray-100 text-gray-800 border-gray-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`
                        }>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }}
                            className="inline-flex items-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium"
                            title="View booking details"
                            aria-label="View booking"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(b)}
                            className="inline-flex items-center p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-yellow-200"
                            title="Edit booking"
                            aria-label="Edit booking"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedBooking(b); setShowDeleteConfirm(true); }}
                            className="inline-flex items-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-200"
                            title="Delete booking"
                            aria-label="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">No bookings found</h3>
                      <p className="text-gray-600 text-lg max-w-md mx-auto">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Start managing your bookings by adding your first booking using the Add New Booking button above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
