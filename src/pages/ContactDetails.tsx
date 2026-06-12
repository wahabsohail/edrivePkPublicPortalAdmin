import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Plus, Edit2, Trash2, Search, X, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { api, type ContactDetail as ApiContactDetail } from '../services/api';

interface ContactDetailItem {
  id: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

const ContactDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDetailItem | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactDetailItem | null>(null);
  const [contacts, setContacts] = useState<ContactDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
  });

  // Fetch contact details on component mount
  useEffect(() => {
    fetchContactDetails();
  }, []);

  const fetchContactDetails = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getContactDetails();
      if (response.success && response.data && response.data.contactInfo) {
        const contact: ApiContactDetail = response.data.contactInfo;
        const formattedContact: ContactDetailItem = {
          id: contact.id,
          phone: contact.phone,
          email: contact.email,
          address: contact.address,
          createdAt: contact.createdAt,
        };
        setContacts([formattedContact]);
        setTotalPages(1);
        setTotal(1);
      } else {
        // If no data, set empty array
        setContacts([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      // Set empty state on error
      setContacts([]);
      setTotalPages(1);
      setTotal(0);
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

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const handleEditContact = (contact: ContactDetailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(contact);
    setFormData({
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingContact) {
        const response = await api.updateContactDetail(editingContact.id, {
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        
        if (response.success) {
          await fetchContactDetails();
          setShowModal(false);
          setFormData({ phone: '', email: '', address: '' });
          setEditingContact(null);
        } else {
          alert('Failed to update contact detail. Please try again.');
        }
      } else {
        const response = await api.createContactDetail({
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        
        if (response.success && response.data) {
          await fetchContactDetails();
          setShowModal(false);
          setFormData({ phone: '', email: '', address: '' });
        } else {
          alert('Failed to create contact detail. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting contact detail:', error);
      alert('Failed to save contact detail. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (contact: ContactDetailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      setDeletingContactId(contactToDelete.id);
      try {
        const response = await api.deleteContactDetail(contactToDelete.id);
        if (response.success) {
          await fetchContactDetails();
          setContactToDelete(null);
          setShowDeleteModal(false);
        } else {
          alert('Failed to delete contact detail. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting contact detail:', error);
        alert('Failed to delete contact detail. Please try again.');
      } finally {
        setDeletingContactId(null);
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contact Details</h1>
          <p className="text-slate-500 mt-2">Manage contact information</p>
        </div>
        <button
          onClick={handleAddContact}
          className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Contact
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading contact details...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                          <Phone className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{contact.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-600 max-w-md">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{contact.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {formatDate(contact.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleEditContact(contact, e)}
                          disabled={submitting || deletingContactId !== null}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(contact, e)}
                          disabled={submitting || deletingContactId !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingContactId === contact.id ? (
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
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} contacts
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

      {!loading && filteredContacts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Phone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Contact Details Found</h3>
          <p className="text-slate-500">No contacts match your search criteria</p>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingContact ? 'Edit Contact Detail' : 'Add New Contact Detail'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {editingContact ? 'Update the contact information below' : 'Fill in the contact information below'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingContact(null);
                  setFormData({ phone: '', email: '', address: '' });
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-500" />
                    Phone *
                  </span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-slate-500" />
                    Email *
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Enter email address..."
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                    Address *
                  </span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none resize-none transition-colors"
                  placeholder="Enter address..."
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingContact(null);
                    setFormData({ phone: '', email: '', address: '' });
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
                      {editingContact ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingContact ? 'Update Contact' : 'Add Contact'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Confirm Delete</h2>
                <p className="text-slate-500 text-sm mt-1">Are you sure you want to delete this contact detail?</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setContactToDelete(null);
                  setDeletingContactId(null);
                }}
                disabled={deletingContactId !== null}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                This action cannot be undone. The contact detail with phone <strong>{contactToDelete.phone}</strong> will be permanently deleted.
              </p>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setContactToDelete(null);
                    setDeletingContactId(null);
                  }}
                  disabled={deletingContactId !== null}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingContactId !== null}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {deletingContactId !== null ? (
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

export default ContactDetails;

