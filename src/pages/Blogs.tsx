import { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Tag, FileText, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Loader2, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { api, type Blog as ApiBlog } from '../services/api';

interface Blog {
  id: string;
  title: string;
  tags: string[];
  images: string[]; // Array of image URLs for display
  description: string;
  date: string;
  status?: string;
}

const Blogs = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<File[]>([]); // Store actual File objects for new uploads
  const existingImagesRef = useRef<string[]>([]); // Store existing image URLs from API
  const fetchingRef = useRef(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [formData, setFormData] = useState({
    title: '',
    tags: [] as string[],
    images: [] as string[], // For preview URLs
    description: '',
  });

  const [tagInput, setTagInput] = useState('');

  // Fetch blogs on component mount and when page changes
  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

  const fetchBlogs = async (page: number = 1) => {
    // Prevent concurrent calls
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await api.getBlogs(page, limit);
      if (response.success && response.data) {
        // Convert API blogs to local format
        const formattedBlogs: Blog[] = response.data.blogs.map((blog: ApiBlog) => ({
          id: blog.id,
          title: blog.title,
          tags: blog.tags,
          // Extract imageUrl from image objects
          images: blog.images ? blog.images.map((img: any) => 
            typeof img === 'string' ? img : img.imageUrl
          ) : [],
          description: blog.description,
          date: new Date(blog.createdAt).toISOString().split('T')[0],
          status: blog.status,
        }));
        setBlogs(formattedBlogs);
        // Update pagination info
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        'data-placeholder': 'Write your blog description here...',
      },
    },
    onUpdate: ({ editor }) => {
      setFormData({ ...formData, description: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (editor && showModal) {
      editor.commands.setContent(formData.description || '');
    }
  }, [showModal]);

  const handleAddBlog = () => {
    setEditingBlog(null);
    setFormData({ title: '', tags: [], images: [], description: '' });
    setTagInput('');
    imageFilesRef.current = [];
    existingImagesRef.current = [];
    setShowModal(true);
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    // Store existing images separately
    existingImagesRef.current = [...blog.images];
    setFormData({
      title: blog.title,
      tags: blog.tags,
      images: blog.images, // These are URLs from API
      description: blog.description,
    });
    setTagInput('');
    imageFilesRef.current = []; // Clear new file ref when editing
    setShowModal(true);
  };

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (blogToDelete) {
      setDeletingBlogId(blogToDelete.id);
      try {
        const response = await api.deleteBlog(blogToDelete.id);
        if (response.success) {
          await fetchBlogs(currentPage);
          setBlogToDelete(null);
          setShowDeleteModal(false);
      } else {
        setErrorMessage('Failed to delete blog. Please try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      setErrorMessage('Failed to delete blog. Please try again.');
      setShowErrorModal(true);
      } finally {
        setDeletingBlogId(null);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Store actual File objects for FormData
      imageFilesRef.current = [...imageFilesRef.current, ...fileArray];
      
      // Create preview URLs
      const imagePromises = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(imageUrls => {
        setFormData({ ...formData, images: [...formData.images, ...imageUrls] });
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    // Check if it's an existing image (URL) or a new image (File)
    const isExistingImage = index < existingImagesRef.current.length;
    
    if (isExistingImage) {
      // Remove from existing images
      existingImagesRef.current = existingImagesRef.current.filter((_, i) => i !== index);
    } else {
      // Remove from new file refs (adjust index for existing images)
      const newImageIndex = index - existingImagesRef.current.length;
      imageFilesRef.current = imageFilesRef.current.filter((_, i) => i !== newImageIndex);
    }
    
    // Remove from preview
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      
      // Append only new image files (not existing URLs)
      imageFilesRef.current.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // If editing and there are existing images, we might need to send them
      // The backend should handle this - existing images are already stored
      // Only new images need to be uploaded

      if (editingBlog) {
        // Update blog via API
        const response = await api.updateBlog(editingBlog.id, formDataToSend);
        if (response.success) {
          await fetchBlogs(currentPage);
          setShowModal(false);
          setFormData({ title: '', tags: [], images: [], description: '' });
          setEditingBlog(null);
          imageFilesRef.current = [];
          existingImagesRef.current = [];
        } else {
          setErrorMessage('Failed to update blog. Please try again.');
          setShowErrorModal(true);
        }
      } else {
        // Create new blog via API
        const response = await api.createBlog(formDataToSend);
        if (response.success && response.data) {
          await fetchBlogs(currentPage);
          setShowModal(false);
          setFormData({ title: '', tags: [], images: [], description: '' });
          imageFilesRef.current = [];
          existingImagesRef.current = [];
        } else {
          setErrorMessage('Failed to create blog. Please try again.');
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Error submitting blog:', error);
      setErrorMessage('Failed to save blog. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Truncate title
  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const handlePreviewBlog = (blog: Blog) => {
    setPreviewBlog(blog);
    setShowPreviewModal(true);
  };

  const handleStatusClick = (blogId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    
    if (statusDropdownOpen === blogId) {
      setStatusDropdownOpen(null);
      setDropdownPosition(null);
    } else {
      setStatusDropdownOpen(blogId);
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
  };

  const handleStatusChange = async (blogId: string, newStatus: string) => {
    setUpdatingStatusId(blogId);
    try {
      const response = await api.updateBlogStatus(blogId, newStatus);
      if (response.success) {
        await fetchBlogs(currentPage);
        setStatusDropdownOpen(null);
        setDropdownPosition(null);
        // Update preview blog if it's the one being updated
        if (previewBlog && previewBlog.id === blogId) {
          setPreviewBlog({ ...previewBlog, status: newStatus });
        }
      } else {
        setErrorMessage('Failed to update status. Please try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMessage('Failed to update status. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownOpen && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        if (statusButtonRef.current && !statusButtonRef.current.contains(event.target as Node)) {
          setStatusDropdownOpen(null);
          setDropdownPosition(null);
        }
      }
    };

    const handleScroll = () => {
      if (statusDropdownOpen) {
        setStatusDropdownOpen(null);
        setDropdownPosition(null);
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [statusDropdownOpen]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Blog Management</h1>
          <p className="text-slate-500 mt-2">Create and manage your blog posts</p>
        </div>
        <button
          onClick={handleAddBlog}
          className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Blog
        </button>
      </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading blogs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900" title={blog.title}>
                        {truncateTitle(blog.title)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                            {tag}
                          </span>
                        ))}
                        {blog.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                            +{blog.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          ref={statusDropdownOpen === blog.id ? statusButtonRef : null}
                          onClick={(e) => handleStatusClick(blog.id, e)}
                          disabled={updatingStatusId === blog.id}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                            blog.status === 'PUBLISHED' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {updatingStatusId === blog.id ? (
                            <Loader2 className="w-3 h-3 inline animate-spin" />
                          ) : (
                            blog.status || 'DRAFT'
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{blog.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewBlog(blog)}
                          disabled={submitting || deletingBlogId !== null}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditBlog(blog)}
                          disabled={submitting || deletingBlogId !== null}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(blog)}
                          disabled={submitting || deletingBlogId !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} blogs
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                        <span key={page} className="px-2 text-gray-500">
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && filteredBlogs.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Blogs Found</h3>
          <p className="text-slate-500">No blogs match your search criteria</p>
        </div>
      )}

      {/* Status Dropdown - Fixed Position */}
      {statusDropdownOpen && dropdownPosition && (
        <div 
          ref={statusDropdownRef}
          className="fixed bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] min-w-[120px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {filteredBlogs.map((blog) => {
            if (statusDropdownOpen === blog.id) {
              return (
                <button
                  key={blog.id}
                  onClick={() => handleStatusChange(blog.id, blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                  disabled={updatingStatusId === blog.id}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'}
                </button>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">Fill in the details below</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    Blog Title *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Enter blog title..."
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-slate-500" />
                    Tags
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3 p-3 border border-slate-200 rounded-lg min-h-[60px]">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-slate-600 hover:text-slate-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 min-w-[120px] outline-none"
                    placeholder="Add tag and press Enter..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                >
                  + Add Tag
                </button>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-slate-500" />
                    Images
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all text-center"
                >
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Click to upload images</p>
                  <p className="text-xs text-slate-500 mt-1">You can select multiple images</p>
                </button>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.images.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description - Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    Description *
                  </span>
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('bold') ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('italic') ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('heading', { level: 1 }) ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('heading', { level: 2 }) ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('heading', { level: 3 }) ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('bulletList') ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={`p-2 rounded-lg transition-colors ${
                        editor?.isActive('orderedList') ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Editor */}
                  <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                      {editingBlog ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingBlog ? 'Update Blog' : 'Create Blog'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewBlog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{previewBlog.title}</h2>
                <p className="text-slate-500 text-sm mt-1">Blog Preview</p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewBlog(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status with Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    previewBlog.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {previewBlog.status || 'DRAFT'}
                  </span>
                  <span className="text-sm text-gray-600">
                    Created: {previewBlog.date}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {updatingStatusId === previewBlog.id ? (
                      <Loader2 className="w-4 h-4 inline animate-spin" />
                    ) : (
                      previewBlog.status === 'PUBLISHED' ? 'Published' : 'Draft'
                    )}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={previewBlog.status === 'PUBLISHED'}
                      onChange={() => handleStatusChange(previewBlog.id, previewBlog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                      disabled={updatingStatusId === previewBlog.id}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              </div>

              {/* Tags */}
              {previewBlog.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-slate-500" />
                      Tags
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {previewBlog.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {previewBlog.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <span className="flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2 text-slate-500" />
                      Images
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {previewBlog.images.map((image, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={image}
                          alt={`Blog image ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    Description
                  </span>
                </label>
                <div 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[200px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewBlog.description }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && blogToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Confirm Delete</h2>
                <p className="text-slate-500 text-sm mt-1">Are you sure you want to delete this blog?</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBlogToDelete(null);
                  setDeletingBlogId(null);
                }}
                disabled={deletingBlogId !== null}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                This action cannot be undone. The blog <strong>{blogToDelete.title}</strong> will be permanently deleted.
              </p>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBlogToDelete(null);
                    setDeletingBlogId(null);
                  }}
                  disabled={deletingBlogId !== null}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingBlogId !== null}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {deletingBlogId !== null ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-white mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Error</h2>
                  <p className="text-red-100 text-sm">Something went wrong</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                {errorMessage}
              </p>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorMessage('');
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
