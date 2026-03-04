export interface SearchShortcut {
  keyword: string;
  url: string;
  description?: string;
  type?: 'internal' | 'external';
}

export const searchShortcuts: SearchShortcut[] = [
  {
    keyword: '第一届乱讲PPT大赛',
    url: '/ppt-contest-1',
    description: '跳转到第一届乱讲PPT大赛活动页面',
    type: 'internal'
  },
  {
    keyword: 'PPT大赛',
    url: '/ppt-contest-1',
    description: '跳转到第一届乱讲PPT大赛活动页面',
    type: 'internal'
  },
  {
    keyword: '乱讲PPT',
    url: '/ppt-contest-1',
    description: '跳转到第一届乱讲PPT大赛活动页面',
    type: 'internal'
  },
];
