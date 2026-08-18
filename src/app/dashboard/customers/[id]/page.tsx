"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, DollarSign, Shield, CheckCircle, XCircle, Clock, X, Edit, CreditCard } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Toast, { useToast } from "@/components/Toast";

interface CustomerDetail {
  accountCount: number;
  totalBalance: number;
  lastLoginAt?: string;
  freezeReason?: string;
  isFrozen: boolean;
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  role: string;
  nin?: string;
  bvn?: string;
  createdAt: string;
  updatedAt: string;
  withdrawalsDisabled: boolean;
  withdrawalsDisabledReason?: string;
  withdrawalsDisabledAt?: string;
  withdrawalsEnabledAt?: string;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
  isCga: boolean;
  cgaSince?: string;
}

interface WalletData {
  ownerId: string;
  internalAccountNumber: string;
  balanceMinorUnits: number;
  balanceMajorUnits: number;
  nubans: Array<{
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
  }>;
}

export default function CustomerDetail() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toasts, showToast, removeToast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "male" as "male" | "female"
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showVirtualAccountModal, setShowVirtualAccountModal] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [virtualAccountData, setVirtualAccountData] = useState<any>(null);
  const [provider, setProvider] = useState<string>("fincra");
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoadingWallet(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/wallet/main/${customerId}`, {
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
        if (response.status === 404) {
          // Wallet not found, set to null
          setWalletData(null);
          return;
        }
        throw new Error(`Failed to fetch wallet data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setWalletData(data);
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      setWalletData(null);
    } finally {
      setLoadingWallet(false);
    }
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
      // Set default provider if fetch fails
      setProvider("fincra");
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/users/${customerId}`, {
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
        throw new Error(`Failed to fetch customer details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCustomer(data);
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
    fetchCustomerDetail();
    fetchProviders();
    fetchWalletData();
  }, [router, customerId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    // Convert from kobo to naira (divide by 100)
    const amountInNaira = amount / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amountInNaira);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const handleEditClick = () => {
    if (customer) {
      setEditForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleName: customer.middleName || "",
        gender: customer.gender as "male" | "female"
      });
      setUpdateError(null);
      setUpdateSuccess(false);
      setShowEditModal(true);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/users/${customerId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(`Failed to update customer: ${response.status} ${response.statusText}`);
      }

      // Show success message
      setUpdateSuccess(true);
      
      // Refetch customer data to ensure we have the latest
      await fetchCustomerDetail();
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setShowEditModal(false);
        setUpdateSuccess(false);
      }, 1500);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateVirtualAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setAccountError(null);
    setAccountSuccess(false);
    setVirtualAccountData(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/users/${customerId}/virtual-account`, {
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
      
      // Show success toast
      showToast("Virtual account created successfully!", "success");
      
      // Refetch customer data to update any related info
      await fetchCustomerDetail();
      
      // Refetch wallet data to show the new virtual account
      await fetchWalletData();
      
      // Close modal after success
      setTimeout(() => {
        setShowVirtualAccountModal(false);
        setAccountSuccess(false);
        setVirtualAccountData(null);
      }, 1500);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "An error occurred");
      showToast(err instanceof Error ? err.message : "Failed to create virtual account", "error");
    } finally {
      setCreatingAccount(false);
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/customers")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Customer Details</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">View customer information</p>
              </div>
            </div>
            {customer && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Check if customer has BVN or NIN
                    if (!customer?.bvn && !customer?.nin) {
                      showToast("Cannot create virtual account for this user because of missing BVN and NIN", "error");
                      return;
                    }
                    setAccountError(null);
                    setAccountSuccess(false);
                    setVirtualAccountData(null);
                    setShowVirtualAccountModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden md:inline">Create Virtual Account</span>
                </button>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden md:inline">Edit Profile</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customer details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                <p className="font-semibold mb-2">Access Denied</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : !customer ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Customer not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {customer.firstName} {customer.middleName ? `${customer.middleName} ` : ""}{customer.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{customer.email}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        customer.isFrozen
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      }`}>
                        {customer.isFrozen ? "Frozen" : "Active"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {customer.role}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(customer.totalBalance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {customer.accountCount} {customer.accountCount === 1 ? 'account' : 'accounts'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">First Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Middle Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.middleName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                    <p className="text-gray-900 dark:text-white font-medium capitalize">{customer.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900 dark:text-white">{customer.email}</p>
                      {customer.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900 dark:text-white">{customer.phoneNumber || "N/A"}</p>
                      {customer.phoneNumberVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">NIN</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.nin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">BVN</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.bvn || "N/A"}</p>
                  </div>
                </div>

                {/* Virtual Account Information */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Virtual Account</h5>
                  {loadingWallet ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : walletData && walletData.nubans && walletData.nubans.length > 0 ? (
                    <div className="space-y-3">
                      {walletData.nubans.map((nuban, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Number</p>
                              <p className="font-mono font-bold text-gray-900 dark:text-white">{nuban.accountNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Name</p>
                              <p className="text-gray-900 dark:text-white font-medium">{nuban.bankName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Name</p>
                              <p className="text-gray-900 dark:text-white font-medium">{nuban.accountName}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">No virtual account found for this customer</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Status</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Account Status</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customer.isFrozen
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    }`}>
                      {customer.isFrozen ? "Frozen" : "Active"}
                    </span>
                  </div>
                  {customer.isFrozen && customer.freezeReason && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Freeze Reason</p>
                      <p className="text-gray-900 dark:text-white">{customer.freezeReason}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Withdrawals</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customer.withdrawalsDisabled
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    }`}>
                      {customer.withdrawalsDisabled ? "Disabled" : "Enabled"}
                    </span>
                  </div>
                  {customer.withdrawalsDisabled && customer.withdrawalsDisabledReason && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Withdrawal Disabled Reason</p>
                      <p className="text-gray-900 dark:text-white">{customer.withdrawalsDisabledReason}</p>
                    </div>
                  )}
                  {customer.isCga && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">CGA Status</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Active since {formatDate(customer.cgaSince || "")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900 dark:text-white">{formatDate(customer.createdAt)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Updated At</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900 dark:text-white">{formatDate(customer.updatedAt)}</p>
                    </div>
                  </div>
                  {customer.withdrawalsDisabledAt && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Withdrawals Disabled At</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(customer.withdrawalsDisabledAt)}</p>
                    </div>
                  )}
                  {customer.withdrawalsEnabledAt && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Withdrawals Enabled At</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(customer.withdrawalsEnabledAt)}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Edit Profile Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCustomer} className="p-6 space-y-6">
                  {updateError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      <p className="text-sm">{updateError}</p>
                    </div>
                  )}

                  {updateSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                      <p className="text-sm">Profile updated successfully!</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={editForm.middleName}
                        onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter middle name (optional)"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as "male" | "female" })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Virtual Account Creation Modal */}
          {showVirtualAccountModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Virtual Account</h3>
                  <button
                    onClick={() => setShowVirtualAccountModal(false)}
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
                      onClick={() => setShowVirtualAccountModal(false)}
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
