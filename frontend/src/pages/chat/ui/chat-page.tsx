import { useParams } from 'react-router-dom';
import { ChatLayout } from '@widgets/chat-layout';

export function ChatPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  return <ChatLayout workspaceSlug={workspaceSlug!} />;
}
