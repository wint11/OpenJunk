import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export default async function HoneypotPage() {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"

  // Log the attack attempt
  await prisma.auditLog.create({
    data: {
      action: "HONEYPOT_TRIGGERED",
      resource: "/admin/phpmyadmin",
      details: `Suspicious access attempt. UA: ${userAgent}`,
      ipAddress: ip,
      userId: null, 
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] font-sans text-[#444]">
      <div className="w-[350px] rounded border border-[#ccc] bg-white p-4 shadow-sm">
         <h1 className="mb-4 text-xl font-bold">phpMyAdmin</h1>
         <div className="space-y-4">
            <div>
                <label className="block text-sm mb-1">Username:</label>
                <input type="text" className="w-full border p-1" />
            </div>
            <div>
                <label className="block text-sm mb-1">Password:</label>
                <input type="password" className="w-full border p-1" />
            </div>
            <div>
                <label className="block text-sm mb-1">Server Choice:</label>
                <select className="w-full border p-1">
                    <option>MySQL</option>
                    <option>MariaDB</option>
                </select>
            </div>
            <button className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600">Go</button>
         </div>
         <div className="mt-4 text-xs text-gray-400 text-center">
             <p>Welcome to phpMyAdmin</p>
         </div>
      </div>
    </div>
  )
}
