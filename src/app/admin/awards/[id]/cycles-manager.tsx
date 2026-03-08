'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createCycle, deleteCycle } from "./actions"

interface Cycle {
  id: string
  name: string
  startDate: Date
  endDate: Date
  announceDate: Date | null
  status: string
}

interface CyclesManagerProps {
  awardId: string
  cycles: Cycle[]
}

export function CyclesManager({ awardId, cycles }: CyclesManagerProps) {
  const [newCycle, setNewCycle] = useState({
    name: "",
    startDate: "",
    endDate: "",
    announceDate: ""
  })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newCycle.name.trim() || !newCycle.startDate || !newCycle.endDate) {
      toast.error("请填写完整信息")
      return
    }

    setLoading(true)
    const res = await createCycle(awardId, {
      name: newCycle.name,
      startDate: new Date(newCycle.startDate),
      endDate: new Date(newCycle.endDate),
      announceDate: newCycle.announceDate ? new Date(newCycle.announceDate) : null
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("周期已添加")
      setNewCycle({ name: "", startDate: "", endDate: "", announceDate: "" })
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此周期吗？该周期下的申请数据将被保留但无法继续申请。")) return

    setLoading(true)
    const res = await deleteCycle(id)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("周期已删除")
      window.location.reload()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="outline">即将开始</Badge>
      case 'OPEN':
        return <Badge className="bg-green-500">进行中</Badge>
      case 'CLOSED':
        return <Badge variant="secondary">已结束</Badge>
      case 'ANNOUNCED':
        return <Badge className="bg-blue-500">已公示</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* 添加新周期 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cycleName">周期名称</Label>
          <Input
            id="cycleName"
            placeholder="如：2025年度、第一届"
            value={newCycle.name}
            onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">开始时间</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={newCycle.startDate}
            onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">截止时间</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={newCycle.endDate}
            onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="announceDate">预计公布时间（可选）</Label>
          <div className="flex gap-2">
            <Input
              id="announceDate"
              type="datetime-local"
              value={newCycle.announceDate}
              onChange={(e) => setNewCycle({ ...newCycle, announceDate: e.target.value })}
            />
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 周期列表 */}
      {cycles.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>周期名称</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>截止时间</TableHead>
              <TableHead>预计公布</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.map((cycle) => (
              <TableRow key={cycle.id}>
                <TableCell className="font-medium">{cycle.name}</TableCell>
                <TableCell className="text-sm">
                  {new Date(cycle.startDate).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(cycle.endDate).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cycle.announceDate
                    ? new Date(cycle.announceDate).toLocaleString('zh-CN')
                    : '-'
                  }
                </TableCell>
                <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cycle.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          暂无周期，请添加至少一个周期
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        提示：周期用于限定奖项的申请时间。系统会根据当前时间自动更新周期状态。
      </p>
    </div>
  )
}
