"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Mail, BarChart3, Tag, Users, X } from "lucide-react";

interface Ticket {
  id: number;
  email: string;
  fullName: string;
  message: string;
  subject: string;
  status: string;
  agent?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [closeRemarks, setCloseRemarks] = useState("");

  const updateTicketStatus = async (ticketId: number, action: "accept" | "close") => {
    try {
      setUpdatingTicket(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const endpoint = action === "accept"
        ? `https://gorro.online/tickets/${ticketId}/accept`
        : `https://gorro.online/tickets/${ticketId}/close`;

      const body = action === "accept"
        ? undefined
        : JSON.stringify({ remarks: closeRemarks });

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Failed to update ticket: ${response.status} ${response.statusText}`);
      }

      // Refresh tickets after update
      await fetchTickets();
      setCloseRemarks("");

      // Update the selected ticket in the modal
      if (selectedTicket && selectedTicket.id === ticketId) {
        const newStatus = action === "accept" ? "in-progress" : "resolved";
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUpdatingTicket(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await fetch("https://gorro.online/tickets", {
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
        throw new Error(`Failed to fetch tickets: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTickets(Array.isArray(data.data) ? data.data : []);
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
    fetchTickets();
  }, [router]);

  const mapStatus = (status: string): "open" | "snoozed" | "closed" => {
    if (status === "pending" || status === "open") return "open";
    if (status === "in-progress" || status === "in_progress" || status === "snoozed") return "snoozed";
    if (status === "resolved" || status === "closed") return "closed";
    return "closed";
  };

  const formatTicketId = (id: number) => `#${id.toString().padStart(6, "0")}`;

  const sidebarItems = [
    { name: "Overview", icon: <BarChart3 className="text-xl" /> },
    { name: "Tags", icon: <Tag className="text-xl" /> },
    { name: "Agents", icon: <Users className="text-xl" /> },
    { name: "Customers", icon: <User className="text-xl" /> },
  ];

  const filteredTickets = Array.isArray(tickets) ? tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.message.toLowerCase().includes(query) ||
      ticket.email.toLowerCase().includes(query) ||
      ticket.fullName.toLowerCase().includes(query) ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.id.toString().includes(query)
    );
  }) : [];

  const stats = [
    { label: "Total Tickets", value: filteredTickets.length.toString(), change: "", changeType: "neutral" },
    { label: "Open Tickets", value: filteredTickets.filter(t => mapStatus(t.status) === "open").length.toString(), change: "", changeType: "neutral" },
    { label: "In Progress", value: filteredTickets.filter(t => mapStatus(t.status) === "snoozed").length.toString(), change: "", changeType: "neutral" },
    { label: "Resolved Tickets", value: filteredTickets.filter(t => mapStatus(t.status) === "closed").length.toString(), change: "", changeType: "neutral" },
    { label: "Pending Response", value: filteredTickets.filter(t => t.status === "pending").length.toString(), change: "", changeType: "neutral" },
  ];

  const ticketCategories = [
    { name: "All", count: Array.isArray(tickets) ? tickets.length : 0 },
    { name: "Open", count: Array.isArray(tickets) ? tickets.filter(t => mapStatus(t.status) === "open").length : 0 },
    { name: "In Progress", count: Array.isArray(tickets) ? tickets.filter(t => mapStatus(t.status) === "snoozed").length : 0 },
    { name: "Resolved", count: Array.isArray(tickets) ? tickets.filter(t => mapStatus(t.status) === "closed").length : 0 },
  ];

  const openTickets = filteredTickets.filter((t) => mapStatus(t.status) === "open");
  const snoozedTickets = filteredTickets.filter((t) => mapStatus(t.status) === "snoozed");
  const closedTickets = filteredTickets.filter((t) => mapStatus(t.status) === "closed");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gorro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Support</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Tickets
            </p>
            {ticketCategories.map((category) => (
              <button
                key={category.name}
                className="w-full flex items-center justify-between px-4 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <span className="font-medium">{category.name}</span>
                <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Need Help?</p>
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">{`Welcome back! Here's what's happening. `}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                {stat.change && (
                  <p
                    className={`text-sm font-medium ${
                      stat.changeType === "increase"
                        ? "text-green-600 dark:text-green-400"
                        : stat.changeType === "decrease"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {stat.change}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Recent Tickets Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Tickets</h3>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>

                <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium whitespace-nowrap">
                  See All
                </a>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tickets...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                  <p className="font-semibold mb-2">Access Denied</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No tickets found</p>
              </div>
            ) : (
              /* Ticket Columns */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Open Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Open ({openTickets.length})</h4>
                  </div>
                  <div className="space-y-3">
                    {openTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{formatTicketId(ticket.id)}</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {ticket.status}
                          </span>
                        </div>
                        {ticket.subject && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{ticket.subject}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.email}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">In Progress ({snoozedTickets.length})</h4>
                  </div>
                  <div className="space-y-3">
                    {snoozedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{formatTicketId(ticket.id)}</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {ticket.status}
                          </span>
                        </div>
                        {ticket.subject && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{ticket.subject}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.email}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolved Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Resolved ({closedTickets.length})</h4>
                  </div>
                  <div className="space-y-3">
                    {closedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{formatTicketId(ticket.id)}</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {ticket.status}
                          </span>
                        </div>
                        {ticket.subject && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{ticket.subject}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="text-xs text-gray-500 dark:text-gray-400 w-4 h-4" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.email}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div
          // className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          className="fixed inset-0  bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTicketId(selectedTicket.id)}
                </h3>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mt-1 inline-block">
                  {selectedTicket.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Customer Name</p>
                <p className="text-gray-900 dark:text-white font-medium">{selectedTicket.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-gray-900 dark:text-white">{selectedTicket.email}</p>
              </div>
              {selectedTicket.subject && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedTicket.subject}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Message</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {selectedTicket.message}
                </p>
              </div>
              {selectedTicket.remarks && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Resolution Remarks</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    {selectedTicket.remarks}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Updated</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {mapStatus(selectedTicket.status) === "snoozed" && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Closing Remarks</p>
                  <textarea
                    value={closeRemarks}
                    onChange={(e) => setCloseRemarks(e.target.value)}
                    placeholder="Add remarks about how this ticket was resolved..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              {mapStatus(selectedTicket.status) === "open" && (
                <button
                  onClick={() => updateTicketStatus(selectedTicket.id, "accept")}
                  disabled={updatingTicket}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {updatingTicket ? "Accepting..." : "Accept Ticket"}
                </button>
              )}
              {mapStatus(selectedTicket.status) === "snoozed" && (
                <button
                  onClick={() => updateTicketStatus(selectedTicket.id, "close")}
                  disabled={updatingTicket || !closeRemarks.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  {updatingTicket ? "Closing..." : "Close Ticket"}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setCloseRemarks("");
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
