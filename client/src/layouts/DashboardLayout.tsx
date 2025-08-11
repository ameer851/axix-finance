import CustomerSupport from "@/components/CustomerSupport";
import GoogleTranslate from "@/components/GoogleTranslate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  History,
  Home,
  LineChart,
  LogOut,
  Menu,
  Share2,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, logout, updateUserBalance } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Good day");
  const { toast } = useToast();

  // Search functionality
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting("Good morning");
    } else if (hours < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle navigation and cleanup
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, show a toast
      toast({
        title: "Logout completed",
        description: "You have been logged out.",
        variant: "default",
      });
    }
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      path: "/deposit",
      label: "Deposit",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      path: "/deposit-list",
      label: "Deposit List",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      path: "/withdraw",
      label: "Withdraw",
      icon: <ArrowLeftRight className="h-5 w-5" />,
    },
    {
      path: "/history",
      label: "History",
      icon: <History className="h-5 w-5" />,
      subItems: [
        {
          path: "/deposits-history",
          label: "Deposits History",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          path: "/withdrawal-history",
          label: "Withdrawal History",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
      ],
    },
    {
      path: "/referrals",
      label: "Referrals",
      icon: <Share2 className="h-5 w-5" />,
    },
    {
      path: "/marketing",
      label: "Marketing",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      path: "/edit-account",
      label: "Edit Account",
      icon: <Edit className="h-5 w-5" />,
    },
    {
      path: "#",
      label: "Logout",
      icon: <LogOut className="h-5 w-5" />,
      onClick: handleLogout,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part?.[0] || "")
      .join("")
      .toUpperCase();
  };

  const userInitials = user
    ? user.firstName && user.lastName
      ? getInitials(`${user.firstName} ${user.lastName}`)
      : user.username
        ? getInitials(user.username)
        : user.email
          ? getInitials(user.email)
          : "U"
    : "U";

  const userName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.email || "User"
    : "User";

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsSearching(true);

    // Simulate searching through items
    const results = [
      ...navItems
        .filter((item) =>
          item.label.toLowerCase().includes(searchValue.toLowerCase())
        )
        .map((item) => ({
          type: "page",
          label: item.label,
          path: item.path,
        })),
    ];

    // Simulate an API call
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);

      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No matches for "${searchValue}"`,
          variant: "destructive",
        });
      }
    }, 500);
  };

  // Handle clearing search
  const clearSearch = () => {
    setSearchValue("");
    setSearchResults([]);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-neutral-900">
      {/* Sidebar - Desktop */}
      <div
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex flex-col w-full">
          <div className="flex flex-col h-0 flex-1 bg-primary text-white shadow-lg relative">
            {/* Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-12 bg-white dark:bg-neutral-700 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-600 z-10"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div
                className={`flex flex-col items-center flex-shrink-0 px-4 py-4 ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-primary font-bold mb-2">
                  <Avatar className="h-full w-full">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback className="bg-white text-primary text-xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {!sidebarCollapsed && (
                  <span className="text-lg font-medium text-white text-center">
                    {userName}
                  </span>
                )}
              </div>

              {/* Language Selector in Sidebar - Desktop only */}
              {!sidebarCollapsed && (
                <div className="px-4 pb-4">
                  {/* Language selector removed for admin panel */}
                </div>
              )}

              <nav className="mt-5 flex-1 px-2 bg-primary space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenu === item.label;
                  const isSubItemActive =
                    hasSubItems &&
                    item.subItems.some((subItem) => location === subItem.path);

                  // Handle logout button differently
                  if (item.onClick) {
                    return (
                      <div
                        key={item.label}
                        onClick={item.onClick}
                        className={`text-white hover:bg-primary-foreground/10 hover:text-white group flex ${sidebarCollapsed ? "justify-center" : ""} items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                        title={sidebarCollapsed ? item.label : ""}
                      >
                        <span className={sidebarCollapsed ? "" : "mr-3"}>
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && item.label}
                      </div>
                    );
                  }

                  // Items with sub-menus
                  if (hasSubItems) {
                    return (
                      <div key={item.label}>
                        <div
                          onClick={() => {
                            if (sidebarCollapsed) return;
                            setExpandedMenu(isExpanded ? null : item.label);
                          }}
                          className={`${
                            isActive || isSubItemActive
                              ? "bg-white text-primary"
                              : "text-white hover:bg-primary-foreground/10 hover:text-white"
                          } group flex ${sidebarCollapsed ? "justify-center" : ""} items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                          title={sidebarCollapsed ? item.label : ""}
                        >
                          <span className={sidebarCollapsed ? "" : "mr-3"}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </>
                          )}
                        </div>

                        {/* Sub-menu items */}
                        {!sidebarCollapsed && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = location === subItem.path;
                              return (
                                <Link key={subItem.path} href={subItem.path}>
                                  <div
                                    className={`${
                                      isSubActive
                                        ? "bg-white text-primary"
                                        : "text-white/80 hover:bg-primary-foreground/10 hover:text-white"
                                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                                  >
                                    <span className="mr-3">{subItem.icon}</span>
                                    {subItem.label}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Regular navigation items
                  return (
                    <Link key={item.path} href={item.path}>
                      <div
                        className={`${
                          isActive
                            ? "bg-white text-primary"
                            : "text-white hover:bg-primary-foreground/10 hover:text-white"
                        } group flex ${sidebarCollapsed ? "justify-center" : ""} items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                        title={sidebarCollapsed ? item.label : ""}
                      >
                        <span className={sidebarCollapsed ? "" : "mr-3"}>
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Removed user profile from bottom since it's now at the top */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-neutral-800 shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* REMOVE: Search bar */}
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Google Translate Widget */}
              <GoogleTranslate />

              {/* Mobile user dropdown */}
              <div className="ml-3 relative md:hidden">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-neutral-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    C
                  </div>
                  <span className="ml-2 text-xl font-bold text-primary">
                    Axix Finance
                  </span>
                </div>

                {/* Google Translate Widget in Mobile Menu */}
                <div className="px-4 pt-4 pb-2">
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Language
                    </div>
                    <GoogleTranslate />
                  </div>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navItems.map((item) => {
                    const isActive = location === item.path;
                    const hasSubItems =
                      item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedMenu === item.label;
                    const isSubItemActive =
                      hasSubItems &&
                      item.subItems.some(
                        (subItem) => location === subItem.path
                      );

                    // Handle logout button differently
                    if (item.onClick) {
                      return (
                        <div
                          key={item.label}
                          onClick={() => {
                            item.onClick();
                            setMobileMenuOpen(false);
                          }}
                          className={`text-primary hover:bg-primary/10 hover:text-primary-foreground group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer`}
                        >
                          <span className="mr-4 text-inherit">{item.icon}</span>
                          {item.label}
                        </div>
                      );
                    }

                    // Items with sub-menus
                    if (hasSubItems) {
                      return (
                        <div key={item.label}>
                          <div
                            onClick={() =>
                              setExpandedMenu(isExpanded ? null : item.label)
                            }
                            className={`${
                              isActive || isSubItemActive
                                ? "bg-primary text-white"
                                : "text-primary hover:bg-primary/10 hover:text-primary-foreground"
                            } group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer justify-between`}
                          >
                            <div className="flex items-center">
                              <span className="mr-4 text-inherit">
                                {item.icon}
                              </span>
                              {item.label}
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </div>

                          {/* Sub-menu items */}
                          {isExpanded && (
                            <div className="ml-4 mt-1 space-y-1">
                              {item.subItems.map((subItem) => {
                                const isSubActive = location === subItem.path;
                                return (
                                  <Link key={subItem.path} href={subItem.path}>
                                    <div
                                      onClick={() => setMobileMenuOpen(false)}
                                      className={`${
                                        isSubActive
                                          ? "bg-primary text-white"
                                          : "text-primary/80 hover:bg-primary/10 hover:text-primary"
                                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                                    >
                                      <span className="mr-3">
                                        {subItem.icon}
                                      </span>
                                      {subItem.label}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular navigation items
                    return (
                      <Link key={item.path} href={item.path}>
                        <a
                          className={`${
                            isActive
                              ? "bg-primary text-white"
                              : "text-primary hover:bg-primary/10 hover:text-primary-foreground"
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="mr-4 text-inherit">{item.icon}</span>
                          {item.label}
                        </a>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-primary/20 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={userName} />
                        <AvatarFallback className="bg-primary text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-primary">
                        {userName}
                      </p>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-primary/70 hover:text-primary flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-1" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-14">{/* Forceful spacing */}</div>
          </div>
        )}

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Verification Banner - disabled for all users */}
              {/* {user && !user.isVerified && <VerificationBanner />} */}

              {/* Welcome message */}

              <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome,{" "}
                  {user?.full_name ||
                    (user as any)?.name ||
                    (user as any)?.full_name ||
                    ((user as any)?.firstName && (user as any)?.lastName
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : (user as any)?.username) ||
                    (user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : null) ||
                    user?.username ||
                    user?.email ||
                    "User"}
                  !
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your investments and track your portfolio performance.
                </p>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Customer Support Floating Buttons */}
      {!location.startsWith("/admin") && (
        <CustomerSupport whatsappNumber="12709703891" />
      )}
    </div>
  );
};

export default DashboardLayout;
