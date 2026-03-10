"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Footprints, 
  Waves, 
  Sparkles, 
  CircleDashed,
  Send,
  User,
  Mail,
  BookOpen,
  CheckCircle,
  PenLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const categories = [
  {
    id: "TRACE",
    name: "迹",
    subtitle: "足迹、心迹、成长的痕迹",
    description: "复盘类、经历分享、里程碑记录",
    icon: Footprints,
    theme: "amber",
    bgGradient: "from-amber-50 via-orange-50 to-yellow-50",
    accentColor: "text-amber-600",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-200",
    ringColor: "ring-amber-400",
  },
  {
    id: "CROSS",
    name: "渡",
    subtitle: "渡过迷茫，成长是温柔的摆渡",
    description: "心路历程、挫折反思、转折故事",
    icon: Waves,
    theme: "teal",
    bgGradient: "from-teal-50 via-cyan-50 to-emerald-50",
    accentColor: "text-teal-600",
    bgColor: "bg-teal-500",
    borderColor: "border-teal-200",
    ringColor: "ring-teal-400",
  },
  {
    id: "LIGHT",
    name: "光",
    subtitle: "捕捉微光时刻，照亮自己也温暖他人",
    description: "顿悟瞬间、小确幸、治愈向内容",
    icon: Sparkles,
    theme: "yellow",
    bgGradient: "from-yellow-50 via-amber-50 to-orange-50",
    accentColor: "text-yellow-600",
    bgColor: "bg-yellow-500",
    borderColor: "border-yellow-200",
    ringColor: "ring-yellow-400",
  },
  {
    id: "UNFINISHED",
    name: "未",
    subtitle: "保持未完成态，成长永远有下一章",
    description: "学习进行时、目标规划、开放思考",
    icon: CircleDashed,
    theme: "violet",
    bgGradient: "from-violet-50 via-purple-50 to-fuchsia-50",
    accentColor: "text-violet-600",
    bgColor: "bg-violet-500",
    borderColor: "border-violet-200",
    ringColor: "ring-violet-400",
  },
];

export default function SubmitStoryPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    authorName: "",
    authorEmail: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category: selectedCategory,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/discovery/stories");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit story:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-50/50 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-[100px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white/80 backdrop-blur-md rounded-[2rem] p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center max-w-md w-full border border-stone-100"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            投稿成功！
          </h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            感谢你的分享，故事已提交审阅。<br/>
            期待它能温暖更多人。
          </p>
          <Button
            onClick={() => router.push("/discovery/stories")}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-full py-6 text-lg shadow-lg shadow-stone-200 transition-all duration-300"
          >
            返回故事社区
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] relative selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-stone-100/60 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-2xl shadow-sm border border-stone-100">
              <PenLine className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4 tracking-tight">
              写下你的故事
            </h1>
            <p className="text-lg text-stone-500 font-light">
              每一个真实的经历，都值得被记录和倾听
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 选择栏目 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-bold text-stone-700 mb-4 ml-1">
                选择一个栏目 <span className="text-orange-500">*</span>
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  
                  return (
                    <div
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "cursor-pointer relative p-6 rounded-2xl border transition-all duration-300 group",
                        isSelected 
                          ? cn("bg-white shadow-md border-orange-200 ring-1 ring-orange-100", category.accentColor)
                          : "bg-white/50 border-transparent hover:bg-white hover:border-stone-200 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          isSelected ? category.bgColor : "bg-stone-100 text-stone-400 group-hover:bg-stone-200"
                        )}>
                          <Icon className={cn("w-6 h-6", isSelected ? "text-white" : "")} />
                        </div>
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-lg font-bold mb-1 transition-colors",
                            isSelected ? "text-stone-800" : "text-stone-600"
                          )}>
                            {category.name}
                          </h3>
                          <p className="text-sm text-stone-500 font-medium mb-1">
                            {category.subtitle}
                          </p>
                          <p className="text-xs text-stone-400 font-light">
                            {category.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-orange-500">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 内容输入区域 */}
            <div className="grid md:grid-cols-1 gap-8">
              {/* 作者信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800">
                    作者信息
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      署名 <span className="text-orange-500">*</span>
                    </label>
                    <Input
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      placeholder="可以是真名、笔名或匿名"
                      required
                      className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      邮箱（可选）
                    </label>
                    <Input
                      type="email"
                      value={formData.authorEmail}
                      onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                      placeholder="用于接收审阅结果通知"
                      className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-orange-100 transition-all"
                    />
                    <p className="text-xs text-stone-400 mt-2 ml-1">
                      我们不会公开你的邮箱，仅用于通知
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 故事内容 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800">
                    故事内容
                  </h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      标题 <span className="text-orange-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="给你的故事起一个标题"
                      required
                      className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-orange-100 transition-all font-medium text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      正文 <span className="text-orange-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="在这里写下你的故事..."
                      required
                      rows={12}
                      className="min-h-[300px] rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-orange-100 transition-all resize-none p-4 leading-relaxed"
                    />
                    <div className="flex justify-between items-center mt-2 px-1">
                      <p className="text-xs text-stone-400">
                        建议字数：300-3000字
                      </p>
                      <span className="text-xs text-stone-400">
                        {formData.content.length} 字
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 提交按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <Button
                type="submit"
                size="lg"
                disabled={!selectedCategory || isSubmitting}
                className="w-full h-14 bg-stone-800 hover:bg-stone-700 text-white rounded-full text-lg shadow-lg shadow-stone-200 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    提交中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-medium tracking-wide">
                    <Send className="w-5 h-5" />
                    提交故事
                  </span>
                )}
              </Button>
              <p className="text-center text-xs text-stone-400 mt-4">
                提交后需要经过审阅，通过后会展示在首页
              </p>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
}
