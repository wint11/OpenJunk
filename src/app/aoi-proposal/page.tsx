import { Metadata } from "next"
import { DataUsageAgreement } from "@/components/data-usage-agreement"

export const metadata: Metadata = {
  title: "用户上传论文数据使用授权书 - OpenJunk",
  description: "OpenJunk平台用户上传论文数据使用授权书",
}

export default function DataUsageAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="bg-white shadow-sm">
        <DataUsageAgreement 
          platformName="OpenJunk"
          date={new Date().toLocaleDateString("zh-CN")}
        />
      </div>
    </div>
  )
}
