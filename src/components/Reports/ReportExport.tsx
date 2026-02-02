import { useState } from 'react';
import { 
  Download, FileText, Calendar, X, 
  AlertCircle, FileSpreadsheet, Mail, Printer, RefreshCw, Settings
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface ReportConfig {
  name: string;
  description: string;
  format: 'csv' | 'pdf' | 'excel';
  sections: string[];
  dateRange: boolean;
  filters: string[];
}

interface ExportOptions {
  reportType: string;
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  sections: string[];
  filters: Record<string, any>;
  email: string;
  includeCharts: boolean;
  includeSummary: boolean;
}

const reportConfigs: ReportConfig[] = [
  {
    name: 'Financial Summary',
    description: 'Complete financial overview with revenue, expenses, and profit analysis',
    format: 'pdf',
    sections: ['revenue', 'expenses', 'profit', 'trends', 'forecasts'],
    dateRange: true,
    filters: ['vehicle_type', 'client_category', 'payment_method']
  },
  {
    name: 'Vehicle Performance',
    description: 'Detailed vehicle utilization, maintenance, and performance metrics',
    format: 'excel',
    sections: ['utilization', 'revenue_per_vehicle', 'maintenance', 'availability'],
    dateRange: true,
    filters: ['vehicle_make', 'vehicle_model', 'status']
  },
  {
    name: 'Client Analytics',
    description: 'Customer behavior, satisfaction, and booking patterns analysis',
    format: 'csv',
    sections: ['demographics', 'booking_patterns', 'satisfaction', 'retention'],
    dateRange: true,
    filters: ['client_type', 'location', 'booking_frequency']
  },
  {
    name: 'Operational Report',
    description: 'Daily operations including bookings, fleet status, and staff performance',
    format: 'pdf',
    sections: ['daily_bookings', 'fleet_status', 'staff_performance', 'incidents'],
    dateRange: true,
    filters: ['branch', 'staff_member', 'shift']
  },
  {
    name: 'Custom Report',
    description: 'Build your own report with selected metrics and dimensions',
    format: 'excel',
    sections: ['bookings', 'revenue', 'vehicles', 'clients', 'staff'],
    dateRange: true,
    filters: ['all']
  }
];

export default function ReportExport() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    reportType: '',
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    sections: [],
    filters: {},
    email: '',
    includeCharts: true,
    includeSummary: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleReportSelect = (reportName: string) => {
    setSelectedReport(reportName);
    const config = reportConfigs.find(r => r.name === reportName);
    if (config) {
      setExportOptions(prev => ({
        ...prev,
        reportType: reportName,
        format: config.format,
        sections: config.sections,
        filters: {}
      }));
    }
  };

  const handleSectionToggle = (section: string) => {
    setExportOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleExport = async () => {
    if (!selectedReport) return;

    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to export history
      const newExport = {
        id: Date.now(),
        reportName: selectedReport,
        format: exportOptions.format,
        dateRange: exportOptions.dateRange,
        timestamp: new Date(),
        status: 'completed',
        downloadUrl: '#'
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      
      // Trigger download
      const mockData = generateMockReportData(selectedReport);
      analyticsService.exportToCSV(mockData, `${selectedReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateMockReportData = (reportType: string) => {
    switch (reportType) {
      case 'Financial Summary':
        return [
          { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
          { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000 },
          { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 }
        ];
      case 'Vehicle Performance':
        return [
          { vehicle: 'Toyota Camry', utilization: '85%', revenue: 12500, bookings: 23 },
          { vehicle: 'Honda CR-V', utilization: '78%', revenue: 11200, bookings: 19 },
          { vehicle: 'Nissan Altima', utilization: '92%', revenue: 15800, bookings: 31 }
        ];
      default:
        return [{ message: 'Sample data for ' + reportType }];
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const selectedConfig = reportConfigs.find(r => r.name === selectedReport);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Download className="w-5 h-5 text-white" />
            </div>
            Generate Report
          </h2>
          <p className="text-gray-600 mt-2 text-lg">Create comprehensive reports with customizable data and export options</p>
        </div>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Select Report Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportConfigs.map((config) => (
            <div
              key={config.name}
              onClick={() => handleReportSelect(config.name)}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedReport === config.name
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 text-lg">{config.name}</h4>
                <div className={`p-2 rounded-lg ${
                  selectedReport === config.name ? 'bg-indigo-600' : 'bg-gray-100'
                }`}>
                  <div className={selectedReport === config.name ? 'text-white' : 'text-gray-600'}>
                    {getFormatIcon(config.format)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{config.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <FileText className="w-3 h-3 mr-1" />
                  {config.sections.length} sections
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selectedReport === config.name
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {config.format.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedReport && selectedConfig && (
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Export Configuration
            </h3>
            
            <div className="space-y-8">
              {/* Date Range */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Export Format
                </label>
                <div className="flex flex-wrap gap-3">
                  {['pdf', 'excel', 'csv'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format as any }))}
                      className={`flex items-center px-4 py-3 rounded-lg border transition-all font-medium ${
                        exportOptions.format === format
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getFormatIcon(format)}
                      <span className="ml-2 capitalize">{format}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections Selection */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Include Sections
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedConfig.sections.map((section) => (
                    <label
                      key={section}
                      className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={exportOptions.sections.includes(section)}
                        onChange={() => handleSectionToggle(section)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {section.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Additional Options
                </label>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Include charts and graphs</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSummary}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Include executive summary</span>
                  </label>
                </div>
              </div>

              {/* Email Delivery */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Mail className="w-4 h-4" />
                  Email Report (Optional)
                </label>
                <input
                  type="email"
                  value={exportOptions.email}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address for delivery"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <FileText className="-ml-1 mr-2 h-5 w-5" />
                  Preview Report
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {exportOptions.sections.length === 0 && (
                  <div className="flex items-center text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Please select at least one section
                  </div>
                )}
                <button
                  onClick={handleExport}
                  disabled={isExporting || exportOptions.sections.length === 0}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="-ml-1 mr-2 h-5 w-5" />
                      Export Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Recent Exports
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Report Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Range</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Generated</th>
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {exportHistory.map((exportItem) => (
                  <tr key={exportItem.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{exportItem.reportName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-gray-100 rounded mr-2">
                          {getFormatIcon(exportItem.format)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{exportItem.format}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exportItem.dateRange.start} to {exportItem.dateRange.end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(exportItem.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="inline-flex items-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                        <button className="inline-flex items-center p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-200">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="inline-flex items-center p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-200">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  Report Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-indigo-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedReport} Preview
                </h4>
                <p className="text-gray-600 text-lg mb-6">
                  This preview shows how your report will be generated with the selected configuration
                </p>
                <div className="text-left bg-white rounded-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Format:</span>
                        <span className="font-semibold text-gray-900">{exportOptions.format.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date Range:</span>
                        <span className="font-semibold text-gray-900">{exportOptions.dateRange.start} to {exportOptions.dateRange.end}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Sections:</span>
                        <span className="font-semibold text-gray-900">{exportOptions.sections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Include Charts:</span>
                        <span className="font-semibold text-gray-900">{exportOptions.includeCharts ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Sections:</span> {exportOptions.sections.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <X className="-ml-1 mr-2 h-5 w-5" />
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleExport();
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                <Download className="-ml-1 mr-2 h-5 w-5" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
