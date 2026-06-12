import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar, MapPin, DollarSign, Briefcase, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Eye, Clock, FileText } from 'lucide-react';
import { api, type Job as ApiJob, type CreateJobPayload } from '../services/api';

interface Job {
  id: string;
  title: string;
  description: string;
  startDate: string;
  location: string;
  salary: string;
  requirements: string;
  benefits: string;
  employmentType: string;
  isActive: boolean;
  createdAt: string;
}

const Jobs = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [formData, setFormData] = useState<CreateJobPayload>({
    title: '',
    description: '',
    startDate: '',
    location: '',
    salary: '',
    requirements: '',
    benefits: '',
    employmentType: 'Full-time',
    isActive: true,
  });

  // Fetch jobs on component mount and when page changes
  useEffect(() => {
    fetchJobs(currentPage);
  }, [currentPage]);

  const fetchJobs = async (page: number = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getJobs(page, limit);
      if (response.success && response.data) {
        const formattedJobs: Job[] = response.data.jobs.map((job: ApiJob) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          startDate: job.startDate,
          location: job.location,
          salary: job.salary,
          requirements: job.requirements,
          benefits: job.benefits,
          employmentType: job.employmentType,
          isActive: job.isActive,
          createdAt: job.createdAt,
        }));
        setJobs(formattedJobs);
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const handleOpenModal = (job?: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        description: job.description,
        startDate: formatDateForInput(job.startDate),
        location: job.location,
        salary: job.salary,
        requirements: job.requirements,
        benefits: job.benefits,
        employmentType: job.employmentType,
        isActive: job.isActive,
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        location: '',
        salary: '',
        requirements: '',
        benefits: '',
        employmentType: 'Full-time',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      location: '',
      salary: '',
      requirements: '',
      benefits: '',
      employmentType: 'Full-time',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Format startDate to ISO string
      const formattedDate = formData.startDate 
        ? new Date(formData.startDate).toISOString()
        : new Date().toISOString();

      const payload: CreateJobPayload = {
        ...formData,
        startDate: formattedDate,
      };

      if (editingJob) {
        await api.updateJob(editingJob.id, payload);
      } else {
        await api.createJob(payload);
      }

      handleCloseModal();
      fetchJobs(currentPage);
    } catch (error) {
      console.error('Error saving job:', error);
      alert(error instanceof Error ? error.message : 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (job: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (job: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    setDeletingJobId(jobToDelete.id);
    try {
      await api.deleteJob(jobToDelete.id);
      setShowDeleteModal(false);
      setJobToDelete(null);
      fetchJobs(currentPage);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete job');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleStatusToggle = async (job: Job) => {
    setUpdatingStatusId(job.id);
    try {
      await api.updateJobStatus(job.id, !job.isActive);
      // Update the job in the local state immediately for better UX
      setJobs(jobs.map(j => j.id === job.id ? { ...j, isActive: !j.isActive } : j));
    } catch (error) {
      console.error('Error updating job status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update job status');
      // Refresh to get the correct state if update failed
      fetchJobs(currentPage);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.employmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Posts</h1>
          <p className="text-slate-600 mt-1">Manage job postings and opportunities</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Job Post
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs by title, location, or employment type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first job post'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Job Post
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleViewDetails(job)}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.employmentType}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Start: {formatDate(job.startDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {job.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              <XCircle className="w-3.5 h-3.5" />
                              Inactive
                            </span>
                          )}
                        </div>
                        {/* Status Toggle Switch */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(job);
                          }}
                          disabled={updatingStatusId === job.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            job.isActive ? 'bg-green-600' : 'bg-slate-300'
                          }`}
                          title={job.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {updatingStatusId === job.id ? (
                            <Loader2 className="absolute left-1.5 w-3 h-3 text-white animate-spin" />
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                job.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-1 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                        Created: {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleViewDetails(job, e)}
                      className="flex items-center justify-center p-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleOpenModal(job, e)}
                      className="flex items-center justify-center p-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Edit job"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(job, e)}
                      className="flex items-center justify-center p-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} jobs
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingJob ? 'Edit Job Post' : 'Create Job Post'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {editingJob ? 'Update job post information' : 'Add a new job posting'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    placeholder="e.g., Software Developer"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
                    placeholder="Describe the job role and responsibilities..."
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                      placeholder="e.g., Remote, New York, etc."
                    />
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Salary *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                      placeholder="e.g., $80,000 - $100,000"
                    />
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      required
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Requirements *
                  </label>
                  <textarea
                    required
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
                    placeholder="List the required qualifications and experience..."
                  />
                </div>

                {/* Benefits */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Benefits *
                  </label>
                  <textarea
                    required
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none"
                    placeholder="e.g., Health insurance, 401k, flexible hours..."
                  />
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-slate-600 border-slate-300 rounded focus:ring-orange-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Job is active (visible to applicants)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingJob ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingJob ? 'Update Job' : 'Create Job'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h2>
                  {selectedJob.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm">View complete job post details</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedJob(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Job Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Location</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedJob.location}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Employment Type</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedJob.employmentType}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Salary</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedJob.salary}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Start Date</span>
                    </div>
                    <p className="text-slate-900 font-medium">{formatDate(selectedJob.startDate)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                    <FileText className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Job Description</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Requirements</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedJob.requirements}</p>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                    <Briefcase className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Benefits</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedJob.benefits}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-2 text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <Clock className="w-4 h-4" />
                  <span>Created: {formatDate(selectedJob.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedJob(null);
                }}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenModal(selectedJob);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Delete Job Post</h2>
                <p className="text-slate-500 text-sm mt-1">This action cannot be undone</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setJobToDelete(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete the job post <strong>"{jobToDelete.title}"</strong>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setJobToDelete(null);
                  }}
                  disabled={deletingJobId === jobToDelete.id}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingJobId === jobToDelete.id}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingJobId === jobToDelete.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;

