"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, User, Mail, Phone, Calendar, Menu, X, CreditCard, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Toast, { useToast } from "@/components/Toast";

interface Customer {
  id: string;
  email: string | null;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  role: string;
  isFrozen?: boolean;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function Customers() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showVirtualAccountModal, setShowVirtualAccountModal] = useState(false);
  const [virtualAccountCustomer, setVirtualAccountCustomer] = useState<Customer | null>(null);
  const [provider, setProvider] = useState<string>("fincra");
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [virtualAccountData, setVirtualAccountData] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Reset to page 1 when search changes
      if (searchQuery !== debouncedSearch) {
        setCurrentPage(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      // Build URL with search parameter if search query exists
      let url = `https://gorro.online/admin/users?page=${currentPage}&limit=${rowsPerPage}`;
      
      // When searching, fetch more results to get better matches
      if (debouncedSearch.trim()) {
        // Fetch up to 100 results when searching for better client-side filtering
        url = `https://gorro.online/admin/users?page=1&limit=100&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Get the raw data from API
      let rawCustomers = Array.isArray(data.data) ? data.data : [];
      
      // If searching, apply strict client-side filter (backend search seems broken)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        rawCustomers = rawCustomers.filter((customer: Customer) => {
          return (
            customer.firstName?.toLowerCase().includes(query) ||
            customer.lastName?.toLowerCase().includes(query) ||
            customer.email?.toLowerCase().includes(query) ||
            customer.phoneNumber?.includes(query)
          );
        });
        
        // Update meta to reflect filtered results
        if (data.meta) {
          setMeta({
            ...data.meta,
            total: rawCustomers.length,
            page: 1,
            limit: rawCustomers.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          });
        }
      } else {
        setMeta(data.meta || null);
      }
      
      setCustomers(rawCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchCustomers();
    fetchProviders();
  }, [router, currentPage, rowsPerPage, debouncedSearch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusColor = (customer: Customer) => {
    if (customer.isFrozen) return "bg-red-500";
    if (!customer.emailVerified && !customer.phoneNumberVerified) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = (customer: Customer) => {
    if (customer.isFrozen) return "Frozen";
    if (!customer.emailVerified && !customer.phoneNumberVerified) return "Pending";
    return "Active";
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
    setActionDropdown(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch("https://gorro.online/admin/users/virtual-account-providers", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProviders(data.providers || []);
      if (data.default) {
        setProvider(data.default);
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
      setProvider("fincra");
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleCreateVirtualAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualAccountCustomer) return;

    setCreatingAccount(true);
    setAccountError(null);
    setAccountSuccess(false);
    setVirtualAccountData(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/users/${virtualAccountCustomer.id}/virtual-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "User missing required information (phone, NIN, or BVN)");
        }
        throw new Error(`Failed to create virtual account: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setVirtualAccountData(result.data);
      setAccountSuccess(true);
      
      showToast("Virtual account created successfully!", "success");
      
      // Close modal after success
      setTimeout(() => {
        setShowVirtualAccountModal(false);
        setAccountSuccess(false);
        setVirtualAccountData(null);
        setVirtualAccountCustomer(null);
      }, 1500);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "An error occurred");
      showToast(err instanceof Error ? err.message : "Failed to create virtual account", "error");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleOpenVirtualAccountModal = async (customer: Customer) => {
    setVirtualAccountCustomer(customer);
    setAccountError(null);
    setAccountSuccess(false);
    setVirtualAccountData(null);
    
    // Check if customer has BVN or NIN
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/users/${customer.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customer details");
      }

      const customerData = await response.json();
      
      // Check for BVN or NIN
      if (!customerData.bvn && !customerData.nin) {
        showToast("Cannot create virtual account for this user because of missing BVN and NIN", "error");
        setActionDropdown(null);
        return;
      }
      
      // Fetch providers and open modal
      await fetchProviders();
      setShowVirtualAccountModal(true);
      setActionDropdown(null);
    } catch (err) {
      showToast("Failed to check customer requirements", "error");
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePath="/dashboard/customers" />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Customers</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Manage your customer base</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Table Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {debouncedSearch && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {customers.length > 0 
                    ? `Found ${customers.length} customer${customers.length !== 1 ? 's' : ''} matching "${debouncedSearch}"`
                    : `No customers found matching "${debouncedSearch}"`
                  }
                </p>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customers...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                  <p className="font-semibold mb-2">Access Denied</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "No customers found matching your search" : "No customers found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Created On</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{customer.phoneNumber || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{customer.email || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDate(customer.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(customer)}`}></span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{getStatusText(customer)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="relative">
                            <button
                              onClick={() => setActionDropdown(actionDropdown === customer.id ? null : customer.id)}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2"
                            >
                              Action
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            {actionDropdown === customer.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                  onClick={() => handleViewCustomer(customer)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-t-lg"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleOpenVirtualAccountModal(customer)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-b-lg flex items-center gap-2"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Create Virtual Account
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && customers.length > 0 && meta && !debouncedSearch && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!meta.hasPreviousPage}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
                  >
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{meta.page}</button>
                  {meta.page + 1 <= meta.totalPages && (
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      {meta.page + 1}
                    </button>
                  )}
                  {meta.page + 2 <= meta.totalPages && (
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 2)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      {meta.page + 2}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!meta.hasNextPage}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Modal */}
          {showViewModal && selectedCustomer && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowViewModal(false)}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Customer Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="mb-6">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedCustomer.email || "No email"}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-gray-900 dark:text-white">{selectedCustomer.phoneNumber}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role</p>
                      <p className="text-gray-900 dark:text-white capitalize">{selectedCustomer.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email Verified</p>
                      <p className="text-gray-900 dark:text-white">{selectedCustomer.emailVerified ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Verified</p>
                      <p className="text-gray-900 dark:text-white">{selectedCustomer.phoneNumberVerified ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedCustomer)}`}></span>
                        <p className="text-gray-900 dark:text-white">{getStatusText(selectedCustomer)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedCustomer.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      router.push(`/dashboard/customers/${selectedCustomer.id}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Virtual Account Creation Modal */}
          {showVirtualAccountModal && virtualAccountCustomer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Virtual Account</h3>
                  <button
                    onClick={() => {
                      setShowVirtualAccountModal(false);
                      setVirtualAccountCustomer(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateVirtualAccount} className="p-6 space-y-6">
                  {accountError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      <p className="text-sm">{accountError}</p>
                    </div>
                  )}

                  {accountSuccess && virtualAccountData && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Virtual account created successfully!</p>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Account Number:</span>
                          <span className="font-mono font-bold">{virtualAccountData.nuban?.accountNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Bank Name:</span>
                          <span className="font-medium">{virtualAccountData.nuban?.bankName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Account Name:</span>
                          <span className="font-medium">{virtualAccountData.nuban?.accountName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <strong>Customer:</strong> {virtualAccountCustomer.firstName} {virtualAccountCustomer.lastName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Provider
                    </label>
                    {loadingProviders ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                        <span className="text-sm">Loading providers...</span>
                      </div>
                    ) : (
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {providers.map((prov) => (
                          <option key={prov.value} value={prov.value}>
                            {prov.label} {prov.isDefault && "(Default)"}
                          </option>
                        ))}
                      </select>
                    )}
                    {providers.length > 0 && providers.find(p => p.value === provider)?.banks && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Available banks: {providers.find(p => p.value === provider)?.banks.map((b: any) => b.name).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVirtualAccountModal(false);
                        setVirtualAccountCustomer(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingAccount}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {creatingAccount ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Toast Notifications */}
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}

         
        </div>
      </main>
    </div>
  );
}
