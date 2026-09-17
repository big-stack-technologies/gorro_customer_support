"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target, Users, Download, ChevronRight, TrendingDown, TrendingUp, DollarSign, Menu, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Segment {
  key: string;
  label: string;
  description: string;
  count: number;
  totalBalance?: number;
}

interface SegmentsData {
  segments: Segment[];
  totalUsers: number;
}

export default function MarketingSegments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [segmentsData, setSegmentsData] = useState<SegmentsData | null>(null);
  const [exportingSegment, setExportingSegment] = useState<string | null>(null);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch(`https://gorro.online/admin/marketing/segments`, {
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
        throw new Error(`Failed to fetch segments: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSegmentsData(data);
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
    fetchSegments();
  }, [router]);

  const handleExport = async (segmentKey: string) => {
    try {
      setExportingSegment(segmentKey);
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

      // Download the CSV file
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
      setExportingSegment(null);
    }
  };

  const handleViewDetails = (segmentKey: string) => {
    router.push(`/dashboard/marketing/${segmentKey}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount);
  };

  const getSegmentIcon = (key: string) => {
    switch (key) {
      case "no-kyc":
        return <Users className="w-6 h-6 text-yellow-600" />;
      case "kyc-no-deposit":
        return <TrendingDown className="w-6 h-6 text-orange-600" />;
      case "emptied-and-gone":
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      case "money-still-in":
        return <DollarSign className="w-6 h-6 text-green-600" />;
      case "ajo-stalled":
        return <Users className="w-6 h-6 text-purple-600" />;
      default:
        return <Target className="w-6 h-6 text-gray-600" />;
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

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePath="/dashboard/marketing" />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Marketing Segments</h2>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
              Inactive user segments for re-engagement campaigns
            </p>
          </div>

          {/* Summary Card */}
          {segmentsData && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-4 mb-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs mb-1">Total Inactive Users</p>
                  <p className="text-2xl md:text-3xl font-bold">{segmentsData.totalUsers.toLocaleString()}</p>
                </div>
                <Target className="w-10 h-10 md:w-12 md:h-12 text-blue-300 opacity-50" />
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading segments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                <p className="font-semibold mb-2">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : segmentsData ? (
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {segmentsData.segments.map((segment) => (
                <div
                  key={segment.key}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                      {getSegmentIcon(segment.key)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                        {segment.label}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {segment.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {segment.count.toLocaleString()}
                      </p>
                    </div>
                    {segment.totalBalance !== undefined && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                        <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(segment.totalBalance)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(segment.key)}
                      disabled={segment.count === 0}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-xs md:text-sm flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="hidden sm:inline">View</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExport(segment.key)}
                      disabled={segment.count === 0 || exportingSegment === segment.key}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg text-xs md:text-sm flex items-center justify-center gap-1 transition-colors"
                    >
                      {exportingSegment === segment.key ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
