"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Footprints, 
  Waves, 
  Sparkles, 
  CircleDashed,
  Heart,
  Eye,
  Calendar,
  User,
  ArrowLeft,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = {
  TRACE: {
    name: "迹",
    subtitle: "足迹、心迹、成长的痕迹",
    icon: Footprints,
    theme: "amber",
    bgGradient: "from-amber-50 via-orange-50 to-yellow-50",
    accentColor: "text-amber-600",
    bgColor: "bg-amber-500",
    lightBg: "bg-amber-50",
  },
  CROSS: {
    name: "渡",
    subtitle: "渡过迷茫，成长是温柔的摆渡",
    icon: Waves,
    theme: "teal",
    bgGradient: "from-teal-50 via-cyan-50 to-emerald-50",
    accentColor: "text-teal-600",
    bgColor: "bg-teal-500",
    lightBg: "bg-teal-50",
  },
  LIGHT: {
    name: "光",
    subtitle: "捕捉微光时刻，照亮自己也温暖他人",
    icon: Sparkles,
    theme: "yellow",
    bgGradient: "from-yellow-50 via-amber-50 to-orange-50",
    accentColor: "text-yellow-600",
    bgColor: "bg-yellow-500",
    lightBg: "bg-yellow-50",
  },
  UNFINISHED: {
    name: "未",
    subtitle: "保持未完成态，成长永远有下一章",
    icon: CircleDashed,
    theme: "violet",
    bgGradient: "from-violet-50 via-purple-50 to-fuchsia-50",
    accentColor: "text-violet-600",
    bgColor: "bg-violet-500",
    lightBg: "bg-violet-50",
  },
};

interface Story {
  id: string;
  title: string;
  content: string;
  category: keyof typeof categories;
  authorName: string;
  likes: number;
  views: number;
  isFeatured: boolean;
  createdAt: string;
}

export default function StoryDetailPage() {
  const params = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [params.id]);

  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/stories/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setStory(data.story);
        // 增加浏览量
        await fetch(`/api/stories/${params.id}/view`, { method: "POST" });
      }
    } catch (error) {
      console.error("Failed to fetch story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    try {
      await fetch(`/api/stories/${params.id}/like`, { method: "POST" });
      setLiked(true);
      setStory(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    } catch (error) {
      console.error("Failed to like story:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin" />
          <div className="text-stone-400 font-medium">故事加载中...</div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-stone-100">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
            <CircleDashed className="w-8 h-8" />
          </div>
          <p className="text-stone-500 mb-6 font-medium">故事不存在或已被删除</p>
          <Link href="/discovery/stories">
            <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-800">
              返回故事社区
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categories[story.category as keyof typeof categories] || categories.TRACE;
  const Icon = category.icon;

  return (
    <div className="min-h-screen bg-[#FDFCF8] relative selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={cn("absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40", category.bgGradient.split(" ")[0].replace("from-", "bg-"))} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-stone-100/60 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* 顶部导航 */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-100/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/discovery/stories">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-full pl-2 pr-4">
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100/50">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 文章内容 */}
        <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden"
          >
            {/* 头部 */}
            <div className={cn("p-8 md:p-10 border-b border-stone-50/50 relative overflow-hidden")}>
               <div className={cn("absolute inset-0 opacity-30", category.bgGradient)} />
               <div className="relative">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className={cn("px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 bg-white/60 backdrop-blur-sm shadow-sm", category.accentColor)}>
                    <Icon className="w-3.5 h-3.5" />
                    {category.name}
                  </div>
                  <span className="text-xs font-medium text-stone-400">
                    {category.subtitle}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-6 leading-tight tracking-tight">
                  {story.title}
                </h1>
                
                <div className="flex items-center justify-between text-sm text-stone-500 font-medium">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full">
                      <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-600 font-bold">
                        {story.authorName.charAt(0)}
                      </div>
                      {story.authorName}
                    </span>
                    <span className="flex items-center gap-1.5 text-stone-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(story.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-400">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {story.views}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 正文 */}
            <div className="p-8 md:p-12">
              <div className="prose prose-stone prose-lg max-w-none prose-headings:font-bold prose-p:text-stone-600 prose-p:leading-loose">
                {story.content.split("\n").map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>

            {/* 底部互动 */}
            <div className="p-8 border-t border-stone-100 bg-stone-50/30">
              <div className="flex flex-col items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLike}
                  className={cn(
                    "group relative flex items-center gap-3 px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 shadow-sm border",
                    liked 
                      ? "bg-rose-50 border-rose-200 text-rose-600 shadow-rose-100" 
                      : "bg-white border-stone-200 text-stone-600 hover:border-rose-200 hover:text-rose-500"
                  )}
                >
                  <Heart className={cn("w-6 h-6 transition-colors", liked ? "fill-rose-500" : "group-hover:text-rose-500")} />
                  <span>{liked ? "已点赞" : "点赞"}</span>
                  <span className={cn("ml-1 text-base", liked ? "text-rose-500" : "text-stone-400 group-hover:text-rose-400")}>
                    {story.likes}
                  </span>
                </motion.button>
                <p className="text-xs text-stone-400 font-light">
                  点赞是最好的鼓励
                </p>
              </div>
            </div>
          </motion.div>

          {/* 更多故事推荐 */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-6 w-1 bg-stone-300 rounded-full" />
               <h3 className="text-xl font-bold text-stone-800">更多故事</h3>
            </div>
            <MoreStories currentId={story.id} category={story.category} />
          </div>
        </article>
      </div>
    </div>
  );
}

// 更多故事组件
function MoreStories({ currentId, category }: { currentId: string; category: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const categoryConfig = categories[category as keyof typeof categories] || categories.TRACE;

  useEffect(() => {
    fetchMoreStories();
  }, [currentId, category]);

  const fetchMoreStories = async () => {
    if (!category) return;
    try {
      const res = await fetch(`/api/stories?category=${category}&status=APPROVED&limit=3`);
      const data = await res.json();
      setStories(data.stories?.filter((s: Story) => s.id !== currentId).slice(0, 2) || []);
    } catch (error) {
      console.error("Failed to fetch more stories:", error);
    }
  };

  if (stories.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {stories.map((story) => (
        <Link key={story.id} href={`/discovery/stories/${story.id}`}>
          <div className="h-full bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors")}>
                {categoryConfig.name}
              </span>
            </div>
            <h4 className="text-lg font-bold text-stone-800 line-clamp-1 mb-3 group-hover:text-orange-800 transition-colors">
              {story.title}
            </h4>
            <p className="text-sm text-stone-500 line-clamp-3 mb-4 leading-relaxed font-light">
              {story.content}
            </p>
            <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-50">
              <span className="font-medium">{story.authorName}</span>
              <span className="flex items-center gap-1 group-hover:text-rose-400 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                {story.likes}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
