import { useState, useEffect, useRef } from 'react';
import { Package as PackageIcon, Plus, Edit2, Trash2, Search, X, DollarSign, FileText, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type Package as ApiPackage } from '../services/api';

interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

const Packages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: [] as string[],
    isActive: true,
  });

  const [featureInput, setFeatureInput] = useState('');

  // Fetch packages on component mount and when page changes
  useEffect(() => {
    fetchPackages(currentPage);
  }, [currentPage]);

  const fetchPackages = async (page: number = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getPackages(page, limit);
      if (response.success && response.data) {
        const formattedPackages: PackageItem[] = response.data.packages.map((pkg: ApiPackage) => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          features: pkg.features || [],
          isActive: pkg.isActive ?? true,
          createdAt: pkg.createdAt,
        }));
        setPackages(formattedPackages);
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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

  const handleAddPackage = () => {
    setEditingPackage(null);
    setFormData({ name: '', description: '', price: '', features: [], isActive: true });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleEditPackage = (pkg: PackageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      features: pkg.features,
      isActive: pkg.isActive,
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingPackage) {
        const response = await api.updatePackage(editingPackage.id, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          features: formData.features,
          isActive: formData.isActive,
        });
        
        if (response.success) {
          await fetchPackages(currentPage);
          setShowModal(false);
          setFormData({ name: '', description: '', price: '', features: [], isActive: true });
          setEditingPackage(null);
        } else {
          alert('Failed to update package. Please try again.');
        }
      } else {
        const response = await api.createPackage({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          features: formData.features,
          isActive: formData.isActive,
        });
        
        if (response.success && response.data) {
          await fetchPackages(currentPage);
          setShowModal(false);
          setFormData({ name: '', description: '', price: '', features: [], isActive: true });
        } else {
          alert('Failed to create package. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting package:', error);
      alert('Failed to save package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (pkg: PackageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackageToDelete(pkg);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (packageToDelete) {
      setDeletingPackageId(packageToDelete.id);
      try {
        const response = await api.deletePackage(packageToDelete.id);
        if (response.success) {
          await fetchPackages(currentPage);
          setPackageToDelete(null);
          setShowDeleteModal(false);
        } else {
          alert('Failed to delete package. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package. Please try again.');
      } finally {
        setDeletingPackageId(null);
      }
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Packages</h1>
          <p className="text-slate-500 mt-2">Create and manage service packages</p>
        </div>
        <button
          onClick={handleAddPackage}
          className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Package
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading packages...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <PackageIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{pkg.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-md truncate">{pkg.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm font-medium text-slate-900">
                        <DollarSign className="w-4 h-4 mr-1 text-slate-400" />
                        {pkg.price}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        pkg.isActive 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {formatDate(pkg.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleEditPackage(pkg, e)}
                          disabled={submitting || deletingPackageId !== null}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(pkg, e)}
                          disabled={submitting || deletingPackageId !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingPackageId === pkg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center text-sm text-slate-600">
                <span>
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} packages
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-slate-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && filteredPackages.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <PackageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Packages Found</h3>
          <p className="text-slate-500">No packages match your search criteria</p>
        </div>
      )}

      {/* Add/Edit Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingPackage ? 'Edit Package' : 'Create New Package'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {editingPackage ? 'Update the package information below' : 'Fill in the package information below'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPackage(null);
                  setFormData({ name: '', description: '', price: '', features: [], isActive: true });
                  setFeatureInput('');
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <PackageIcon className="w-4 h-4 mr-2 text-slate-500" />
                    Package Name *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Enter package name..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    Description *
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none resize-none transition-colors"
                  placeholder="Enter package description..."
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-slate-500" />
                    Price *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="e.g., $99.99, $199.99"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Enter price as a string (e.g., "$99.99")</p>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                    placeholder="Add a feature and press Enter..."
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Active Package</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPackage(null);
                    setFormData({ name: '', description: '', price: '', features: [], isActive: true });
                    setFeatureInput('');
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {editingPackage ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingPackage ? 'Update Package' : 'Create Package'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && packageToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Confirm Delete</h2>
                <p className="text-slate-500 text-sm mt-1">Are you sure you want to delete this package?</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPackageToDelete(null);
                  setDeletingPackageId(null);
                }}
                disabled={deletingPackageId !== null}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                This action cannot be undone. The package <strong>{packageToDelete.name}</strong> will be permanently deleted.
              </p>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPackageToDelete(null);
                    setDeletingPackageId(null);
                  }}
                  disabled={deletingPackageId !== null}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingPackageId !== null}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {deletingPackageId !== null ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
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

export default Packages;

