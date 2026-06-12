import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Calendar, Mail, Phone, FileText, Download, Eye, MapPin, DollarSign, Briefcase, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { api, type Application as ApiApplication } from '../services/api';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  jobId: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    location: string;
    salary: string;
    employmentType: string;
  };
  resume: {
    previewUrl: string;
    downloadUrl: string;
    originalUrl: string;
  };
}

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingResumeId, setDownloadingResumeId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  // Fetch applications on component mount and when page changes
  useEffect(() => {
    fetchApplications(currentPage);
  }, [currentPage]);

  const fetchApplications = async (page: number = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getApplications(page, limit);
      if (response.success && response.data) {
        const formattedApplications: Application[] = response.data.applications.map((app: ApiApplication) => ({
          id: app.id,
          name: app.name,
          email: app.email,
          phone: app.phone,
          resumeUrl: app.resumeUrl,
          coverLetter: app.coverLetter,
          jobId: app.jobId,
          createdAt: app.createdAt,
          job: {
            id: app.job.id,
            title: app.job.title,
            location: app.job.location,
            salary: app.job.salary,
            employmentType: app.job.employmentType,
          },
          resume: app.resume,
        }));
        setApplications(formattedApplications);
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleDownloadResume = async (url: string, name: string, applicationId: string) => {
    setDownloadingResumeId(applicationId);
    try {
      const blob = await api.getResumeFile(url);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}-resume`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert(error instanceof Error ? error.message : 'Failed to download resume');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Applications</h1>
          <p className="text-slate-600 mt-1">View and manage job applications</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications found</h3>
          <p className="text-slate-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No job applications yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                onClick={() => handleViewDetails(application)}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{application.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            <span>{application.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            <span>{application.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Applied: {formatDate(application.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="flex items-center justify-center p-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {application.resume?.downloadUrl && (
                      <button
                        onClick={() => handleDownloadResume(application.resume.downloadUrl, application.name, application.id)}
                        disabled={downloadingResumeId === application.id}
                        className="flex items-center justify-center p-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download resume"
                      >
                        {downloadingResumeId === application.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} applications
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-700 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedApplication.name}</h2>
                <p className="text-slate-500 text-sm">Application Details</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Email</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedApplication.email}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Phone</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedApplication.phone}</p>
                  </div>
                </div>

                {/* Job Information */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                    <Briefcase className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Applied Position</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-xl font-semibold text-slate-900 mb-3">{selectedApplication.job.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{selectedApplication.job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm">{selectedApplication.job.employmentType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">{selectedApplication.job.salary}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 mb-3">
                      <FileText className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Cover Letter</h3>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="flex items-center gap-2 text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <Calendar className="w-4 h-4" />
                  <span>Applied on: {formatDate(selectedApplication.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors"
              >
                Close
              </button>
              {selectedApplication.resume?.downloadUrl && (
                <button
                  onClick={() => handleDownloadResume(selectedApplication.resume.downloadUrl, selectedApplication.name, selectedApplication.id)}
                  disabled={downloadingResumeId === selectedApplication.id}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingResumeId === selectedApplication.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Resume
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;

