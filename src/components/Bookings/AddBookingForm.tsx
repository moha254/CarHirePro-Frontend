import React, { useState, useMemo } from "react";
import { X, Calendar, AlertCircle, Plus, RefreshCw, User, Car, Save, CheckCircle } from "lucide-react";
import { api } from "../../lib/api";

// Import calculateDays function
const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

interface Client {
  _id: string;
  fullName: string;
}

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  dailyRate: number;
  licensePlate?: string; // Accept licensePlate as optional for better TS compatibility
}

interface Props {
  onClose: () => void;
  onBookingAdded: () => void;
  clients: Client[];
  vehicles: Vehicle[];
}

const getToday = () => new Date().toISOString().slice(0, 10);

const AddBookingForm: React.FC<Props> = ({
  onClose,
  onBookingAdded,
  clients,
  vehicles,
}) => {
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Show selected vehicle details to help user.
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v._id === vehicleId),
    [vehicleId, vehicles]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c._id === clientId),
    [clientId, clients]
  );

  const validate = (): string | null => {
    if (!clientId || !vehicleId || !startDate || !endDate)
      return "All fields are required";
    if (new Date(startDate) > new Date(endDate))
      return "Start date must be before end date";
    if (new Date(startDate) < new Date(getToday()))
      return "Start date cannot be in the past";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/bookings", {
        client: clientId,
        vehicle: vehicleId,
        startDate,
        endDate,
      });
      if (res.data.success) {
        setSuccessMsg("Booking added successfully!");
        setTimeout(() => {
          setSuccessMsg("");
          onBookingAdded();
          onClose();
        }, 1200);
      } else {
        setError(res.data.message || "Failed to add booking");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to add booking. Please check for overlapping bookings or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Add New Booking
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
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Client Information
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  required
                  aria-label="Select client"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
                {selectedClient && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-blue-700">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Selected: {selectedClient.fullName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Vehicle Selection
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                  required
                  aria-label="Select vehicle"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.make} {v.model} {v.licensePlate ? `· ${v.licensePlate}` : ""}
                    </option>
                  ))}
                </select>
                {selectedVehicle && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-purple-700">
                        <Car className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">
                          {selectedVehicle.make} {selectedVehicle.model}
                          {selectedVehicle.licensePlate && (
                            <span className="ml-2 font-mono text-xs">({selectedVehicle.licensePlate})</span>
                          )}
                        </span>
                      </div>
                      <div className="text-purple-700">
                        <span className="text-sm font-semibold">KSH {selectedVehicle.dailyRate.toLocaleString("en-KE")}/day</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rental Period */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Rental Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value && endDate && e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                    min={getToday()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    required
                    aria-label="Booking start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg"
                    required
                    aria-label="Booking end date"
                  />
                </div>
              </div>
              {startDate && endDate && selectedVehicle && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between text-green-700">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">
                        {calculateDays(startDate, endDate)} day{calculateDays(startDate, endDate) > 1 && "s"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-bold">
                        Total: KSH {(calculateDays(startDate, endDate) * selectedVehicle.dailyRate).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={loading}
              >
                <X className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </button>
              <button
                type="submit"
                className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Create Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBookingForm;
