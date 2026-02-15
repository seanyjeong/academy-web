import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  Layers,
  UserCheck,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  ClipboardList,
  FileText,
  NotebookPen,
  Dumbbell,
  Package,
  Trophy,
  UsersRound,
  BarChart3,
  PieChart,
  Settings,
  Shield,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface MenuSection {
  title: string;
  module: string;
  items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "학원 운영",
    module: "core",
    items: [
      { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
      { label: "학생관리", href: "/students", icon: Users, permission: "students" },
      { label: "출결관리", href: "/attendance", icon: CalendarCheck, permission: "attendance" },
      { label: "수업일정", href: "/schedules", icon: Calendar, permission: "schedules" },
      { label: "시즌관리", href: "/seasons", icon: Layers, permission: "seasons" },
      { label: "강사관리", href: "/instructors", icon: UserCheck, permission: "instructors" },
    ],
  },
  {
    title: "재무",
    module: "finance",
    items: [
      { label: "수납관리", href: "/payments", icon: CreditCard, permission: "payments" },
      { label: "급여관리", href: "/salaries", icon: Banknote, permission: "salaries" },
      { label: "수입관리", href: "/incomes", icon: TrendingUp, permission: "incomes" },
      { label: "지출관리", href: "/expenses", icon: TrendingDown, permission: "expenses" },
    ],
  },
  {
    title: "상담",
    module: "consultation",
    items: [
      { label: "상담관리", href: "/consultations", icon: MessageCircle, permission: "consultations" },
    ],
  },
  {
    title: "훈련",
    module: "training",
    items: [
      { label: "측정기록", href: "/training/records", icon: ClipboardList, permission: "training" },
      { label: "훈련계획", href: "/training/plans", icon: FileText, permission: "training" },
      { label: "훈련일지", href: "/training/logs", icon: NotebookPen, permission: "training" },
      { label: "운동관리", href: "/training/exercises", icon: Dumbbell, permission: "training" },
      { label: "프리셋", href: "/training/presets", icon: Package, permission: "training" },
      { label: "월간테스트", href: "/training/tests", icon: Trophy, permission: "training" },
      { label: "반배정", href: "/training/assignments", icon: UsersRound, permission: "training" },
      { label: "통계", href: "/training/stats", icon: BarChart3, permission: "training" },
    ],
  },
  {
    title: "관리",
    module: "admin",
    items: [
      { label: "리포트", href: "/reports", icon: PieChart, permission: "reports" },
      { label: "설정", href: "/settings", icon: Settings },
      { label: "직원관리", href: "/staff", icon: Shield, permission: "staff" },
      { label: "SMS", href: "/sms", icon: Smartphone, permission: "notifications" },
    ],
  },
];
