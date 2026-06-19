"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Sun, Moon, Monitor, ChevronLeft, ChevronRight,
  LogOut, Plus, Trash2, Rocket, Target, Lightbulb,
  Trophy, Calendar, Users, Flame, X, AlertCircle, Home, FileText, Menu
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type User = {
  id: number | string;
  username: string | null;
  profilePicture: string | null;
};

type CustomFieldOption = {
  id: string;
  label: string;
};

type SolutionStep = {
  stepName: string;
  assigneeId: string | number;
  dueDate: string;
};

// ─── SearchableCombobox (Single Select) ──────────────────────────────────────

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

// ─── MultiSelectCombobox (Multi-User Chips) ──────────────────────────────────

function MultiSelectCombobox({
  users,
  isLoading,
  selectedIds,
  onChange,
  placeholder,
}: {
  users: User[];
  isLoading: boolean;
  selectedIds: (string | number)[];
  onChange: (ids: (string | number)[]) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableUsers = users.filter(
    (u) => !selectedIds.some((id) => id.toString() === u.id.toString())
  );

  const filteredUsers = query === ""
    ? availableUsers
    : availableUsers.filter((u) => (u.username || "").toLowerCase().includes(query.toLowerCase()));

  const selectedUsers = selectedIds
    .map((id) => users.find((u) => u.id.toString() === id.toString()))
    .filter(Boolean) as User[];

  const addUser = (userId: string | number) => {
    onChange([...selectedIds, userId]);
    setQuery("");
  };

  const removeUser = (userId: string | number) => {
    onChange(selectedIds.filter((id) => id.toString() !== userId.toString()));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Selected chips */}
      <div
        className="flex flex-wrap gap-2 min-h-[42px] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 cursor-text focus-within:ring-2 focus-within:ring-brand-purple dark:focus-within:ring-brand-gold transition-colors shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        {selectedUsers.map((user) => (
          <span
            key={user.id}
            className="inline-flex items-center gap-1.5 bg-brand-purple/10 dark:bg-brand-gold/10 text-brand-purple dark:text-brand-gold border border-brand-purple/20 dark:border-brand-gold/20 rounded-full px-2.5 py-0.5 text-sm font-medium"
          >
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-brand-purple dark:bg-brand-gold text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-bold shrink-0">
                {(user.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[120px]">{user.username || "Unknown"}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
              className="hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          placeholder={selectedIds.length === 0 ? (isLoading ? "Loading users..." : placeholder) : "Add more..."}
          disabled={isLoading}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {isOpen && !isLoading && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-xl text-gray-900 dark:text-gray-100">
          {filteredUsers.length === 0 ? (
            <li className="p-2 text-gray-500 dark:text-gray-400">
              {availableUsers.length === 0 ? "All users selected" : "No users found..."}
            </li>
          ) : (
            filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => { addUser(user.id); }}
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username || ""} className="w-6 h-6 rounded-full mr-3 object-cover" />
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

// ─── Section Header Component ────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accentColor = "brand-purple",
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className={`p-2.5 rounded-xl bg-brand-purple/10 dark:bg-brand-gold/10 text-brand-purple dark:text-brand-gold shrink-0 mt-0.5`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function MissionIntakeForm() {
  // ── Form state ──
  const [formData, setFormData] = useState({
    projectName: "",
    subtitle: "",
    solutionsComposition: "",
    missionLead: "",
    chaosChallenge: "",
    chaosMatter: "",
    solutionsActionPlan: "",
    inspirationUplift: "",
    inspirationMission: "",
    successMeasure: "",
    successImpact: "",
    typeCategory: "",
    typeSize: "",
    startDate: "",
    dueDate: "",
    timelineMilestones: "",
    ganttUrl: "",
  });

  const [proponents, setProponents] = useState<(string | number)[]>([]);
  const [solutionsSteps, setSolutionsSteps] = useState<SolutionStep[]>([]);

  // ── Fetched data ──
  const [users, setUsers] = useState<User[]>([]);
  const [compositionOptions, setCompositionOptions] = useState<CustomFieldOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CustomFieldOption[]>([]);
  const [sizeOptions, setSizeOptions] = useState<CustomFieldOption[]>([]);

  // ── UI state ──
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    targetId: string | null;
  }>({
    isOpen: false,
    message: "",
    targetId: null,
  });

  const showValidationError = (message: string, targetId: string | null) => {
    setValidationModal({ isOpen: true, message, targetId });
  };

  const closeValidationModal = () => {
    const targetId = validationModal.targetId;
    setValidationModal({ isOpen: false, message: "", targetId: null });
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el.querySelector('input');
          if (input) input.focus();
        }
      }, 100);
    }
  };

  // ── Logo logic ──
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const logoColor = currentTheme === "dark" ? "gold" : "purple";
  const logoOrientation = isSidebarCollapsed ? "vertical" : "horizontal";
  const logoPath = `/logos/logo-${logoColor}-${logoOrientation}.svg`;

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch dropdown options ──
  useEffect(() => {
    async function fetchFieldOptions() {
      setLoadingFields(true);
      try {
        const res = await fetch("/api/mission/fields");
        if (res.ok) {
          const data = await res.json();
          setCompositionOptions(Array.isArray(data.compositionOptions) ? data.compositionOptions : []);
          setCategoryOptions(Array.isArray(data.categoryOptions) ? data.categoryOptions : []);
          setSizeOptions(Array.isArray(data.sizeOptions) ? data.sizeOptions : []);
        } else {
          console.error("Failed to fetch field options");
        }
      } catch (e) {
        console.error("Error fetching field options", e);
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

  // ── Handlers ──
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addStep = () => {
    setSolutionsSteps((prev) => [...prev, { stepName: "", assigneeId: "", dueDate: "" }]);
  };

  const removeStep = (index: number) => {
    setSolutionsSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof SolutionStep, value: string | number) => {
    setSolutionsSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      projectName: "", subtitle: "", solutionsComposition: "", missionLead: "",
      chaosChallenge: "", chaosMatter: "", solutionsActionPlan: "",
      inspirationUplift: "", inspirationMission: "", successMeasure: "",
      successImpact: "", typeCategory: "", typeSize: "", startDate: "",
      dueDate: "", timelineMilestones: "", ganttUrl: "",
    });
    setProponents([]);
    setSolutionsSteps([]);
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (proponents.length === 0) {
      showValidationError("Please select at least one Proponent.", "proponents-field");
      return;
    }

    if (!formData.missionLead) {
      showValidationError("Please select a Mission Lead.", "mission-lead-field");
      return;
    }

    if (solutionsSteps.length === 0) {
      showValidationError("Please add at least one Solution Step.", "solution-steps-field");
      return;
    }

    const hasEmptyStep = solutionsSteps.some(step => !step.stepName || !step.assigneeId || !step.dueDate);
    if (hasEmptyStep) {
      showValidationError("Please fill out all fields in all Solution Steps.", "solution-steps-field");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      proponents,
      solutionsSteps,
    };

    try {
      const res = await fetch("/api/mission/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // ── Shared input classes ──
  const inputClass = "w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-custom p-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold outline-none transition-colors";
  const selectClass = `${inputClass} appearance-none disabled:opacity-50`;
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

  // ── Render ──
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">

        {/* ───── Mobile Header ───── */}
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
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
                className={`flex items-center gap-3 text-brand-purple dark:text-brand-gold bg-brand-purple/10 dark:bg-brand-gold/10 transition-colors w-full px-4 py-3 rounded-xl`}
              >
                <Rocket size={22} className="shrink-0" />
                <span className="text-base font-medium">Mission Intake Form</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); router.push('/turnover'); }}
                className={`flex items-center gap-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors w-full px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50`}
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

        {/* ───── Sidebar ───── */}
        <aside
          className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between hidden md:flex transition-all duration-300 relative group`}
        >
          {/* Collapse Toggle */}
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
              className={`flex items-center gap-3 text-gray-500 hover:text-brand-purple dark:text-gray-400 dark:hover:text-brand-gold transition-colors w-full px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${isSidebarCollapsed ? "justify-center" : ""}`}
              title="Dashboard"
            >
              <Home size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </button>
            <button
              onClick={() => router.push('/mission-intake')}
              className={`flex items-center gap-3 text-brand-purple dark:text-brand-gold bg-brand-purple/10 dark:bg-brand-gold/10 transition-colors w-full px-2 py-2 rounded-lg group ${isSidebarCollapsed ? "justify-center" : ""}`}
              title="Mission Intake Form"
            >
              <Rocket size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Mission Intake Form</span>}
            </button>
            <button
              onClick={() => router.push('/turnover')}
              className={`flex items-center gap-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${isSidebarCollapsed ? "justify-center" : ""}`}
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

            {/* Theme Switcher */}
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? "items-center" : ""}`}>
              {!isSidebarCollapsed && (
                <div className="px-2 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Theme Options
                </div>
              )}
              {mounted && (
                <div className={`flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-full justify-between items-center text-sm ${isSidebarCollapsed ? "flex-col gap-1" : ""}`}>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === "light" ? "bg-white shadow-sm text-blue-600 border border-gray-200" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"} ${isSidebarCollapsed ? "w-full" : ""}`}
                    title="Light Mode"
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === "dark" ? "bg-gray-700 shadow-sm text-blue-400 border border-gray-600" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"} ${isSidebarCollapsed ? "w-full" : ""}`}
                    title="Dark Mode"
                  >
                    <Moon size={16} />
                  </button>
                  {!isSidebarCollapsed && (
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex-1 flex justify-center py-2 rounded-md transition-all ${theme === "system" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-600" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
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

        {/* ───── Main Content ───── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          <div className="w-full max-w-3xl bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border h-fit mb-12 transition-colors">

            {/* ── Success State ── */}
            {isSubmitted && mounted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-brand-purple/10 border-brand-purple shadow-[0_0_30px_rgba(114,28,84,0.3)] dark:bg-brand-gold/10 dark:border-brand-gold dark:shadow-[0_0_30px_rgba(226,189,157,0.3)] rounded-full flex items-center justify-center mb-6 border-2 transition-all">
                  <Rocket className="w-12 h-12 text-brand-purple dark:text-brand-gold" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Mission Submitted!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm">
                  Your mission has been created in ClickUp with all subtasks and assignments.
                </p>
                <button
                  onClick={resetForm}
                  className="bg-card hover:bg-gray-50 dark:hover:bg-gray-700 border border-border text-foreground font-medium py-3 px-6 rounded-custom transition-all shadow-sm"
                >
                  Submit another mission
                </button>
              </div>
            ) : (
              <>
                {/* ── Form Header ── */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Rocket size={24} className="text-brand-purple dark:text-brand-gold" />
                    Mission Intake Form
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Mission Control System — Define and submit a new mission to ClickUp.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 1: Mission Identity
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Rocket}
                      title="Mission Identity"
                      subtitle="Give your mission a name and a subtitle."
                    />
                    <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-200 mb-8 mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Give your mission a name that clearly explains what it builds or fixes. Aim for 4 to 8 words for the subtitle so the mission is still easy to understand in the mission log.</li>
                        <li>You may optionally include a creative project title followed by a descriptive subtitle.</li>
                        <li>The subtitle must still clearly explain the output or improvement created by the mission.</li>
                        <li>Ask yourself: If someone only read the subtitle, would they understand what this mission produces?</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Project Name</label>
                        <input
                          type="text"
                          name="projectName"
                          value={formData.projectName}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="e.g. Operation Nebula"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Subtitle</label>
                        <input
                          type="text"
                          name="subtitle"
                          value={formData.subtitle}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="A brief tagline or description"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 2: Mission Proponent(s)
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Users}
                      title="Mission Proponent(s)"
                      subtitle="Who is behind this mission?"
                    />

                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Composition</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">Identify whether the mission is executed by an individual or a team.</p>
                        <select
                          name="solutionsComposition"
                          value={formData.solutionsComposition}
                          onChange={handleInputChange}
                          disabled={loadingFields}
                          className={selectClass}
                          required
                        >
                          <option value="">Select composition...</option>
                          {compositionOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div id="proponents-field">
                        <label className={labelClass}>Proponents</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">Tag every person actively building or delivering this mission.</p>
                        <MultiSelectCombobox
                          users={users}
                          isLoading={loadingUsers}
                          selectedIds={proponents}
                          onChange={setProponents}
                          placeholder="Search and select proponents..."
                        />
                      </div>

                      <div id="mission-lead-field">
                        <label className={labelClass}>Mission Lead</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">Tag your direct vertical lead who is responsible for reviewing and approving the mission before it begins.</p>
                        <SearchableCombobox
                          name="missionLead"
                          users={users}
                          isLoading={loadingUsers}
                          value={formData.missionLead}
                          onChange={handleInputChange}
                          placeholder="Select Mission Lead..."
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 3: Create Chaos
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Flame}
                      title="Create Chaos"
                      subtitle="What problem or challenge is this mission addressing?"
                    />
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>What is the challenge?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Describe the specific problem, gap, or inefficiency that triggered this mission. Be specific about the context. Simply saying "there is no X" is not enough, explain what happens because it does not exist.</li>
                            <li>Write 2 to 4 sentences that answer:
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>What is currently broken, missing, or slower than it should be?</li>
                                <li>Which team, process, client account, or tool is affected?</li>
                                <li>What problems occur because this does not exist?</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="chaosChallenge"
                          value={formData.chaosChallenge}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="Describe the challenge or problem..."
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Why does it matter?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Explain why fixing this problem matters for Skyrocket. Describe the cost of doing nothing and the risk to the organization if the issue is never addressed.</li>
                            <li>Write 2 to 3 sentences that answer:
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>If nothing is ever done about this, what does that cost Skyrocket?</li>
                                <li>What operational, client, or business risk does this create?</li>
                                <li>Why does this matter beyond your own team?</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="chaosMatter"
                          value={formData.chaosMatter}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="Why is this important to address?"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 4: The Plan
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Target}
                      title="The Plan"
                      subtitle="How will you solve the problem? Break it into actionable steps."
                    />
                    <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-200 mb-8 mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Describe the overall strategy you will use to solve the problem. Focus on the big picture approach, not individual tasks. Think of this as your pitch to your Mission Lead explaining how the problem will be solved and why this approach works.</li>
                        <li>Write 2 to 3 sentences that answer:
                          <ul className="list-[circle] pl-5 mt-1 space-y-1">
                            <li>What is your core method? What will you do to address the problem?</li>
                            <li>Why will this approach work?</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Action Plan Overview</label>
                        <textarea
                          name="solutionsActionPlan"
                          value={formData.solutionsActionPlan}
                          onChange={handleInputChange}
                          rows={4}
                          className={textareaClass}
                          placeholder="Describe your overall approach and strategy..."
                          required
                        />
                      </div>

                      {/* Dynamic Solution Steps (will become subtasks) */}
                      <div id="solution-steps-field">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 items-start">
                          <div>
                            <label className={labelClass}>Solution Steps</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Each step becomes a ClickUp subtask under the main mission.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addStep}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple dark:text-brand-gold hover:text-brand-purple/80 dark:hover:text-brand-gold/80 transition-colors px-3 py-1.5 rounded-lg border border-brand-purple/20 dark:border-brand-gold/20 hover:bg-brand-purple/5 dark:hover:bg-brand-gold/5"
                          >
                            <Plus size={14} />
                            Add Step
                          </button>
                        </div>

                        {solutionsSteps.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <Target size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">No steps added yet. Click &quot;Add Step&quot; to begin.</p>
                          </div>
                        )}

                        <div className="space-y-3">
                          {solutionsSteps.map((step, index) => (
                            <div
                              key={index}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-brand-purple dark:text-brand-gold">
                                  Step {index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeStep(index)}
                                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Remove step"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Step Name</label>
                                  <input
                                    type="text"
                                    value={step.stepName}
                                    onChange={(e) => updateStep(index, "stepName", e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold transition-colors shadow-sm text-sm"
                                    placeholder="What needs to be done?"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Assignee</label>
                                  <SearchableCombobox
                                    name={`step-assignee-${index}`}
                                    users={users}
                                    isLoading={loadingUsers}
                                    value={step.assigneeId}
                                    onChange={(e) => updateStep(index, "assigneeId", e.target.value)}
                                    placeholder="Assign to..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Due Date</label>
                                  <input
                                    type="date"
                                    value={step.dueDate || ""}
                                    onChange={(e) => updateStep(index, "dueDate", e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-custom p-2 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-purple dark:focus:ring-brand-gold transition-colors shadow-sm text-sm"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 5: The Impact
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Lightbulb}
                      title="The Impact"
                      subtitle="What positive change will this mission create?"
                    />
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>How will this uplift the team or company?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Describe how this mission improves the experience of the team or future Voyagers. Focus on the human impact after the mission is completed.</li>
                            <li>Write 2 to 3 sentences that answer:
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>What changes for people in the months after this is done?</li>
                                <li>Does it reduce a frustration the team has been living with?</li>
                                <li>Does it build a skill, habit, or system that outlasts this mission?</li>
                                <li>Does it make future Voyagers' lives easier in a measurable way?</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="inspirationUplift"
                          value={formData.inspirationUplift}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="Describe the uplift this creates..."
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>How does this align with our mission?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Connect your mission to the three pillars of Skyrocket's mission — one sentence each.
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>Create chaos — What problem or gap are you surfacing or disrupting?</li>
                                <li>Solve problems — What specific issue does your output fix?</li>
                                <li>Inspire people — What improves for the team, a client, or Skyrocket?</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="inspirationMission"
                          value={formData.inspirationMission}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="How does this connect to our broader mission?"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 6: Defining Success
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Trophy}
                      title="Defining Success"
                      subtitle="How will you know this mission succeeded?"
                    />
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>How will success be measured?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Describe the specific, verifiable condition that proves the mission is complete. A strong success measure can be checked by someone who was not involved in the mission. The outcome must include measurable evidence that can be verified by PMO.</li>
                            <li>Avoid statements like "the team will be more efficient" or "the output will be complete." Those are intentions, not proof.</li>
                            <li>Write 1 to 2 sentences that include measurable proof such as:
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>a number or count</li>
                                <li>a completion rate or percentage</li>
                                <li>a reduction or increase in a metric</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="successMeasure"
                          value={formData.successMeasure}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="What KPIs, metrics, or deliverables define success?"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>What is the expected impact?</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Describe the lasting change this mission creates for Skyrocket after completion. Focus on how the organization operates differently once the solution exists.</li>
                            <li>Write 2 to 3 sentences that answer:
                              <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                <li>What problem will no longer exist once this system is in place?</li>
                                <li>What becomes faster, safer, or more consistent?</li>
                                <li>What improves for clients, the team, or future Voyagers?</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                        <textarea
                          name="successImpact"
                          value={formData.successImpact}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="What quantifiable impact do you expect?"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-gray-200 dark:border-gray-700 transition-colors" />

                  {/* ═══════════════════════════════════════════════════════
                      SECTION 7: Execution Plan
                  ═══════════════════════════════════════════════════════ */}
                  <section>
                    <SectionHeader
                      icon={Calendar}
                      title="Execution Plan"
                      subtitle="Timeline, classification, and scheduling."
                    />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Category</label>
                          <select
                            name="typeCategory"
                            value={formData.typeCategory}
                            onChange={handleInputChange}
                            disabled={loadingFields}
                            className={selectClass}
                            required
                          >
                            <option value="">Select category...</option>
                            {categoryOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Size</label>
                          <select
                            name="typeSize"
                            value={formData.typeSize}
                            onChange={handleInputChange}
                            disabled={loadingFields}
                            className={selectClass}
                            required
                          >
                            <option value="">Select size...</option>
                            {sizeOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Start Date</label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className={`${inputClass} dark:[color-scheme:dark]`}
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Due Date</label>
                          <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                            className={`${inputClass} dark:[color-scheme:dark]`}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Timeline & Milestones</label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-[-0.25rem]">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>List key progress checkpoints with dates — not the full step list.</li>
                            <li>A milestone is when something meaningful is finished: a draft, a review, a pilot, a launch.</li>
                            <li>Format: [DD MMM] — [What will be done]</li>
                            <li>These are summary checkpoints. Your full timeline lives in the Gantt.</li>
                          </ul>
                        </div>
                        <textarea
                          name="timelineMilestones"
                          value={formData.timelineMilestones}
                          onChange={handleInputChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="List key milestones and target dates..."
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* ── Submit Button ── */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900 dark:shadow-[0_0_20px_rgba(226,189,157,0.2)] font-bold py-3.5 px-4 rounded-custom transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting Mission...
                      </>
                    ) : (
                      <>
                        <Rocket size={18} />
                        Launch Mission
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Custom Validation Modal ── */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                Action Required
              </h3>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                {validationModal.message}
              </p>
              <button
                onClick={closeValidationModal}
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900 font-bold py-2.5 rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
