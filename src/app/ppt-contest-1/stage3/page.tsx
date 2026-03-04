import { Button } from "@/components/ui/button";
import { Stage3Vote } from "../components/stage3-vote";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Stage3Page() {
  return (
    <div className="h-screen bg-background flex flex-col">
       <Stage3Vote />
    </div>
  );
}
