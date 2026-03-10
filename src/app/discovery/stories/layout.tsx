import { StoriesLayoutClient } from "./stories-layout-client";

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoriesLayoutClient>{children}</StoriesLayoutClient>;
}
