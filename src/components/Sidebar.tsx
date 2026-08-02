"use client";

import { useRouter } from "next/navigation";
import { BarChart3, Tag, Users, User, X, LogOut } from "lucide-react";
import { ReactNode } from "react";

interface SidebarItem {
  name: string;
  icon: ReactNode;
  path: string;
  active?: boolean;
}

interface TicketCategory {
  name: string;
  count: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePath?: string;
  ticketCategories?: TicketCategory[];
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

export default function Sidebar({ isOpen, onClose, activePath, ticketCategories, selectedCategory, onCategorySelect }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const sidebarItems: SidebarItem[] = [
    { name: "Overview", icon: <BarChart3 className="text-xl" />, path: "/dashboard" },
    { name: "Tags", icon: <Tag className="text-xl" />, path: "#" },
    { name: "Agents", icon: <Users className="text-xl" />, path: "#" },
    { name: "Customers", icon: <User className="text-xl" />, path: "/dashboard/customers" },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gorro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Support</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.name}
            onClick={() => item.path && item.path !== "#" && router.push(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activePath === item.path
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </button>
        ))}

        {ticketCategories && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Tickets
            </p>
            {ticketCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => onCategorySelect && onCategorySelect(category.name)}
                className={`w-full flex items-center justify-between px-4 py-2 text-left rounded-lg transition-colors ${
                  selectedCategory === category.name
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span className={`text-sm px-2 py-0.5 rounded-full ${
                  selectedCategory === category.name
                    ? "bg-blue-200 dark:bg-blue-800"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
