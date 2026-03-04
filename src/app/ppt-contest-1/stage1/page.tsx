import { Button } from "@/components/ui/button";
import { Stage1Upload } from "../components/stage1-upload";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Stage1Page() {
  return (
    <div className="h-screen bg-background flex flex-col">
       <Stage1Upload />
    </div>
  );
}
