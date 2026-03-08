'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { createTrack, deleteTrack, updateTrackJournals } from "./actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Journal {
  id: string
  name: string
}

interface Track {
  id: string
  name: string
  description: string | null
  order: number
  journals: Journal[]
}

interface TracksManagerProps {
  awardId: string
  tracks: Track[]
  journals: Journal[]
}

export function TracksManager({ awardId, tracks, journals }: TracksManagerProps) {
  const [trackList, setTrackList] = useState<Track[]>(tracks)
  const [newTrack, setNewTrack] = useState({ name: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [selectedJournals, setSelectedJournals] = useState<string[]>([])

  const handleAdd = async () => {
    if (!newTrack.name.trim()) {
      toast.error("请输入赛道名称")
      return
    }

    setLoading(true)
    const res = await createTrack(awardId, {
      ...newTrack,
      order: trackList.length
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("赛道已添加")
      setNewTrack({ name: "", description: "" })
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此赛道吗？该赛道下的申请将失去赛道信息。")) return

    setLoading(true)
    const res = await deleteTrack(id)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("赛道已删除")
      window.location.reload()
    }
  }

  const handleEditJournals = (track: Track) => {
    setEditingTrack(track.id)
    setSelectedJournals(track.journals.map(j => j.id))
  }

  const handleSaveJournals = async (trackId: string) => {
    setLoading(true)
    const res = await updateTrackJournals(trackId, selectedJournals)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("期刊关联已更新")
      setEditingTrack(null)
      window.location.reload()
    }
  }

  const toggleJournal = (journalId: string) => {
    setSelectedJournals(prev =>
      prev.includes(journalId)
        ? prev.filter(id => id !== journalId)
        : [...prev, journalId]
    )
  }

  return (
    <div className="space-y-4">
      {/* 添加新赛道 */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="trackName">赛道名称</Label>
          <Input
            id="trackName"
            placeholder="如：理论垃圾、实验垃圾"
            value={newTrack.name}
            onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })}
          />
        </div>
        <Button onClick={handleAdd} disabled={loading} className="mb-0">
          <Plus className="h-4 w-4 mr-1" />
          添加赛道
        </Button>
      </div>

      <div className="space-y-2">
        <Label>赛道描述（可选）</Label>
        <Input
          placeholder="如：面向理论研究的垃圾论文"
          value={newTrack.description}
          onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
        />
      </div>

      {/* 赛道列表 */}
      {trackList.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>赛道名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>关联期刊</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackList.map((track) => (
              <TableRow key={track.id}>
                <TableCell className="font-medium">{track.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {track.description || '-'}
                </TableCell>
                <TableCell>
                  {editingTrack === track.id ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {selectedJournals.map(journalId => {
                          const journal = journals.find(j => j.id === journalId)
                          return journal ? (
                            <Badge 
                              key={journalId} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100"
                              onClick={() => toggleJournal(journalId)}
                            >
                              {journal.name}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ) : null
                        })}
                      </div>
                      <Select onValueChange={toggleJournal}>
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="添加期刊..." />
                        </SelectTrigger>
                        <SelectContent>
                          {journals
                            .filter(j => !selectedJournals.includes(j.id))
                            .map(journal => (
                              <SelectItem key={journal.id} value={journal.id}>
                                {journal.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveJournals(track.id)}
                          disabled={loading}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTrack(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {track.journals.length > 0 ? (
                        track.journals.map(journal => (
                          <Badge key={journal.id} variant="secondary">
                            {journal.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">所有期刊</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs"
                        onClick={() => handleEditJournals(track)}
                      >
                        编辑
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(track.id)}
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
          暂无赛道，请添加至少一个赛道
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        提示：赛道用于将奖项申请分类。如果不关联特定期刊，则该赛道对所有期刊开放。
      </p>
    </div>
  )
}
