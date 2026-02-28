'use client'

import { useState } from "react"
import { updateProjectNo } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SerialEditor({ id, initialSerialNo }: { id: string, initialSerialNo: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialSerialNo)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSave() {
    if (value === initialSerialNo) {
      setIsEditing(false)
      return
    }
    
    setIsLoading(true)
    const formData = new FormData()
    formData.append("id", id)
    formData.append("projectNo", value)

    const result = await updateProjectNo(null, formData)
    setIsLoading(false)

    if (result.success) {
      toast.success("编号更新成功")
      setIsEditing(false)
    } else {
      toast.error(result.message || "更新失败")
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          className="h-8 w-[180px] font-mono text-sm"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => { setIsEditing(false); setValue(initialSerialNo); }} disabled={isLoading}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-sm">{initialSerialNo}</span>
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" 
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  )
}
