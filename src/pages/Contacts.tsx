import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Calendar, Search, Plus, Trash2, X, User, MessageSquare, Loader2, Edit2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { api, type Contact as ApiContact } from '../services/api';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  projectDetail: string;
  date: string;
  status?: 'New' | 'Read';
}

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    projectDetail: ''
  });

  // Fetch contacts on component mount and when page changes
  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  const fetchContacts = async (page: number = 1) => {
    // Prevent concurrent calls
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getContacts(page, limit);
      if (response.success && response.data) {
        // Convert API contacts to local format
        const formattedContacts: Contact[] = response.data.contacts.map((contact: ApiContact) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.contact, // API uses 'contact' field
          service: contact.service || '',
          projectDetail: contact.projectDetail || '',
          date: new Date(contact.createdAt).toISOString().split('T')[0],
          status: 'New' // Default status
        }));
        setContacts(formattedContacts);
        // Update pagination info
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Format date for display
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
    setFormData({ name: '', email: '', phone: '', service: '', projectDetail: '' });
    setShowModal(true);
  };

  const handleEditContact = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      service: contact.service,
      projectDetail: contact.projectDetail
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingContact) {
        // Update contact via API
        const response = await api.updateContact(editingContact.id, {
          name: formData.name,
          email: formData.email,
          contact: formData.phone, // API uses 'contact' field
          service: formData.service,
          projectDetail: formData.projectDetail
        });
        
        if (response.success) {
          // Refresh contacts list
          await fetchContacts(currentPage);
          setShowModal(false);
          setFormData({ name: '', email: '', phone: '', service: '', projectDetail: '' });
          setEditingContact(null);
        } else {
          alert('Failed to update contact. Please try again.');
        }
      } else {
        // Create new contact via API
        const response = await api.createContact({
          name: formData.name,
          email: formData.email,
          contact: formData.phone, // API uses 'contact' field
          service: formData.service,
          projectDetail: formData.projectDetail
        });
        
        if (response.success && response.data) {
          // Refresh contacts list
          await fetchContacts(currentPage);
          setShowModal(false);
          setFormData({ name: '', email: '', phone: '', service: '', projectDetail: '' });
        } else {
          alert('Failed to create contact. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
    // Mark as read when viewing
    setContacts(contacts.map(c => 
      c.id === contact.id ? { ...c, status: 'Read' } : c
    ));
  };

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      setDeletingContactId(contactToDelete.id);
      try {
        const response = await api.deleteContact(contactToDelete.id);
        if (response.success) {
          // Refresh contacts list
          await fetchContacts(currentPage);
          if (selectedContact?.id === contactToDelete.id) {
            setSelectedContact(null);
            setShowDetailModal(false);
          }
          setContactToDelete(null);
          setShowDeleteModal(false);
        } else {
          alert('Failed to delete contact. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact. Please try again.');
      } finally {
        setDeletingContactId(null);
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contact Form Submissions</h1>
          <p className="text-slate-500 mt-2">Manage and respond to customer inquiries</p>
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
          <p className="text-slate-500">Loading contacts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  onClick={() => handleContactClick(contact)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="text-sm font-medium text-slate-900">{contact.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" />
                      {contact.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      {contact.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {formatDate(contact.date)}
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
                    // Show first page, last page, current page, and pages around current
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
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Contacts Found</h3>
          <p className="text-slate-500">No contacts match your search criteria</p>
        </div>
      )}

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {editingContact ? 'Update the contact information below' : 'Fill in the contact information below'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingContact(null);
                  setFormData({ name: '', email: '', phone: '', service: '', projectDetail: '' });
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
                    <User className="w-4 h-4 mr-2 text-slate-500" />
                    Name *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Enter contact name..."
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  placeholder="Enter phone number..."
                  required
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                    Service *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Enter service..."
                  required
                />
              </div>

              {/* Project Detail */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-slate-500" />
                    Project Detail *
                  </span>
                </label>
                <textarea
                  value={formData.projectDetail}
                  onChange={(e) => setFormData({ ...formData, projectDetail: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none resize-none transition-colors"
                  placeholder="Enter project detail..."
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
                    setFormData({ name: '', email: '', phone: '', service: '', projectDetail: '' });
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

      {/* Contact Detail Modal */}
      {showDetailModal && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Contact Details</h2>
                <p className="text-slate-500 text-sm mt-1">View full contact information</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Header Card */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-slate-900">{selectedContact.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{selectedContact.email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedContact.status === 'New' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {selectedContact.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Email Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
                      <p className="text-sm font-medium text-slate-900 break-words">{selectedContact.email}</p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{selectedContact.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Service Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Service</p>
                      <p className="text-sm font-medium text-slate-900">{selectedContact.service}</p>
                    </div>
                  </div>
                </div>

                {/* Date Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(selectedContact.date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Detail Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Project Detail</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedContact.projectDetail}</p>
                </div>
              </div>
            </div>
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
                <p className="text-slate-500 text-sm mt-1">Are you sure you want to delete this contact?</p>
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
                This action cannot be undone. The contact <strong>{contactToDelete.name}</strong> will be permanently deleted.
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

export default Contacts;
