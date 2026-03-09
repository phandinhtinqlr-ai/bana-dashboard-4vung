/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, LabelList 
} from "recharts";
import { 
  LayoutDashboard, ListTodo, FileSpreadsheet, PlusCircle, 
  CheckCircle2, Clock, AlertCircle, PlayCircle, XCircle, 
  Filter, Download, RefreshCw, Search, ChevronRight, Calendar, User, Tag,
  MessageSquare, Send, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { Status, Workstream, SectionType, Task, DashboardStats } from "./types";
import { MOCK_TASKS } from "./data/mockData";
import { cn } from "./lib/utils";

// --- Components ---

const KPI_COLORS = {
  total: "text-slate-900 bg-slate-100",
  progress: "text-indigo-600 bg-indigo-50",
  done: "text-emerald-600 bg-emerald-50",
  inProgress: "text-blue-600 bg-blue-50",
  blocked: "text-rose-600 bg-rose-50",
  overdue: "text-amber-600 bg-amber-50",
  new: "text-violet-600 bg-violet-50",
  top: "text-cyan-600 bg-cyan-50",
};

const STATUS_COLORS: Record<Status, string> = {
  [Status.NOT_STARTED]: "bg-slate-100 text-slate-700",
  [Status.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [Status.DONE]: "bg-emerald-100 text-emerald-700",
  [Status.BLOCKED]: "bg-rose-100 text-rose-700",
  [Status.CANCELLED]: "bg-slate-200 text-slate-500",
};

const WORKSTREAM_COLORS: Record<Workstream, string> = {
  [Workstream.MARKETING]: "bg-indigo-100 text-indigo-700",
  [Workstream.OPERATIONS]: "bg-cyan-100 text-cyan-700",
  [Workstream.CULINARY]: "bg-orange-100 text-orange-700",
  [Workstream.GIFT_MERCH]: "bg-pink-100 text-pink-700",
};

const PASTEL_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#64748b", // Slate
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "input" | "sheets">("dashboard");
  const [user, setUser] = useState<{ username: string; name: string } | null>(() => {
    const localUser = localStorage.getItem("user");
    return localUser ? JSON.parse(localUser) : null;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const localTasks = localStorage.getItem("tasks");
    return localTasks ? JSON.parse(localTasks) : [];
  });
  const [headerInfo, setHeaderInfo] = useState(() => {
    const localHeader = localStorage.getItem("headerInfo");
    return localHeader ? JSON.parse(localHeader) : {
      reportTo: "TỔNG QUẢN LÝ",
      department: "CÁC MẢNG CÔNG VIỆC THÀNH PHẦN",
      compiler: "TRẦN THỊ THU PHƯƠNG",
      startDate: "01/01/2026",
      endDate: "30/04/2026",
      projectName: "DỰ ÁN \"BÀ NÀ - 4 VÙNG\"",
      mission: "Xây dựng Hành trình trải nghiệm trọn vẹn cho du khách theo 4 Vùng đất:",
      regions: ["Vùng đất Diệu kỳ", "Vương Quốc Mặt Trời", "Vương Quốc Mặt Trăng", "Vùng đất Nguồn Cội"]
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchInitialData = async () => {
      console.log("Fetching initial data from server...");
      try {
        // Fetch tasks
        const tasksResponse = await fetch("/api/tasks");
        const tasksData = await tasksResponse.json();
        
        if (tasksData && tasksData.length > 0) {
          console.log("Server has tasks, updating local state");
          setTasks(tasksData);
          localStorage.setItem("tasks", JSON.stringify(tasksData));
        } else if (tasks.length === 0) {
          console.log("No tasks anywhere, using mock tasks");
          setTasks(MOCK_TASKS);
          localStorage.setItem("tasks", JSON.stringify(MOCK_TASKS));
          for (const task of MOCK_TASKS) {
            await saveTaskToServer(task);
          }
        }

        // Fetch header info
        const headerResponse = await fetch("/api/settings/headerInfo");
        const headerData = await headerResponse.json();
        if (headerData) {
          console.log("Server has header info, updating local state");
          setHeaderInfo(headerData);
          localStorage.setItem("headerInfo", JSON.stringify(headerData));
        }
      } catch (error) {
        console.error("Failed to fetch from server, using local data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const saveHeaderInfoToServer = async (info: typeof headerInfo) => {
    console.log("Saving header info...", info);
    localStorage.setItem("headerInfo", JSON.stringify(info));
    try {
      const response = await fetch("/api/settings/headerInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (!response.ok) throw new Error("Failed to save header info");
    } catch (error) {
      console.error("Failed to save header info to server:", error);
    }
  };

  const saveTaskToServer = async (task: Task) => {
    console.log("Saving task...", task.recordId);
    // Update localStorage
    const localTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const updatedLocalTasks = localTasks.filter((t: Task) => t.recordId !== task.recordId);
    updatedLocalTasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(updatedLocalTasks));

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error("Failed to save task");
    } catch (error) {
      console.error("Failed to save task to server:", error);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkstream, setFilterWorkstream] = useState<Workstream | "All">("All");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // --- Data Processing ---

  const stats = useMemo<DashboardStats>(() => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const overdue = tasks.filter(t => 
      t.endDate && new Date(t.endDate).getTime() < today.getTime() && t.status !== Status.DONE && t.status !== Status.CANCELLED
    );

    const newTasks = tasks.filter(t => new Date(t.lastUpdate).getTime() > last7Days.getTime());

    const workstreamCounts = tasks.reduce((acc, t) => {
      acc[t.workstream] = (acc[t.workstream] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWorkstream = Object.entries(workstreamCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || "N/A";

    return {
      totalTasks: tasks.length,
      avgProgress: Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length),
      doneCount: tasks.filter(t => t.status === Status.DONE).length,
      inProgressCount: tasks.filter(t => t.status === Status.IN_PROGRESS).length,
      blockedCount: tasks.filter(t => t.status === Status.BLOCKED).length,
      overdueCount: overdue.length,
      newTasksLast7Days: newTasks.length,
      topWorkstream,
    };
  }, [tasks]);

  const chartData = useMemo(() => {
    // Status distribution
    const statusData = Object.values(Status).map(s => ({
      name: s,
      value: tasks.filter(t => t.status === s).length
    })).filter(d => d.value > 0);

    // Workstream distribution
    const workstreamData = Object.values(Workstream).map(w => ({
      name: w,
      tasks: tasks.filter(t => t.workstream === w).length,
      progress: Math.round(tasks.filter(t => t.workstream === w).reduce((acc, t) => acc + t.progress, 0) / (tasks.filter(t => t.workstream === w).length || 1))
    }));

    // Weekly progress trend (dynamic)
    const weeksMap = new Map<number, { totalProgress: number, count: number }>();
    
    tasks.forEach(t => {
      if (t.weekNo > 0) {
        const current = weeksMap.get(t.weekNo) || { totalProgress: 0, count: 0 };
        weeksMap.set(t.weekNo, {
          totalProgress: current.totalProgress + t.progress,
          count: current.count + 1
        });
      }
    });

    let weeklyTrend = Array.from(weeksMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, data]) => ({
        week: `W${week}`,
        progress: Math.round(data.totalProgress / data.count)
      }));

    // If no weekly data, show a placeholder based on current avg
    if (weeklyTrend.length === 0) {
      const currentAvg = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / (tasks.length || 1));
      weeklyTrend = [
        { week: "W48", progress: Math.max(0, currentAvg - 20) },
        { week: "W49", progress: Math.max(0, currentAvg - 15) },
        { week: "W50", progress: Math.max(0, currentAvg - 10) },
        { week: "W51", progress: Math.max(0, currentAvg - 5) },
        { week: "W52", progress: currentAvg },
      ];
    }

    return { statusData, workstreamData, weeklyTrend };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWorkstream = filterWorkstream === "All" || t.workstream === filterWorkstream;
      return matchesSearch && matchesWorkstream;
    });
  }, [tasks, searchQuery, filterWorkstream]);

  // --- Renderers ---

  const handleExportReport = () => {
    if (tasks.length === 0) {
      alert("Không có dữ liệu để xuất báo cáo.");
      return;
    }

    // Define CSV headers
    const headers = ["ID", "Công việc", "Mảng", "Người phụ trách", "Trạng thái", "Tiến độ (%)", "Tuần", "Ngày bắt đầu", "Ngày kết thúc"];
    
    // Map tasks to CSV rows
    const csvRows = tasks.map(task => [
      task.id,
      `"${task.taskTitle.replace(/"/g, '""')}"`,
      task.workstream,
      task.owner,
      task.status,
      task.progress,
      task.weekNo || "",
      task.startDate || "",
      task.endDate || ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_du_an_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const message = input.value.trim();
    if (!message) return;

    const newMessages = [...chatMessages, { role: 'user' as const, text: message }];
    setChatMessages(newMessages);
    input.value = '';
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const context = `
        Dữ liệu dự án hiện tại:
        - Tổng số nhiệm vụ: ${stats.totalTasks}
        - Tiến độ trung bình: ${stats.avgProgress}%
        - Đã hoàn thành: ${stats.doneCount}
        - Đang thực hiện: ${stats.inProgressCount}
        - Bị chặn: ${stats.blockedCount}
        - Quá hạn: ${stats.overdueCount}
        
        Danh sách nhiệm vụ chi tiết:
        ${tasks.map(t => `- [${t.workstream}] ${t.taskTitle}: ${t.status} (${t.progress}%) - Phụ trách: ${t.owner}`).join('\n')}
        
        Hãy trả lời câu hỏi của người dùng dựa trên dữ liệu này. Trả lời ngắn gọn, súc tích bằng tiếng Việt.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: context }] },
          ...newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
        ],
      });

      if (response.text) {
        setChatMessages([...newMessages, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages([...newMessages, { role: 'model', text: "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveHeader = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newHeader = {
      ...headerInfo,
      reportTo: formData.get("reportTo") as string,
      department: formData.get("department") as string,
      compiler: formData.get("compiler") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      projectName: formData.get("projectName") as string,
      mission: formData.get("mission") as string,
    };
    setHeaderInfo(newHeader);
    saveHeaderInfoToServer(newHeader);
    setIsEditingHeader(false);
  };

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Project Overview Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-red-600 px-8 py-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase text-center flex-1">
            BẢNG DASHBOARD 4 VÙNG ĐẤT BÀ NÀ
          </h1>
          <div className="flex-1 flex justify-end items-center gap-4">
            <span className="text-[10px] text-white/60 font-mono hidden md:block">
              Cập nhật: {new Date().toLocaleString('vi-VN')}
            </span>
            <button 
              onClick={() => {
                if (isEditingHeader) {
                  saveHeaderInfoToServer(headerInfo);
                }
                setIsEditingHeader(!isEditingHeader);
              }}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all border border-white/10"
            >
              {isEditingHeader ? "Lưu thông tin" : "Chỉnh sửa"}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100">
          <div className="p-6 border-r border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Báo cáo đến</span>
              {isEditingHeader ? (
                <input 
                  value={headerInfo.reportTo} 
                  onChange={(e) => setHeaderInfo({...headerInfo, reportTo: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <span className="text-sm font-bold text-slate-900">{headerInfo.reportTo}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng/Ban</span>
              {isEditingHeader ? (
                <input 
                  value={headerInfo.department} 
                  onChange={(e) => setHeaderInfo({...headerInfo, department: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <span className="text-sm font-bold text-slate-900">{headerInfo.department}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Từ ngày</span>
              {isEditingHeader ? (
                <input 
                  value={headerInfo.startDate} 
                  onChange={(e) => setHeaderInfo({...headerInfo, startDate: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <span className="text-sm font-bold text-red-600">{headerInfo.startDate}</span>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người tổng hợp</span>
              {isEditingHeader ? (
                <input 
                  value={headerInfo.compiler} 
                  onChange={(e) => setHeaderInfo({...headerInfo, compiler: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <span className="text-sm font-bold text-slate-900">{headerInfo.compiler}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2 h-[26px]">
              {/* Empty space */}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đến ngày</span>
              {isEditingHeader ? (
                <input 
                  value={headerInfo.endDate} 
                  onChange={(e) => setHeaderInfo({...headerInfo, endDate: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <span className="text-sm font-bold text-red-600">{headerInfo.endDate}</span>
              )}
            </div>
          </div>
        </div>
        <div className="bg-amber-500 px-8 py-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase">I. TỔNG QUAN DỰ ÁN</h2>
        </div>
        <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/4">
            <span className="text-sm font-bold text-slate-900">Nhiệm vụ</span>
          </div>
          <div className="flex-1 text-sm text-slate-700 leading-relaxed">
            {isEditingHeader ? (
              <textarea 
                value={headerInfo.mission} 
                onChange={(e) => setHeaderInfo({...headerInfo, mission: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
              />
            ) : (
              <p className="font-medium mb-2 text-slate-900">{headerInfo.mission}</p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {headerInfo.regions.map((region, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  {isEditingHeader ? (
                    <input 
                      value={region} 
                      onChange={(e) => {
                        const newRegions = [...headerInfo.regions];
                        newRegions[idx] = e.target.value;
                        setHeaderInfo({...headerInfo, regions: newRegions});
                      }}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-slate-700">{region}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tổng số nhiệm vụ" value={stats.totalTasks} icon={<LayoutDashboard size={20} />} colorClass={KPI_COLORS.total} />
        <KPICard title="% Hoàn thành TB" value={`${stats.avgProgress}%`} icon={<RefreshCw size={20} />} colorClass={KPI_COLORS.progress} />
        <KPICard title="Đã hoàn thành" value={stats.doneCount} icon={<CheckCircle2 size={20} />} colorClass={KPI_COLORS.done} />
        <KPICard title="Đang thực hiện" value={stats.inProgressCount} icon={<PlayCircle size={20} />} colorClass={KPI_COLORS.inProgress} />
        <KPICard title="Bị chặn (Blocked)" value={stats.blockedCount} icon={<AlertCircle size={20} />} colorClass={KPI_COLORS.blocked} />
        <KPICard title="Quá hạn (Overdue)" value={stats.overdueCount} icon={<Clock size={20} />} colorClass={KPI_COLORS.overdue} />
        <KPICard title="Mới (7 ngày)" value={stats.newTasksLast7Days} icon={<PlusCircle size={20} />} colorClass={KPI_COLORS.new} />
        <KPICard title="Mảng trọng tâm" value={stats.topWorkstream} icon={<Tag size={20} />} colorClass={KPI_COLORS.top} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Trạng thái nhiệm vụ</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="2" dy="4" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {PASTEL_COLORS.map((color, index) => (
                    <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  style={{ filter: 'url(#shadow)' }}
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#grad-${index % PASTEL_COLORS.length})`} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Nhiệm vụ theo Mảng (Workstream)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.workstreamData}>
                <defs>
                  <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="1" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {PASTEL_COLORS.map((color, index) => (
                    <linearGradient key={`bar-grad-${index}`} id={`bar-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="tasks" radius={[6, 6, 0, 0]} style={{ filter: 'url(#barShadow)' }}>
                  {chartData.workstreamData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#bar-grad-${index % PASTEL_COLORS.length})`} />
                  ))}
                  <LabelList dataKey="tasks" position="top" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Tiến độ theo Mảng (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.workstreamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="progress" radius={[0, 6, 6, 0]} style={{ filter: 'url(#barShadow)' }}>
                  {chartData.workstreamData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#bar-grad-${(index + 3) % PASTEL_COLORS.length})`} />
                  ))}
                  <LabelList dataKey="progress" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Xu hướng hoàn thành theo tuần</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                >
                  <LabelList dataKey="progress" position="top" formatter={(v: number) => `${v}%`} style={{ fill: '#6366f1', fontSize: 11, fontWeight: 'bold' }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Top 10 Nhiệm vụ rủi ro (Blocked/Overdue)</h3>
          <span className="text-xs text-rose-500 font-medium">Cần xử lý ngay</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Nhiệm vụ</th>
                <th className="px-6 py-3">Phụ trách</th>
                <th className="px-6 py-3">Hạn chót</th>
                <th className="px-6 py-3">Tiến độ</th>
                <th className="px-6 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.filter(t => t.status === Status.BLOCKED || (t.endDate && new Date(t.endDate).getTime() < new Date().getTime() && t.status !== Status.DONE)).slice(0, 10).map((task) => (
                <tr key={task.recordId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{task.taskTitle}</td>
                  <td className="px-6 py-4 text-slate-600">{task.owner}</td>
                  <td className="px-6 py-4 text-rose-500 font-medium">{task.endDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic text-xs">{task.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      recordId: `manual-${Date.now()}`,
      sourceSheet: "Manual Input",
      weekNo: parseInt(formData.get("weekNo") as string) || 0,
      workstream: formData.get("workstream") as Workstream,
      sectionType: SectionType.PROJECT_TASK,
      taskTitle: formData.get("title") as string,
      taskDescription: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      status: formData.get("status") as Status || Status.NOT_STARTED,
      progress: parseInt(formData.get("progress") as string) || 0,
      owner: formData.get("owner") as string,
      notes: formData.get("notes") as string || "",
      result: formData.get("result") as string || "",
      lastUpdate: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    saveTaskToServer(newTask);
    setIsFormOpen(false);
    setActiveTab("tasks");
  };

  const handleUpdateTask = (recordId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.recordId === recordId ? { ...t, ...updates, lastUpdate: new Date().toISOString() } : t);
    setTasks(updatedTasks);
    const updatedTask = updatedTasks.find(t => t.recordId === recordId);
    if (updatedTask) {
      saveTaskToServer(updatedTask);
    }
  };

  const renderInput = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Add Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PlusCircle className="text-indigo-600" size={20} />
            Thêm nhiệm vụ mới
          </h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Nhiệm vụ chính</label>
              <input name="title" required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="Nhập tên nhiệm vụ..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Diễn giải</label>
              <textarea name="description" rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="Mô tả chi tiết..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Tuần báo cáo</label>
                <input name="weekNo" type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="VD: 47" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Người phụ trách</label>
                <input name="owner" required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="Tên..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Mảng</label>
                <select name="workstream" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm">
                  {Object.values(Workstream).map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Tiến độ (%)</label>
                <input name="progress" type="number" min="0" max="100" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="0-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Ngày bắt đầu</label>
                <input name="startDate" type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Ngày hoàn thành</label>
                <input name="endDate" type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Kết quả thực hiện</label>
              <textarea name="result" rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="Ghi chú kết quả..." />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-2 flex items-center justify-center gap-2">
              <PlusCircle size={18} />
              Tạo nhiệm vụ
            </button>
          </form>
        </div>

        {/* Quick Update List */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="text-emerald-600" size={20} />
              Cập nhật dữ liệu Realtime
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              {tasks.length} nhiệm vụ đang quản lý
            </div>
          </div>

          <div className="space-y-6">
            {tasks.map((task, index) => (
              <div key={task.recordId} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={task.taskTitle}
                      onChange={(e) => handleUpdateTask(task.recordId, { taskTitle: e.target.value })}
                      className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 text-base"
                      placeholder="Nhiệm vụ chính..."
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", WORKSTREAM_COLORS[task.workstream])}>
                        {task.workstream}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{task.sourceSheet}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Diễn giải</label>
                      <textarea 
                        value={task.taskDescription}
                        onChange={(e) => handleUpdateTask(task.recordId, { taskDescription: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        rows={2}
                        placeholder="Mô tả chi tiết nhiệm vụ..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Ngày bắt đầu</label>
                        <input 
                          type="date" 
                          value={task.startDate || ""}
                          onChange={(e) => handleUpdateTask(task.recordId, { startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Ngày hoàn thành</label>
                        <input 
                          type="date" 
                          value={task.endDate || ""}
                          onChange={(e) => handleUpdateTask(task.recordId, { endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Trạng thái</label>
                        <select 
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task.recordId, { status: e.target.value as Status })}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500/20",
                            STATUS_COLORS[task.status]
                          )}
                        >
                          {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Tiến độ (%)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={task.progress}
                          onChange={(e) => handleUpdateTask(task.recordId, { progress: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Kết quả thực hiện</label>
                      <textarea 
                        value={task.result || ""}
                        onChange={(e) => handleUpdateTask(task.recordId, { result: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        rows={2}
                        placeholder="Kết quả đạt được..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    className={cn("h-full transition-all duration-500", task.progress === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
  const renderTasks = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhiệm vụ, người phụ trách..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select 
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            value={filterWorkstream}
            onChange={(e) => setFilterWorkstream(e.target.value as any)}
          >
            <option value="All">Tất cả Mảng</option>
            {Object.values(Workstream).map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <PlusCircle size={16} />
            Thêm nhiệm vụ
          </button>
        </div>
      </div>

      {/* Task Table (Desktop) / Cards (Mobile) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Nhiệm vụ</th>
              <th className="px-6 py-4">Mảng</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Phụ trách</th>
              <th className="px-6 py-4">Hạn chót</th>
              <th className="px-6 py-4">Tiến độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <tr key={task.recordId} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{task.taskTitle}</p>
                    <p className="text-[10px] text-slate-400">{task.sourceSheet}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", WORKSTREAM_COLORS[task.workstream])}>
                    {task.workstream}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", STATUS_COLORS[task.status])}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{task.owner}</td>
                <td className="px-6 py-4 text-slate-600">{task.endDate || "N/A"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full", task.progress === 100 ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium">{task.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <div key={task.recordId} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", STATUS_COLORS[task.status])}>
                {task.status}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{task.sourceSheet}</span>
            </div>
            <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{task.taskTitle}</h4>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.taskDescription}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span>{task.owner}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{task.endDate || "N/A"}</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                  <span>Tiến độ</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", task.progress === 100 ? "bg-emerald-500" : "bg-indigo-500")} 
                    style={{ width: `${task.progress}%` }} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", WORKSTREAM_COLORS[task.workstream])}>
                  {task.workstream}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Thêm nhiệm vụ mới</h3>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle size={20} className="text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nhiệm vụ chính</label>
                    <input name="title" required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Diễn giải</label>
                    <textarea name="description" rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tuần báo cáo</label>
                      <input name="weekNo" type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="VD: 47" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tiến độ (%)</label>
                      <input name="progress" type="number" min="0" max="100" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0-100" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Mảng (Workstream)</label>
                      <select name="workstream" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                        {Object.values(Workstream).map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Người phụ trách</label>
                      <input name="owner" required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Ngày bắt đầu</label>
                      <input name="startDate" type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Ngày hoàn thành</label>
                      <input name="endDate" type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Kết quả thực hiện</label>
                    <textarea name="result" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      Lưu nhiệm vụ
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderSheets = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Google Sheets Integration</h2>
            <p className="text-slate-500">Hướng dẫn triển khai Apps Script và Công thức chuẩn hóa</p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">1</div>
              Apps Script: Tự động hóa trích xuất (Extraction)
            </h3>
            <p className="text-sm text-slate-600 mb-4">Copy đoạn mã này vào <strong>Extensions &gt; Apps Script</strong> trong Google Sheets của bạn. Script này sẽ quét các sheet "Tuần xx" và "DA 4 Vung dat" để đổ vào sheet <strong>DATA_TASKS</strong>.</p>
            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
              <pre className="text-xs text-slate-300 font-mono leading-relaxed">
{`/**
 * Script chuẩn hóa dữ liệu từ các sheet báo cáo tuần và dự án
 * Tác giả: AI Studio Expert
 */

function refreshDataTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName("DATA_TASKS") || ss.insertSheet("DATA_TASKS");
  
  // Header chuẩn
  const headers = ["Record_ID", "Source_Sheet", "Week_No", "Workstream", "Section_Type", "Task_Title", "Status", "Progress_%", "End_Date", "Owner", "Notes", "Last_Update"];
  targetSheet.clear();
  targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f3f3f3");

  const allSheets = ss.getSheets();
  let allData = [];

  allSheets.forEach(sheet => {
    const name = sheet.getName();
    
    // Xử lý sheet Tuần
    if (name.includes("Tuần")) {
      const weekNo = name.replace("Tuần ", "");
      const data = sheet.getDataRange().getValues();
      
      // Logic mapping: Tìm các dòng có dữ liệu (giả sử STT ở cột A, Mô tả ở cột B)
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] && data[i][1] !== "") { // Nếu có Task Title
          const progress = parseFloat(data[i][2]) || 0;
          const status = progress === 100 ? "Done" : (progress > 0 ? "In Progress" : "Not Started");
          
          allData.push([
            Utilities.base64Encode(name + i + data[i][1]), // Record_ID
            name,
            weekNo,
            "Marketing", // Mặc định hoặc suy luận từ Section Header
            "Đã thực hiện",
            data[i][1], // Task_Title
            status,
            progress,
            "", // End_Date
            "", // Owner
            data[i][3] || "", // Notes
            new Date()
          ]);
        }
      }
    }
  });

  if (allData.length > 0) {
    targetSheet.getRange(2, 1, allData.length, headers.length).setValues(allData);
  }
  
  SpreadsheetApp.getUi().alert("Đã cập nhật " + allData.length + " nhiệm vụ!");
}`}
              </pre>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">2</div>
              Công thức Dashboard (KPI Cards)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng nhiệm vụ</span>
                <code className="block mt-1 text-xs text-indigo-600 font-mono">=COUNTA(DATA_TASKS!A2:A)</code>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">% Hoàn thành TB</span>
                <code className="block mt-1 text-xs text-indigo-600 font-mono">=AVERAGE(DATA_TASKS!H2:H)</code>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nhiệm vụ Quá hạn</span>
                <code className="block mt-1 text-xs text-indigo-600 font-mono">
                  {"=COUNTIFS(DATA_TASKS!I2:I, \"<\"&TODAY(), DATA_TASKS!G2:G, \"<>Done\")"}
                </code>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lọc theo Tuần (Query)</span>
                <code className="block mt-1 text-xs text-indigo-600 font-mono">
                  {"=QUERY(DATA_TASKS!A:L, \"SELECT * WHERE C = \"&A1)"}
                </code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={(u) => {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu dự án...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-20 md:w-64 bg-white border-r border-slate-200 z-50 flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard size={24} />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight text-slate-900">Bà Nà 4 Vùng</span>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <NavItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === "input"} 
            onClick={() => setActiveTab("input")} 
            icon={<PlusCircle size={20} />} 
            label="Nhập liệu Realtime" 
          />
          <NavItem 
            active={activeTab === "tasks"} 
            onClick={() => setActiveTab("tasks")} 
            icon={<ListTodo size={20} />} 
            label="Data Tasks" 
          />
          <NavItem 
            active={activeTab === "sheets"} 
            onClick={() => setActiveTab("sheets")} 
            icon={<FileSpreadsheet size={20} />} 
            label="Sheets Integration" 
          />
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">@{user.username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
          >
            <XCircle size={18} />
            <span className="hidden md:block text-xs font-medium">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 pt-6 min-h-screen relative">
        <header className="px-6 md:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === "dashboard" ? "Tổng quan dự án" : activeTab === "tasks" ? "Danh sách nhiệm vụ" : "Tích hợp Google Sheets"}
            </h1>
            <p className="text-sm text-slate-500">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} />
              <span className="hidden md:inline">Xuất báo cáo</span>
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "input" && renderInput()}
            {activeTab === "tasks" && renderTasks()}
            {activeTab === "sheets" && renderSheets()}
          </AnimatePresence>
        </div>

        {/* AI Chat Widget */}
        <div className="fixed bottom-6 right-6 z-[200]">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
              >
                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Trợ lý AI Dự án</h3>
                      <p className="text-[10px] text-indigo-100">Hỏi về tiến độ, rủi ro...</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 space-y-2">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-900">Chào bạn! Tôi có thể giúp gì?</p>
                      <p className="text-xs text-slate-500 px-8">Bạn có thể hỏi về nhiệm vụ quá hạn, mảng nào đang chậm tiến độ, hoặc tổng quan dự án.</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                        msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                    name="message"
                    type="text" 
                    placeholder="Hỏi AI về dữ liệu dự án..." 
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                    <Send size={18} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95",
              isChatOpen ? "bg-white text-slate-900 border border-slate-200" : "bg-indigo-600 text-white"
            )}
          >
            {isChatOpen ? <XCircle size={28} /> : <MessageSquare size={28} />}
          </button>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function Login({ onLogin }: { onLogin: (user: { username: string; name: string }) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard size={32} />
          </div>
          <h1 className="text-2xl font-bold">Bà Nà - 4 Vùng</h1>
          <p className="text-indigo-100 text-sm mt-2">Đăng nhập để truy cập dữ liệu dự án</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : "Đăng nhập"}
          </button>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Dùng chung cho đội ngũ dự án</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
        active 
          ? "bg-indigo-50 text-indigo-600 font-semibold" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")}>
        {icon}
      </span>
      <span className="hidden md:block text-sm">{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
    </button>
  );
}

function KPICard({ title, value, icon, colorClass }: { title: string; value: string | number; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colorClass)}>
          {icon}
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
}
