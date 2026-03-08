/**
 * PPT大赛横幅图片素材配置
 * 图片应放置在：public/images/ppt-contest-banners/
 * 每次刷新页面会随机选择一张图片显示
 */

export interface BannerImage {
  id: string;
  filename: string;
  alt: string;
  description?: string;
  width: number;
  height: number;
}

// 横幅图片素材库 - 使用用户提供的真实图片
export const pptContestBanners: BannerImage[] = [
  {
    id: 'banner-001',
    filename: '微信图片_20260307191647_334_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计1',
    description: 'PPT大赛横幅设计版本1',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-002',
    filename: '微信图片_20260307191648_335_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计2',
    description: 'PPT大赛横幅设计版本2',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-003',
    filename: '微信图片_20260307191649_336_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计3',
    description: 'PPT大赛横幅设计版本3',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-004',
    filename: '微信图片_20260307191650_337_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计4',
    description: 'PPT大赛横幅设计版本4',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-005',
    filename: '微信图片_20260307191651_338_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计5',
    description: 'PPT大赛横幅设计版本5',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-006',
    filename: '微信图片_20260307191652_339_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计6',
    description: 'PPT大赛横幅设计版本6',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-007',
    filename: '微信图片_20260307191653_340_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计7',
    description: 'PPT大赛横幅设计版本7',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-008',
    filename: '微信图片_20260307191654_341_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计8',
    description: 'PPT大赛横幅设计版本8',
    width: 1200,
    height: 400
  },
  {
    id: 'banner-009',
    filename: '微信图片_20260307192145_342_52.jpg',
    alt: '第一届乱讲PPT大赛 - 横幅设计9',
    description: 'PPT大赛横幅设计版本9',
    width: 1200,
    height: 400
  }
];

/**
 * 获取基于当前时间的横幅图片
 * 每分钟返回不同的图片，确保服务器端和客户端水合一致
 */
export function getTimeBasedBanner(): BannerImage {
  const now = new Date()
  // 使用年-月-日-时-分作为随机种子，每分钟变化一次
  const timeString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
  
  // 简单但确定的哈希函数
  let hash = 0
  for (let i = 0; i < timeString.length; i++) {
    hash = ((hash << 5) - hash) + timeString.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }
  
  const timeIndex = Math.abs(hash) % pptContestBanners.length
  return pptContestBanners[timeIndex]
}

/**
 * 获取基于当前日期的横幅图片
 * 每天返回相同的图片，确保服务器端和客户端水合一致
 * @deprecated 使用 getTimeBasedBanner 替代，以获得更频繁的变化
 */
export function getDailyBanner(): BannerImage {
  const today = new Date()
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  
  // 简单但确定的哈希函数
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }
  
  const dailyIndex = Math.abs(hash) % pptContestBanners.length
  return pptContestBanners[dailyIndex]
}

/**
 * 获取随机横幅图片（不推荐使用，可能导致水合不匹配）
 * 仅用于不需要服务器端渲染的场景
 */
export function getRandomBanner(): BannerImage {
  const randomIndex = Math.floor(Math.random() * pptContestBanners.length);
  return pptContestBanners[randomIndex];
}

/**
 * 获取横幅图片的完整URL路径
 * 自动对文件名进行URL编码，处理中文字符
 */
export function getBannerUrl(banner: BannerImage): string {
  const encodedFilename = encodeURIComponent(banner.filename);
  return `/images/ppt-contest-banners/${encodedFilename}`;
}

/**
 * 获取所有横幅图片的URL列表
 */
export function getAllBannerUrls(): string[] {
  return pptContestBanners.map(banner => getBannerUrl(banner));
}