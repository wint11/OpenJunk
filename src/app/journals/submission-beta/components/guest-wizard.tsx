
'use client'

import { useState } from 'react'
import { Step1Upload } from './step1-upload'
import { Step2Journal } from './step2-journal'
import { Step3Metadata } from './step3-form'
import { ExtractedMetadata } from '@/lib/ai-analysis'
import { CheckCircle2 } from 'lucide-react'

export type SubmissionState = {
  file: { name: string, tempPath: string } | null
  metadata: ExtractedMetadata | null
  selectedJournal: { id: string, name: string } | null
}

export function GuestSubmissionWizard() {
  const [step, setStep] = useState(1)
  const [submissionData, setSubmissionData] = useState<SubmissionState>({
    file: null,
    metadata: null,
    selectedJournal: null
  })

  const handleFileAnalyzed = (file: { name: string, tempPath: string }, metadata: ExtractedMetadata) => {
    setSubmissionData(prev => ({ ...prev, file, metadata }))
    setStep(2)
  }

  const handleJournalSelected = (journal: { id: string, name: string }) => {
    setSubmissionData(prev => ({ ...prev, selectedJournal: journal }))
    setStep(3)
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">智能投稿向导 (Beta)</h1>
        <p className="text-muted-foreground">AI 辅助，三步轻松完成投稿</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex flex-col items-center bg-background px-4 ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${s <= step ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-300 bg-background'}`}>
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : <span>{s}</span>}
            </div>
            <span className="text-sm font-medium">
              {s === 1 && "上传与分析"}
              {s === 2 && "选择期刊"}
              {s === 3 && "确认信息"}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <Step1Upload onNext={handleFileAnalyzed} />
        )}
        {step === 2 && (
          <Step2Journal 
            metadata={submissionData.metadata} 
            onNext={handleJournalSelected} 
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && submissionData.file && submissionData.selectedJournal && (
          <Step3Metadata 
            file={submissionData.file}
            metadata={submissionData.metadata}
            journal={submissionData.selectedJournal}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  )
}
