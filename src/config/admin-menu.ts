
import { LayoutDashboard, FileText, Users, History, Layers, Mail, ClipboardList, Wallet, Landmark, Trophy, LucideIcon, BookOpen, Stamp } from "lucide-react"

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'REVIEWER' | 'FUND_ADMIN' | 'AWARD_ADMIN' | 'JOURNAL_ADMIN' | 'CONFERENCE_ADMIN'

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
        title: "公开评审审核",
        href: "/admin/preprints", // Keep admin route same for now or rename if needed. The user asked to rename the public facing route.
        // Wait, if I renamed src/app/preprints to src/app/public-review, that's the public route.
        // The admin route is src/app/admin/preprints. I should probably rename that too for consistency, but the user didn't explicitly ask for admin route rename.
        // However, "preprints" terminology is being replaced.
        // Let's stick to renaming the LABEL first. The underlying admin route can stay or be moved later.
        // Actually, if I want to be thorough, I should rename admin route too. But let's focus on user request "I want to change it to Public Review Platform".
        // The admin route is e:\项目文件\OpenJunk\src\app\admin\preprints\page.tsx.
        // I will keep the admin route as is for now to avoid breaking too many things, just change the label.
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
        title: "会议列表",
        href: "/admin/conferences/list",
        icon: Layers,
        roles: ['SUPER_ADMIN', 'CONFERENCE_ADMIN']
      },
      {
        title: "奖项列表",
        href: "/admin/awards",
        icon: Trophy,
        roles: ['SUPER_ADMIN']
      },
      {
        title: "基金组织",
        href: "/admin/fund/categories",
        icon: Landmark,
        roles: ['SUPER_ADMIN', 'FUND_ADMIN']
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
    title: "期刊稿件",
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
  },
  {
    title: "会议稿件",
    items: [
      {
        title: "会议审阅",
        href: "/admin/audit/conferences",
        icon: FileText,
        roles: ['SUPER_ADMIN', 'REVIEWER', 'CONFERENCE_ADMIN']
      },
      {
        title: "审稿记录",
        href: "/admin/audit/conference-history",
        icon: History,
        roles: ['SUPER_ADMIN', 'REVIEWER', 'CONFERENCE_ADMIN']
      },
      {
        title: "录用稿件",
        href: "/admin/conferences/papers",
        icon: BookOpen,
        roles: ['SUPER_ADMIN', 'CONFERENCE_ADMIN']
      }
    ]
  }
]
