"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function StoriesLayoutClient({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    // 记录进入时的本地存储主题设置
    const originalTheme = localStorage.getItem("theme");
    
    // 强制切换到浅色模式
    setTheme("light");

    return () => {
      // 离开时恢复原来的主题
      if (originalTheme) {
        setTheme(originalTheme);
      } else {
        // 如果原来没有设置（即跟随系统），则恢复为 system
        setTheme("system");
      }
    };
  }, []); // 只在组件挂载时执行

  return (
    <div className="force-light min-h-screen bg-[#FDFCF8] text-stone-800" style={{ fontFamily: '"KaiTi", "STKaiti", "楷体", "Baskerville", "Georgia", "serif"' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
}
