import { ChatInterfacePip } from "./chat-interface-pip"
import { SessionProviderWrapper } from "@/components/session-provider-wrapper"

export default function AdminChatPage() {
  return (
    <div className="container py-6">
      <SessionProviderWrapper>
        <ChatInterfacePip />
      </SessionProviderWrapper>
    </div>
  )
}
