"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface AgreementButtonProps {
  journalName: string
}

export function AgreementButton({ journalName }: AgreementButtonProps) {
  const [agreed, setAgreed] = useState(false)

  if (agreed) {
    return <span className="font-bold border-b border-black pb-1">{journalName}</span>
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => setAgreed(true)}
      className="h-8"
    >
      同意授权
    </Button>
  )
}
