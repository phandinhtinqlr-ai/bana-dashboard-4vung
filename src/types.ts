/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Status {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
  BLOCKED = "Blocked",
  CANCELLED = "Cancelled",
}

export enum Workstream {
  MARKETING = "Marketing",
  OPERATIONS = "Vận hành–Trải nghiệm",
  CULINARY = "Ẩm thực",
  GIFT_MERCH = "Gift–Merchandise",
}

export enum SectionType {
  COMPLETED = "Đã thực hiện",
  NEXT_WEEK = "Kế hoạch tuần tới",
  PROJECT_TASK = "Nhiệm vụ dự án",
  PROPOSAL = "Kiến nghị",
}

export interface Task {
  recordId: string;
  sourceSheet: string;
  weekNo: number;
  fromDate?: string;
  toDate?: string;
  department?: string;
  workstream: Workstream;
  sectionType: SectionType;
  taskTitle: string;
  taskDescription: string;
  startDate?: string;
  endDate?: string;
  status: Status;
  progress: number; // 0-100
  owner: string;
  notes: string;
  result?: string;
  lastUpdate: string;
}

export interface DashboardStats {
  totalTasks: number;
  avgProgress: number;
  doneCount: number;
  inProgressCount: number;
  blockedCount: number;
  overdueCount: number;
  newTasksLast7Days: number;
  topWorkstream: string;
}
