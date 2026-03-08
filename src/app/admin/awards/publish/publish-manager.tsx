'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { publishApplications } from "./actions"
import { Loader2 } from "lucide-react"

interface PrizeLevel {
  id: string
  name: string
  color: string
  order: number
}

interface Application {
  id: string
  nomineeName: string | null
  nomineeType: string
  status: string
  reviewComment?: string | null
  prizeLevel: { id: string; name: string; color: string } | null
  track: { name: string } | null
  cycle: { id: string; name: string } | null
  journal: { name: string } | null
  nominationPapers: { title: string }[]
}

interface Award {
  id: string
  name: string
  description?: string | null
  prizeLevels: PrizeLevel[]
  cycles: { id: string; name: string }[]
  applications: Application[]
}

interface PublishManagerProps {
  awards: Award[]
}

export function PublishManager({ awards }: PublishManagerProps) {
  const [selectedAwardId, setSelectedAwardId] = useState(awards[0]?.id || "")
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const selectedAward = awards.find(a => a.id === selectedAwardId)
  const filteredApplications = selectedAward?.applications.filter(app =>
    !selectedCycleId || app.cycle?.id === selectedCycleId
  ) || []

  const toggleAppSelection = (appId: string) => {
    setSelectedApps(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

  const toggleAllApps = () => {
    if (selectedApps.length === filteredApplications.length) {
      setSelectedApps([])
    } else {
      setSelectedApps(filteredApplications.map(app => app.id))
    }
  }

  const handlePublish = async () => {
    if (selectedApps.length === 0) {
      toast.error("请至少选择一个申请")
      return
    }

    if (!confirm(`确定要发布选中的 ${selectedApps.length} 个评审结果吗？发布后无法修改。`)) {
      return
    }

    setLoading(true)
    const res = await publishApplications(selectedApps)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`成功发布 ${selectedApps.length} 个评审结果`)
      setSelectedApps([])
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      {/* 奖项选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择奖项</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAwardId} onValueChange={setSelectedAwardId}>
            <SelectTrigger>
              <SelectValue placeholder="请选择要发布的奖项" />
            </SelectTrigger>
            <SelectContent>
              {awards.map((award) => (
                <SelectItem key={award.id} value={award.id}>
                  {award.name} ({award.applications.length} 个待发布)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAward && (
        <>
          {/* 申请列表 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>待发布申请 ({filteredApplications.length})</CardTitle>
              {filteredApplications.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedApps.length === filteredApplications.length && filteredApplications.length > 0}
                    onCheckedChange={toggleAllApps}
                  />
                  <Label className="text-sm">全选</Label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无待发布的评审结果
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedApps.includes(app.id)}
                        onCheckedChange={() => toggleAppSelection(app.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{app.nomineeName}</span>
                          {app.prizeLevel && (
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: `${app.prizeLevel.color}20`,
                                color: app.prizeLevel.color
                              }}
                            >
                              {app.prizeLevel.name}
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                              不予授奖
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {app.track?.name} · {app.cycle?.name}
                          {app.journal && ` · ${app.journal.name}`}
                        </div>
                        {app.reviewComment && (
                          <div className="text-sm text-muted-foreground mt-1 italic">
                            "{app.reviewComment}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedApps.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    发布选中的 {selectedApps.length} 个结果
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
