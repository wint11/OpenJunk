import { Button } from "@/components/ui/button";
import { Stage2Record } from "../components/stage2-record";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Stage2Page() {
  return (
    <div className="h-screen bg-background flex flex-col">
       <Stage2Record />
    </div>
  );
}
