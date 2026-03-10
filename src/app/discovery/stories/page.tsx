"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Footprints, 
  Waves, 
  Sparkles, 
  CircleDashed,
  PenLine,
  Heart,
  Eye,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 四个栏目的配置
const categories = [
  {
    id: "TRACE",
    name: "迹",
    subtitle: "足迹、心迹、成长的痕迹",
    description: "每一步，都算数",
    theme: "amber",
    icon: Footprints,
    bgGradient: "from-amber-50 via-orange-50 to-yellow-50",
    accentColor: "text-amber-600",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-200",
  },
  {
    id: "CROSS",
    name: "渡",
    subtitle: "渡过迷茫，成长是温柔的摆渡",
    description: "在迷茫中，温柔前行",
    theme: "teal",
    icon: Waves,
    bgGradient: "from-teal-50 via-cyan-50 to-emerald-50",
    accentColor: "text-teal-600",
    bgColor: "bg-teal-500",
    borderColor: "border-teal-200",
  },
  {
    id: "LIGHT",
    name: "光",
    subtitle: "捕捉微光时刻，照亮自己也温暖他人",
    description: "微光成炬，照亮来路",
    theme: "yellow",
    icon: Sparkles,
    bgGradient: "from-yellow-50 via-amber-50 to-orange-50",
    accentColor: "text-yellow-600",
    bgColor: "bg-yellow-500",
    borderColor: "border-yellow-200",
  },
  {
    id: "UNFINISHED",
    name: "未",
    subtitle: "保持未完成态，成长永远有下一章",
    description: "故事未完，等你续写",
    theme: "violet",
    icon: CircleDashed,
    bgGradient: "from-violet-50 via-purple-50 to-fuchsia-50",
    accentColor: "text-violet-600",
    bgColor: "bg-violet-500",
    borderColor: "border-violet-200",
  },
];

interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  likes: number;
  views: number;
  isFeatured: boolean;
  createdAt: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [selectedCategory]);

  const fetchStories = async () => {
    try {
      const url = selectedCategory 
        ? `/api/stories?category=${selectedCategory}&status=APPROVED`
        : `/api/stories?status=APPROVED`;
      const res = await fetch(url);
      const data = await res.json();
      setStories(data.stories || []);
      
      // 获取精选故事
      const featuredRes = await fetch(`/api/stories?featured=true&limit=3`);
      const featuredData = await featuredRes.json();
      setFeaturedStories(featuredData.stories || []);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryStories = (categoryId: string) => {
    return stories.filter(s => s.category === categoryId).slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] relative selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      {/* 背景装饰 - 更柔和的色彩 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-amber-50/60 rounded-full blur-[140px] opacity-70" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-rose-50/30 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10">
        {/* 顶部横幅 */}
        <section className="py-24 px-6 md:px-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-stone-800 mb-8 tracking-tight leading-tight">
              拾碎成光 渡向未来
            </h1>
            
            <p className="text-xl text-stone-500 mb-12 leading-relaxed max-w-xl mx-auto font-light">
              记录真实的感动，连接你我的共鸣。
            </p>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/discovery/stories/submit">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-orange-200/50 transition-all duration-300 border-2 border-orange-400/20"
                >
                  <PenLine className="w-5 h-5 mr-2" />
                  写下你的故事
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 精选故事 */}
        {featuredStories.length > 0 && (
          <section className="py-12 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-8 w-1 bg-orange-400 rounded-full" />
                <h2 className="text-2xl font-bold text-stone-800">精选故事</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {featuredStories.map((story, index) => (
                  <StoryCard key={story.id} story={story} index={index} featured />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 四个栏目 */}
        <section className="py-16 px-6 md:px-12 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-8 w-1 bg-stone-400 rounded-full" />
              <h2 className="text-2xl font-bold text-stone-800">探索故事</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
              {categories.map((category, index) => {
                const categoryStories = getCategoryStories(category.id);
                const Icon = category.icon;
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-500",
                      "bg-white border border-stone-100",
                      "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1"
                    )}
                  >
                    {/* 背景渐变装饰 */}
                    <div className={cn(
                      "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                      category.bgColor
                    )} />

                    {/* 栏目标题 */}
                    <div className="relative flex items-start gap-5 mb-8">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        category.bgGradient
                      )}>
                        <Icon className={cn("w-8 h-8", category.accentColor)} />
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-2xl font-bold text-stone-800 mb-2 group-hover:text-orange-900/80 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm font-medium text-stone-500 mb-1">
                          {category.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* 故事列表 */}
                    <div className="relative space-y-4 min-h-[180px]">
                      {categoryStories.length > 0 ? (
                        categoryStories.map((story) => (
                          <Link 
                            key={story.id} 
                            href={`/discovery/stories/${story.id}`}
                            className="block"
                          >
                            <div className="p-4 rounded-xl bg-stone-50/50 hover:bg-orange-50/50 transition-colors duration-300 border border-transparent hover:border-orange-100/50 group/item">
                              <h4 className="font-medium text-stone-700 group-hover/item:text-orange-800 line-clamp-1 mb-2 transition-colors">
                                {story.title}
                              </h4>
                              <div className="flex items-center justify-between text-xs text-stone-400">
                                <span className="font-light">{story.authorName}</span>
                                <div className="flex items-center gap-3 opacity-60 group-hover/item:opacity-100 transition-opacity">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {story.views}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {story.likes}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 py-8 border-2 border-dashed border-stone-100 rounded-xl">
                          <PenLine className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">暂无故事，期待你的投稿</p>
                        </div>
                      )}
                    </div>

                    {/* 查看更多 */}
                    <div className="mt-8 pt-6 border-t border-stone-100">
                      <Link 
                        href={`/discovery/stories?category=${category.id}`}
                        className={cn(
                          "inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3",
                          category.accentColor,
                          "opacity-80 hover:opacity-100"
                        )}
                      >
                        浏览全部
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// 故事卡片组件
function StoryCard({ story, index, featured = false }: { 
  story: Story; 
  index: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={`/discovery/stories/${story.id}`} className="block h-full">
        <div className={cn(
          "h-full bg-white rounded-[1.5rem] overflow-hidden transition-all duration-300 border border-stone-100",
          "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1",
          featured && "ring-1 ring-orange-100"
        )}>
          <div className="p-7 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full tracking-wide",
                story.category === "TRACE" && "text-amber-700 bg-amber-50",
                story.category === "CROSS" && "text-teal-700 bg-teal-50",
                story.category === "LIGHT" && "text-yellow-700 bg-yellow-50",
                story.category === "UNFINISHED" && "text-violet-700 bg-violet-50",
              )}>
                {story.category === "TRACE" && "迹"}
                {story.category === "CROSS" && "渡"}
                {story.category === "LIGHT" && "光"}
                {story.category === "UNFINISHED" && "未"}
              </span>
              {featured && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  精选
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-stone-800 mb-3 line-clamp-2 leading-tight group-hover:text-orange-800 transition-colors">
              {story.title}
            </h3>
            
            <p className="text-sm text-stone-500 line-clamp-3 mb-6 leading-relaxed flex-grow font-light">
              {story.content}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-stone-50 text-xs font-medium text-stone-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                  <span className="text-[10px]">{story.authorName.charAt(0)}</span>
                </div>
                <span>{story.authorName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 hover:text-stone-600 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  {story.views}
                </span>
                <span className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                  <Heart className="w-3.5 h-3.5" />
                  {story.likes}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
