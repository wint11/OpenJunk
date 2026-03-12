import { ChatInterface } from "./chat-interface"
import { SessionProviderWrapper } from "@/components/session-provider-wrapper"

export default function AdminChatPage() {
  return (
    <div className="container py-6">
      <SessionProviderWrapper>
        <ChatInterface />
      </SessionProviderWrapper>
    </div>
  )
}
