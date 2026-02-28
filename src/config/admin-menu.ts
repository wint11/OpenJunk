
import { LayoutDashboard, FileText, Users, History, Layers, Mail, ClipboardList, Wallet, Landmark, Trophy, LucideIcon, BookOpen, Stamp } from "lucide-react"

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'REVIEWER' | 'FUND_ADMIN' | 'AWARD_ADMIN' | 'JOURNAL_ADMIN'

export interface MenuItem {
  title: string
  href: string
  icon: LucideIcon
  roles: AdminRole[]
}

export interface MenuGroup {
  title?: string
  items: MenuItem[]
}

export const adminMenuConfig: MenuGroup[] = [
  {
    items: [
      {
        title: "概览",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'FUND_ADMIN', 'AWARD_ADMIN', 'JOURNAL_ADMIN', 'REVIEWER']
      },
      {
        title: "消息中心",
        href: "/admin/messages",
        icon: Mail,
        roles: ['SUPER_ADMIN', 'FUND_ADMIN', 'AWARD_ADMIN', 'JOURNAL_ADMIN', 'REVIEWER']
      }
    ]
  },
  {
    title: "平台管理",
    items: [
      {
        title: "预印本审核",
        href: "/admin/preprints",
        icon: FileText,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "期刊列表",
        href: "/admin/journals",
        icon: Layers,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "奖项列表",
        href: "/admin/awards",
        icon: Trophy,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "基金列表",
        href: "/admin/fund/categories",
        icon: Landmark,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "组织介绍",
        href: "/admin/fund/organization",
        icon: Landmark,
        roles: ['FUND_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "审计日志",
        href: "/admin/audit",
        icon: History,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "用户管理",
        href: "/admin/users",
        icon: Users,
        roles: ['SUPER_ADMIN']
      }
    ]
  },
  {
    title: "奖项管理",
    items: [
      {
        title: "申请管理",
        href: "/admin/awards/applications",
        icon: ClipboardList,
        roles: ['AWARD_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "奖项设置",
        href: "/admin/awards/settings",
        icon: Layers,
        roles: ['AWARD_ADMIN', 'SUPER_ADMIN']
      }
    ]
  },
  {
    title: "期刊管理",
    items: [
      {
        title: "期刊设置",
        href: "/admin/journals",
        icon: Layers,
        roles: ['JOURNAL_ADMIN']
      },
      {
        title: "编辑管理",
        href: "/admin/users",
        icon: Users,
        roles: ['JOURNAL_ADMIN']
      }
    ]
  },
  {
    title: "基金管理",
    items: [
      {
        title: "部门管理",
        href: "/admin/fund/departments",
        icon: Layers,
        roles: ['SUPER_ADMIN', 'FUND_ADMIN']
      },
      {
        title: "项目管理",
        href: "/admin/fund/projects",
        icon: Wallet,
        roles: ['FUND_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "申报管理",
        href: "/admin/fund/applications",
        icon: ClipboardList,
        roles: ['FUND_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "立项管理",
        href: "/admin/fund/approvals",
        icon: Stamp,
        roles: ['FUND_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "评审管理",
        href: "/admin/fund/reviews",
        icon: FileText,
        roles: ['FUND_ADMIN', 'SUPER_ADMIN']
      },
      {
        title: "专家库",
        href: "/admin/fund/admins",
        icon: Users,
        roles: ['SUPER_ADMIN']
      }
    ]
  },
  {
    title: "稿件管理",
    items: [
      {
        title: "稿件审阅",
        href: "/admin/audit/novels",
        icon: FileText,
        roles: ['JOURNAL_ADMIN', 'SUPER_ADMIN', 'REVIEWER']
      },
      {
        title: "审稿记录",
        href: "/admin/audit/history",
        icon: History,
        roles: ['JOURNAL_ADMIN', 'SUPER_ADMIN', 'REVIEWER']
      },
      {
        title: "录用稿件",
        href: "/admin/novels",
        icon: BookOpen,
        roles: ['JOURNAL_ADMIN', 'SUPER_ADMIN']
      }
    ]
  }
]
