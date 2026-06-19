"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Info, ChevronLeft, ChevronRight, LogOut, CheckCircle2, AlertCircle, Plus, Trash2, Home, Rocket, FileText, Target, Menu, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type User = {
  id: number | string;
  username: string | null;
  profilePicture: string | null;
};

type CustomFieldOption = {
  id: string;
  label: string;
};

function SearchableCombobox({
  users,
  isLoading,
  value,
  onChange,
  placeholder,
  name,
}: {
  users: User[];
  isLoading: boolean;
  value: string | number;
  onChange: (e: any) => void;
  placeholder: string;
  name: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query when closing without selection
        if (!value) setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredUsers = query === ""
    ? users
    : users.filter((u) => (u.username || "").toLowerCase().includes(query.toLowerCase()));

  const selectedUser = users.find(u => u.id === value || u.id.toString() === value?.toString());
  const displayValue = isOpen ? query : (selectedUser ? (selectedUser.username || "Unknown User") : "");

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold outline-none disabled:opacity-50 transition-colors shadow-sm"
        placeholder={isLoading ? "Loading users..." : placeholder}
        disabled={isLoading}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
          if (value) onChange({ target: { name, value: "" } });
        }}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && !isLoading && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-xl text-gray-900 dark:text-gray-100">
          {filteredUsers.length === 0 ? (
            <li className="p-2 text-gray-500 dark:text-gray-400">No users found...</li>
          ) : (
            filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => {
                  onChange({ target: { name, value: user.id } });
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username || "Unknown User"} className="w-6 h-6 rounded-full mr-3 object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mr-3 font-semibold shrink-0">
                    {(user.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate">{user.username || "Unknown User"}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function LeaveTurnoverForm() {
  const [formData, setFormData] = useState({
    taskName: "",
    applicant: "",
    vertical: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    leadAssignee: "",
    monthYear: "",
    taskDescription: "",
    geminiNotesLink: "",
  });

  const [clientTurnovers, setClientTurnovers] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [verticalOptions, setVerticalOptions] = useState<CustomFieldOption[]>([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<CustomFieldOption[]>([]);
  const [fieldIds, setFieldIds] = useState({
    verticalFieldId: "",
    leaveTypeFieldId: "",
    applicantFieldId: "",
    geminiNotesFieldId: "",
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchFieldOptions() {
      setLoadingFields(true);
      try {
        const res = await fetch("/api/turnover/fields");
        if (res.ok) {
          const data = await res.json();
          setVerticalOptions(Array.isArray(data.verticalOptions) ? data.verticalOptions : []);
          setLeaveTypeOptions(Array.isArray(data.leaveTypeOptions) ? data.leaveTypeOptions : []);
          setFieldIds({
            verticalFieldId: data.verticalFieldId || "",
            leaveTypeFieldId: data.leaveTypeFieldId || "",
            applicantFieldId: data.applicantFieldId || "",
            geminiNotesFieldId: data.geminiNotesFieldId || "",
          });
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("Failed to fetch custom field options", errorData);
        }
      } catch (e) {
        console.error("Error fetching custom field options", e);
      } finally {
        setLoadingFields(false);
      }
    }

    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.users || []);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (e) {
        console.error("Error fetching users", e);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchFieldOptions();
    fetchUsers();
  }, []);

  const selectedVerticalOption = verticalOptions.find((option) => option.id === formData.vertical);
  const selectedLeaveTypeOption = leaveTypeOptions.find((option) => option.id === formData.leaveType);

  const showGeminiNotes = ["Client Services", "Project Management", "Relationship Management", "CSO"].includes(
    selectedVerticalOption?.label || ""
  );

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addClientTurnover = () => {
    setClientTurnovers((prev) => [
      ...prev,
      {
        subtaskName: "",
        subtaskAssignee: "",
        subtaskDescription: "",
      },
    ]);
  };

  const removeClientTurnover = (index: number) => {
    setClientTurnovers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, field: string, value: string | number) => {
    const updatedTurnovers = [...clientTurnovers];
    updatedTurnovers[index][field] = value;
    setClientTurnovers(updatedTurnovers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get the display names for the selected IDs to send in the description
    const applicantUser = users.find(u => u.id.toString() === formData.applicant.toString());
    const leadAssigneeUser = users.find(u => u.id.toString() === formData.leadAssignee.toString());

    const finalData = {
      ...formData,
      verticalLabel: selectedVerticalOption?.label || "",
      leaveTypeLabel: selectedLeaveTypeOption?.label || "",
      verticalFieldId: fieldIds.verticalFieldId,
      leaveTypeFieldId: fieldIds.leaveTypeFieldId,
      applicantFieldId: fieldIds.applicantFieldId,
      geminiNotesFieldId: fieldIds.geminiNotesFieldId,
      applicantName: applicantUser ? applicantUser.username : "",
      leadAssigneeName: leadAssigneeUser ? leadAssigneeUser.username : "",
      clientTurnovers,
    };

    try {
      const res = await fetch('/api/turnover/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await res.json();
        alert(`Failed to submit: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Logo logic
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const logoColor = currentTheme === "dark" ? "gold" : "purple";
  const logoOrientation = isSidebarCollapsed ? "vertical" : "horizontal";
  const logoPath = `/logos/logo-${logoColor}-${logoOrientation}.svg`;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">

        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shrink-0 transition-colors relative z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="h-8">
              {mounted && (
                <img
                  src={`/logos/logo-${logoColor}-horizontal.svg`}
                  alt="Skyrocket Logo"
                  className="h-full w-auto object-contain"
                />
              )}
            </div>
          </div>
          {mounted && (
            <div className="flex gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          )}
        </header>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-gray-800 z-40 overflow-y-auto flex flex-col transition-colors">
            <div className="flex-1 px-4 py-6 space-y-4">
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/'); }}
                className={`flex items-center gap-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors w-full px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <Home size={22} className="shrink-0" />
                <span className="text-base font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/mission-intake'); }}
                className={`flex items-center gap-3 text-gray-500 hover:text-brand-purple dark:text-gray-400 dark:hover:text-brand-gold transition-colors w-full px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <Rocket size={22} className="shrink-0" />
                <span className="text-base font-medium">Mission Intake Form</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/turnover'); }}
                className={`flex items-center gap-3 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 transition-colors w-full px-4 py-3 rounded-xl`}
              >
                <FileText size={22} className="shrink-0" />
                <span className="text-base font-medium">Turnover Form</span>
              </button>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {session?.user && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50 mb-4">
                  <img
                    src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || "User")}&background=random`}
                    alt={session.user.name || "User"}
                    className="w-10 h-10 rounded-full border-2 border-brand-purple dark:border-brand-gold"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tighter font-semibold">Authorized Member</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={22} className="shrink-0" />
                <span className="text-base font-medium">Clear Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Dashboard Left */}
        <aside
          className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between hidden md:flex transition-all duration-300 relative group`}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-20 opacity-0 group-hover:opacity-100"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="p-4 flex flex-col items-center">
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? "w-12" : "w-48"} mb-8`}>
              {mounted ? (
                <img
                  src={logoPath}
                  alt="Skyrocket Logo"
                  className="w-full h-auto object-contain transition-all duration-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-gray-700 border-2 border-dashed border-blue-300 dark:border-gray-500 flex items-center justify-center">
                  <div className="animate-pulse bg-blue-200 dark:bg-gray-600 w-8 h-8 rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 px-4 overflow-y-auto mt-4 space-y-2">
            <button
              onClick={() => router.push('/')}
              className={`flex items-center gap-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${isSidebarCollapsed ? "justify-center" : ""}`}
              title="Dashboard"
            >
              <Home size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </button>
            <button
              onClick={() => router.push('/mission-intake')}
              className={`flex items-center gap-3 text-gray-500 hover:text-brand-purple dark:text-gray-400 dark:hover:text-brand-gold transition-colors w-full px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${isSidebarCollapsed ? "justify-center" : ""}`}
              title="Mission Intake Form"
            >
              <Rocket size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Mission Intake Form</span>}
            </button>
            <button
              onClick={() => router.push('/turnover')}
              className={`flex items-center gap-3 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 transition-colors w-full px-2 py-2 rounded-lg group ${isSidebarCollapsed ? "justify-center" : ""}`}
              title="Turnover Form"
            >
              <FileText size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Turnover Form</span>}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="px-4 overflow-hidden mb-4">
            {mounted && session?.user && (
              <div className={`flex items-center gap-3 transition-all ${isSidebarCollapsed ? "justify-center pb-2 pt-1" : "p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50"}`}>
                <div className="relative shrink-0">
                  <img
                    src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || "User")}&background=random`}
                    alt={session.user.name || "User"}
                    className="w-10 h-10 rounded-full border-2 border-brand-purple dark:border-brand-gold shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tighter font-semibold">Authorized Member</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {mounted && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={`flex items-center gap-3 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors w-full px-2 group ${isSidebarCollapsed ? "justify-center" : ""}`}
                title="Log Out"
              >
                <div className="p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                  <LogOut size={18} />
                </div>
                {!isSidebarCollapsed && <span className="text-sm font-medium">Clear Session</span>}
              </button>
            )}

            {/* Theme Switcher Bottom */}
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? "items-center" : ""}`}>
              {!isSidebarCollapsed && (
                <div className="px-2 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Theme Options
                </div>
              )}
              {mounted && (
                <div className={`flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-full justify-between items-center text-sm ${isSidebarCollapsed ? "flex-col gap-1" : ""}`}>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'} ${isSidebarCollapsed ? "w-full" : ""}`}
                    title="Light Mode"
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-blue-400 border border-gray-600' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'} ${isSidebarCollapsed ? "w-full" : ""}`}
                    title="Dark Mode"
                  >
                    <Moon size={16} />
                  </button>
                  {!isSidebarCollapsed && (
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-600' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                      title="System Configuration"
                    >
                      <Monitor size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Form Overflow Side */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          <div className="w-full max-w-3xl bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border h-fit mb-12 transition-colors">

            {isSubmitted && mounted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-brand-purple/10 border-brand-purple shadow-[0_0_30px_rgba(114,28,84,0.3)] dark:bg-brand-gold/10 dark:border-brand-gold dark:shadow-[0_0_30px_rgba(226,189,157,0.3)] rounded-full flex items-center justify-center mb-6 border-2 transition-all">
                  <svg className="w-12 h-12 text-brand-purple dark:text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Turnover Submitted Successfully!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm">The main task and client subtasks have been created inside ClickUp natively.</p>

                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      taskName: "",
                      applicant: "",
                      vertical: "",
                      leaveType: "",
                      startDate: "",
                      endDate: "",
                      leadAssignee: "",
                      monthYear: "",
                      taskDescription: "",
                      geminiNotesLink: "",
                    });

                    setClientTurnovers([]);
                  }}
                  className="bg-card hover:bg-gray-50 dark:hover:bg-gray-700 border border-border text-foreground font-medium py-3 px-6 rounded-custom transition-all shadow-sm"
                >
                  Fill out another turnover form
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4">Leave Turnover Form</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Task Name</label>
                            <Info size={14} className="text-gray-400 dark:text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Provide a clear and concise name for this turnover.</p></TooltipContent>
                      </Tooltip>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Enter [Your Name] - [Start date of leave]. For example: Juan Dela Cruz - Oct 16, 2025
                      </p>
                      <input 
                        type="text" 
                        name="taskName" 
                        value={formData.taskName}
                        onChange={handleInputChange} 
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold outline-none transition-colors" 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Applicant</label>
                              <Info size={14} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>The person who is going on leave.</p></TooltipContent>
                        </Tooltip>
                        <SearchableCombobox
                          name="applicant"
                          users={users}
                          isLoading={loadingUsers}
                          value={formData.applicant}
                          onChange={handleInputChange}
                          placeholder="Select Applicant..."
                        />
                      </div>

                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Vertical</label>
                              <Info size={14} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>The department or team this turnover belongs to.</p></TooltipContent>
                        </Tooltip>
                        <select
                          name="vertical"
                          value={formData.vertical}
                          onChange={handleInputChange}
                          disabled={loadingFields}
                          className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none appearance-none transition-colors disabled:opacity-50"
                        >
                          <option value="">Select Vertical...</option>
                          {verticalOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {showGeminiNotes && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/50 rounded-lg transition-colors">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                              <label className="block text-sm font-medium text-blue-800 dark:text-blue-300">Link to Gemini Notes - Turnover *</label>
                              <Info size={14} className="text-blue-500 dark:text-blue-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Link to the AI-generated turnover documentation.</p></TooltipContent>
                        </Tooltip>
                        <input 
                          type="url" 
                          name="geminiNotesLink" 
                          value={formData.geminiNotesLink}
                          onChange={handleInputChange} 
                          className="w-full bg-white dark:bg-gray-700 border border-blue-200 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                          required 
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Leave Type</label>
                        <select
                          name="leaveType"
                          value={formData.leaveType}
                          onChange={handleInputChange}
                          disabled={loadingFields}
                          className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none appearance-none transition-colors disabled:opacity-50"
                        >
                          <option value="">Select Type...</option>
                          {leaveTypeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Lead Assignee</label>
                              <Info size={14} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>The person who will take over the responsibilities.</p></TooltipContent>
                        </Tooltip>
                        <SearchableCombobox
                          name="leadAssignee"
                          users={users}
                          isLoading={loadingUsers}
                          value={formData.leadAssignee}
                          onChange={handleInputChange}
                          placeholder="Select Assignee..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          value={formData.startDate}
                          onChange={handleInputChange} 
                          className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none transition-colors dark:[color-scheme:dark]" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">End Date</label>
                        <input 
                          type="date" 
                          name="endDate" 
                          value={formData.endDate}
                          onChange={handleInputChange} 
                          className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none transition-colors dark:[color-scheme:dark]" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Task Description</label>
                      <textarea 
                        name="taskDescription" 
                        value={formData.taskDescription}
                        onChange={handleInputChange} 
                        rows={3} 
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold outline-none transition-colors"
                      ></textarea>
                    </div>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-700 my-8 transition-colors" />

                  {/* Dynamic Client Turnovers (will become subtasks) */}
                  <div id="client-turnovers-field">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1 cursor-help w-max">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Client Turnovers</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={14} className="text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent><p>Each client becomes a specific client turnover subtask.</p></TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Add clients to generate specific subtask fields.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addClientTurnover}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-600/80 dark:hover:text-blue-400/80 transition-colors px-3 py-1.5 rounded-lg border border-blue-600/20 dark:border-blue-400/20 hover:bg-blue-600/5 dark:hover:bg-blue-400/5"
                      >
                        <Plus size={14} />
                        Add Client
                      </button>
                    </div>

                    {clientTurnovers.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <Target size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">No clients added yet. Click &quot;Add Client&quot; to begin.</p>
                      </div>
                    )}

                    <div className="space-y-6">
                      {clientTurnovers.map((subtask, index) => (
                        <div key={index} className="p-5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">Client {index + 1} Turnover</h3>
                            <button
                              type="button"
                              onClick={() => removeClientTurnover(index)}
                              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Remove client"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="space-y-4">
                          <div>
                            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Subtask Name</label>
                            <input 
                              type="text" 
                              value={subtask.subtaskName}
                              onChange={(e) => handleSubtaskChange(index, 'subtaskName', e.target.value)} 
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold transition-colors shadow-sm" 
                              required 
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Subtask Assignee</label>
                            <SearchableCombobox
                              name="subtaskAssignee"
                              users={users}
                              isLoading={loadingUsers}
                              value={subtask.subtaskAssignee}
                              onChange={(e) => handleSubtaskChange(index, 'subtaskAssignee', e.target.value)}
                              placeholder="Select Assignee..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Subtask Description</label>
                            <textarea 
                              rows={2} 
                              value={subtask.subtaskDescription}
                              onChange={(e) => handleSubtaskChange(index, 'subtaskDescription', e.target.value)} 
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold transition-colors shadow-sm"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-8 bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900 dark:shadow-[0_0_20px_rgba(226,189,157,0.2)] font-bold py-3 px-4 rounded-custom transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting to ClickUp...
                      </>
                    ) : (
                      "Submit Turnover Form"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
