"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, DollarSign, Download, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface SegmentUser {
  userId: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  kycTier: number;
  joinedAt: string;
  lastTransactionAt: string | null;
  balance: number;
  ajoGroup?: {
    name: string;
    status: string;
  };
}

interface SegmentDetail {
  key: string;
  label: string;
  description: string;
}

interface SegmentData {
  segment: SegmentDetail;
  appliedOptions: {
    minDaysSinceSignup: number;
    inactiveDays: number;
    nearZeroBalance: number;
  };
  page: number;
  limit: number;
  total: number;
  users: SegmentUser[];
}

export default function SegmentDetails() {
  const router = useRouter();
  const params = useParams();
  const segmentKey = params.segment as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  const [exporting, setExporting] = useState(false);

  const fetchSegmentUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `https://gorro.online/admin/marketing/segments/${segmentKey}?${params}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(`Failed to fetch segment users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSegmentData(data);
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
    fetchSegmentUsers();
  }, [router, segmentKey, currentPage]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(
        `https://gorro.online/admin/marketing/segments/${segmentKey}/export`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export segment: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${segmentKey}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount);
  };

  const totalPages = segmentData ? Math.ceil(segmentData.total / segmentData.limit) : 0;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePath="/dashboard/marketing" />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => router.push("/dashboard/marketing")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                    {segmentData?.segment.label || "Loading..."}
                  </h2>
                  <button
                    onClick={handleExport}
                    disabled={exporting || !segmentData || segmentData.total === 0}
                    className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs md:text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="hidden md:inline">Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-2 block">
                  {segmentData?.segment.description}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {segmentData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {segmentData.total.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Days Signup</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {segmentData.appliedOptions.minDaysSinceSignup}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inactive</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {segmentData.appliedOptions.inactiveDays}d
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Threshold</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    ₦{segmentData.appliedOptions.nearZeroBalance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                  <p className="font-semibold mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : segmentData && segmentData.users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">KYC</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Joined</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Last Active</th>
                        <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">Balance</th>
                        {segmentKey === "ajo-stalled" && (
                          <th className="text-left py-3 px-2 md:px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 hidden xl:table-cell">Ajo Group</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {segmentData.users.map((user) => (
                        <tr
                          key={user.userId}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-3 px-2 md:px-4">
                            <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{user.name}</p>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs truncate">{user.phoneNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs truncate max-w-[150px]">{user.email || "N/A"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                              Tier {user.kycTier}
                            </span>
                          </td>
                          <td className="py-3 px-2 md:px-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs whitespace-nowrap">{formatDate(user.joinedAt)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4 hidden lg:table-cell">
                            <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {formatDate(user.lastTransactionAt)}
                            </span>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {formatCurrency(user.balance)}
                            </span>
                          </td>
                          {segmentKey === "ajo-stalled" && user.ajoGroup && (
                            <td className="py-3 px-2 md:px-4 hidden xl:table-cell">
                              <div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{user.ajoGroup.name}</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{user.ajoGroup.status}</span>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((segmentData.page - 1) * segmentData.limit) + 1} to {Math.min(segmentData.page * segmentData.limit, segmentData.total)} of {segmentData.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No users found in this segment</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
