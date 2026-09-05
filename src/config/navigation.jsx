import { Banknote, BarChart3, History, LayoutDashboard } from 'lucide-react'

export const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'history', label: 'Lịch sử', icon: History },
  { id: 'statistics', label: 'Thống kê', icon: BarChart3 },
  { id: 'payroll', label: 'Ngày công', icon: Banknote },
]

export const VIEW_TITLES = {
  overview: ['Chào buổi làm việc!', 'Sẵn sàng cho một ngày hiệu quả?'],
  history: ['Lịch sử làm việc', 'Xem lại những phiên làm việc gần đây.'],
  statistics: ['Thống kê thời gian', 'Một góc nhìn rõ ràng về hiệu suất của bạn.'],
  payroll: ['Ngày công & thu nhập', 'Thiết lập chu kỳ và theo dõi ngày làm việc đủ điều kiện.'],
}
