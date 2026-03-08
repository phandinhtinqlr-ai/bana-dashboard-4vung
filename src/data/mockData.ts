/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Status, Workstream, SectionType, Task } from "../types";

const generateId = (sheet: string, week: number, title: string) => 
  `${sheet}-${week}-${title.replace(/\s+/g, '-').toLowerCase()}`;

export const MOCK_TASKS: Task[] = [
  // Tuần 46
  {
    recordId: generateId("Tuần 46", 46, "Lên kế hoạch Content Marketing"),
    sourceSheet: "Tuần 46",
    weekNo: 46,
    workstream: Workstream.MARKETING,
    sectionType: SectionType.COMPLETED,
    taskTitle: "Lên kế hoạch Content Marketing",
    taskDescription: "Xây dựng bộ content cho fanpage tháng 11",
    startDate: "2025-11-10",
    endDate: "2025-11-15",
    status: Status.DONE,
    progress: 100,
    owner: "An Nguyễn",
    notes: "Đã duyệt",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  {
    recordId: generateId("Tuần 46", 46, "Thiết kế POSM Vùng Đất 1"),
    sourceSheet: "Tuần 46",
    weekNo: 46,
    workstream: Workstream.MARKETING,
    sectionType: SectionType.NEXT_WEEK,
    taskTitle: "Thiết kế POSM Vùng Đất 1",
    taskDescription: "Thiết kế standee và backdrop",
    startDate: "2025-11-17",
    endDate: "2025-11-22",
    status: Status.IN_PROGRESS,
    progress: 60,
    owner: "Bình Lê",
    notes: "Đang chờ feedback",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  // DA 4 Vung dat - Marketing
  {
    recordId: generateId("DA 4 Vung dat", 0, "Chiến dịch Launching"),
    sourceSheet: "DA 4 Vung dat",
    weekNo: 0,
    workstream: Workstream.MARKETING,
    sectionType: SectionType.PROJECT_TASK,
    taskTitle: "Chiến dịch Launching",
    taskDescription: "Tổng thể chiến dịch ra mắt 4 vùng đất",
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    status: Status.NOT_STARTED,
    progress: 0,
    owner: "Cường Trần",
    notes: "Đang chuẩn bị budget",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  // DA 4 Vung dat - Operations
  {
    recordId: generateId("DA 4 Vung dat", 0, "Quy trình vận hành quầy vé"),
    sourceSheet: "DA 4 Vung dat",
    weekNo: 0,
    workstream: Workstream.OPERATIONS,
    sectionType: SectionType.PROJECT_TASK,
    taskTitle: "Quy trình vận hành quầy vé",
    taskDescription: "Xây dựng SOP cho nhân viên quầy vé",
    startDate: "2025-11-01",
    endDate: "2025-11-20",
    status: Status.BLOCKED,
    progress: 40,
    owner: "Dung Phạm",
    notes: "Thiếu nhân sự đào tạo",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  // Overdue Task
  {
    recordId: generateId("Tuần 45", 45, "Báo cáo chi phí tháng 10"),
    sourceSheet: "Tuần 45",
    weekNo: 45,
    workstream: Workstream.OPERATIONS,
    sectionType: SectionType.COMPLETED,
    taskTitle: "Báo cáo chi phí tháng 10",
    taskDescription: "Tổng hợp hóa đơn và chứng từ",
    startDate: "2025-10-25",
    endDate: "2025-11-05",
    status: Status.IN_PROGRESS,
    progress: 80,
    owner: "E Hoa",
    notes: "Chưa nộp kế toán",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  // Culinary
  {
    recordId: generateId("DA 4 Vung dat", 0, "Menu đặc sản Vùng Đất 2"),
    sourceSheet: "DA 4 Vung dat",
    weekNo: 0,
    workstream: Workstream.CULINARY,
    sectionType: SectionType.PROJECT_TASK,
    taskTitle: "Menu đặc sản Vùng Đất 2",
    taskDescription: "Thử món và chốt menu",
    startDate: "2025-11-15",
    endDate: "2025-11-30",
    status: Status.IN_PROGRESS,
    progress: 20,
    owner: "F Tuấn",
    notes: "Đang tìm nhà cung cấp nguyên liệu",
    lastUpdate: "2025-11-16T10:00:00Z"
  },
  // Gift Merch
  {
    recordId: generateId("DA 4 Vung dat", 0, "Sản xuất quà lưu niệm"),
    sourceSheet: "DA 4 Vung dat",
    weekNo: 0,
    workstream: Workstream.GIFT_MERCH,
    sectionType: SectionType.PROJECT_TASK,
    taskTitle: "Sản xuất quà lưu niệm",
    taskDescription: "Sản xuất 1000 bộ quà tặng",
    startDate: "2025-11-20",
    endDate: "2025-12-15",
    status: Status.NOT_STARTED,
    progress: 0,
    owner: "G Lan",
    notes: "Chờ duyệt mẫu",
    lastUpdate: "2025-11-16T10:00:00Z"
  }
];
