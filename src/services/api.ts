const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.5.53:3000/api';

// API Response Types
export type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
};

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Auth APIs
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(refreshToken: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Bookings APIs
  // async getBookings(page: number = 1, limit: number = 10): Promise<BookingsResponse> {
  //   const queryParams = new URLSearchParams({
  //     page: page.toString(),
  //     limit: limit.toString(),
  //   });
  //   return this.request<BookingsResponse>(`/bookings?${queryParams.toString()}`, {
  //     method: 'GET',
  //   });
  // }

  // async createBooking(booking: CreateBookingPayload): Promise<CreateBookingResponse> {
  //   return this.request<CreateBookingResponse>('/bookings', {
  //     method: 'POST',
  //     body: JSON.stringify(booking),
  //   });
  // }

  // async updateBooking(id: string, booking: CreateBookingPayload): Promise<CreateBookingResponse> {
  //   return this.request<CreateBookingResponse>(`/bookings/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(booking),
  //   });
  // }

  // async deleteBooking(id: string): Promise<{ success: boolean; message?: string }> {
  //   return this.request<{ success: boolean; message?: string }>(`/bookings/${id}`, {
  //     method: 'DELETE',
  //   });
  // }

  // Contacts APIs
  async getContacts(page: number = 1, limit: number = 10): Promise<ContactsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<ContactsResponse>(`/contacts?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async createContact(contact: CreateContactPayload): Promise<CreateContactResponse> {
    return this.request<CreateContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, contact: CreateContactPayload): Promise<CreateContactResponse> {
    return this.request<CreateContactResponse>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async deleteContact(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Blogs APIs
  async getBlogs(page: number = 1, limit: number = 10): Promise<BlogsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<BlogsResponse>(`/blogs?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async createBlog(formData: FormData): Promise<CreateBlogResponse> {
    const token = localStorage.getItem('authToken');
    const url = `${this.baseURL}/blogs`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async updateBlog(id: string, formData: FormData): Promise<CreateBlogResponse> {
    const token = localStorage.getItem('authToken');
    const url = `${this.baseURL}/blogs/${id}`;
    
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async deleteBlog(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  async updateBlogStatus(id: string, status: string): Promise<{ success: boolean; message?: string; data?: Blog }> {
    return this.request<{ success: boolean; message?: string; data?: Blog }>(`/blogs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Jobs APIs
  async getJobs(page: number = 1, limit: number = 10): Promise<JobsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<JobsResponse>(`/jobs?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async createJob(job: CreateJobPayload): Promise<CreateJobResponse> {
    return this.request<CreateJobResponse>('/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  async updateJob(id: string, job: CreateJobPayload): Promise<CreateJobResponse> {
    return this.request<CreateJobResponse>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(job),
    });
  }

  async deleteJob(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async updateJobStatus(id: string, isActive: boolean): Promise<{ success: boolean; message?: string; data?: Job }> {
    return this.request<{ success: boolean; message?: string; data?: Job }>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Applications APIs
  async getApplications(page: number = 1, limit: number = 10): Promise<ApplicationsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<ApplicationsResponse>(`/admin/applications?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async getResumeFile(url: string, forPreview: boolean = false): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    const config: RequestInit = {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Set Accept header to get the file in a format suitable for preview
        Accept: forPreview ? '*/*' : 'application/octet-stream',
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Packages APIs
  async getPackages(page: number = 1, limit: number = 10): Promise<PackagesResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<PackagesResponse>(`/packages?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async createPackage(pkg: CreatePackagePayload): Promise<CreatePackageResponse> {
    return this.request<CreatePackageResponse>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  async updatePackage(id: string, pkg: CreatePackagePayload): Promise<CreatePackageResponse> {
    return this.request<CreatePackageResponse>(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pkg),
    });
  }

  async deletePackage(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/packages/${id}`, {
      method: 'DELETE',
    });
  }

  // Contact Info APIs
  async getContactDetails(): Promise<ContactDetailsResponse> {
    return this.request<ContactDetailsResponse>('/contact-info', {
      method: 'GET',
    });
  }

  async createContactDetail(contact: CreateContactDetailPayload): Promise<CreateContactDetailResponse> {
    return this.request<CreateContactDetailResponse>('/contact-info', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContactDetail(id: string, contact: CreateContactDetailPayload): Promise<CreateContactDetailResponse> {
    return this.request<CreateContactDetailResponse>(`/contact-info/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async deleteContactDetail(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/contact-info/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return this.request<DashboardStatsResponse>('/dashboard/stats', {
      method: 'GET',
    });
  }
}

// Bookings API Types
export type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  message: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export type BookingsResponse = {
  success: boolean;
  data: {
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreateBookingPayload = {
  name: string;
  phone: string;
  email: string;
  date: string; // ISO date string
  message: string;
};

export type CreateBookingResponse = {
  success: boolean;
  message?: string;
  data?: Booking;
};

// Contacts API Types
export type Contact = {
  id: string;
  name: string;
  email: string;
  contact: string;
  service: string;
  projectDetail: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
};

export type ContactsResponse = {
  success: boolean;
  data: {
    contacts: Contact[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreateContactPayload = {
  name: string;
  email: string;
  contact: string;
  service: string;
  projectDetail: string;
};

export type CreateContactResponse = {
  success: boolean;
  message?: string;
  data?: {
    contact: Contact;
  };
};

// Blogs API Types
export type BlogImage = {
  id: string;
  blogId: string;
  imageUrl: string;
  createdAt: string;
};

export type Blog = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: BlogImage[];
  status?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export type BlogsResponse = {
  success: boolean;
  data: {
    blogs: Blog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreateBlogResponse = {
  success: boolean;
  message?: string;
  data?: {
    blog: Blog;
  };
};

// Jobs API Types
export type Job = {
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
  updatedAt: string;
};

export type JobsResponse = {
  success: boolean;
  data: {
    jobs: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreateJobPayload = {
  title: string;
  description: string;
  startDate: string;
  location: string;
  salary: string;
  requirements: string;
  benefits: string;
  employmentType: string;
  isActive: boolean;
};

export type CreateJobResponse = {
  success: boolean;
  message?: string;
  data?: {
    job: Job;
  };
};

// Applications API Types
export type Resume = {
  previewUrl: string;
  downloadUrl: string;
  originalUrl: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  job: Job;
  resume: Resume;
};

export type ApplicationsResponse = {
  success: boolean;
  data: {
    applications: Application[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

// Packages API Types
export type Package = {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  imageUrl: string;
  isActive: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export type PackagesResponse = {
  success: boolean;
  data: {
    packages: Package[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreatePackagePayload = {
  name: string;
  description: string;
  price: string;
  features: string[];
  isActive: boolean;
};

export type CreatePackageResponse = {
  success: boolean;
  message?: string;
  data?: {
    package: Package;
  };
};

// Contact Info API Types
export type ContactDetail = {
  id: string;
  phone: string;
  email: string;
  address: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export type ContactDetailsResponse = {
  success: boolean;
  data: {
    contactInfo: ContactDetail;
  };
};

export type CreateContactDetailPayload = {
  phone: string;
  email: string;
  address: string;
};

export type CreateContactDetailResponse = {
  success: boolean;
  message?: string;
  data?: {
    contactDetail: ContactDetail;
  };
};

// Dashboard API Types
export type StatValue = {
  value: number;
  growth: number;
};

export type RecentActivity = {
  type: 'blog' | 'contact' | 'booking';
  message: string;
  timestamp: string;
  id: string;
  timeAgo: string;
};

export type DashboardStatsData = {
  totalBlogs: StatValue;
  contactForms: StatValue;
  bookings: StatValue;
  growth: StatValue;
  recentActivity: RecentActivity[];
};

export type DashboardStatsResponse = {
  success: boolean;
  data: DashboardStatsData;
};

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
