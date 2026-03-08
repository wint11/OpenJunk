'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { createPrizeLevel, deletePrizeLevel, updatePrizeLevelOrder } from "./actions"

interface PrizeLevel {
  id: string
  name: string
  description: string | null
  color: string
  order: number
}

interface PrizeLevelsManagerProps {
  awardId: string
  prizeLevels: PrizeLevel[]
}

export function PrizeLevelsManager({ awardId, prizeLevels }: PrizeLevelsManagerProps) {
  const [levels, setLevels] = useState<PrizeLevel[]>(prizeLevels)
  const [newLevel, setNewLevel] = useState({ name: "", description: "", color: "#FFD700" })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newLevel.name.trim()) {
      toast.error("请输入等级名称")
      return
    }

    setLoading(true)
    const res = await createPrizeLevel(awardId, {
      ...newLevel,
      order: levels.length
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("奖项等级已添加")
      setNewLevel({ name: "", description: "", color: "#FFD700" })
      // 刷新页面以获取新数据
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此奖项等级吗？已分配该等级的申请将失去等级信息。")) return

    setLoading(true)
    const res = await deletePrizeLevel(id)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("奖项等级已删除")
      window.location.reload()
    }
  }

  const moveLevel = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === levels.length - 1) return

    const newLevels = [...levels]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // 交换位置
    ;[newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]]
    
    // 更新order
    newLevels.forEach((level, i) => {
      level.order = i
    })
    
    setLevels(newLevels)

    // 保存到数据库
    setLoading(true)
    const res = await updatePrizeLevelOrder(
      awardId,
      newLevels.map(l => ({ id: l.id, order: l.order }))
    )
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
      // 恢复原顺序
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      {/* 添加新等级 */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="levelName">等级名称</Label>
          <Input
            id="levelName"
            placeholder="如：一等奖、金奖"
            value={newLevel.name}
            onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
          />
        </div>
        <div className="w-32 space-y-2">
          <Label htmlFor="levelColor">颜色</Label>
          <div className="flex gap-2">
            <Input
              id="levelColor"
              type="color"
              value={newLevel.color}
              onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
              className="w-12 h-9 p-1"
            />
            <Input
              value={newLevel.color}
              onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={loading} className="mb-0">
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      <div className="space-y-2">
        <Label>等级描述（可选）</Label>
        <Input
          placeholder="如：授予在理论垃圾领域做出杰出贡献的研究者"
          value={newLevel.description}
          onChange={(e) => setNewLevel({ ...newLevel, description: e.target.value })}
        />
      </div>

      {/* 等级列表 */}
      {levels.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>等级名称</TableHead>
              <TableHead>颜色</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level, index) => (
              <TableRow key={level.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveLevel(index, 'up')}
                      disabled={index === 0 || loading}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveLevel(index, 'down')}
                      disabled={index === levels.length - 1 || loading}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{level.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="text-xs text-muted-foreground">{level.color}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {level.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(level.id)}
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
          暂无奖项等级，请添加至少一个等级
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        提示：奖项等级用于评审时标记申请的结果。建议按照重要性从高到低排序（如：一等奖、二等奖、三等奖）。
      </p>
    </div>
  )
}
