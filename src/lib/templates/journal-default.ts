export const JOURNAL_DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}}</title>
    <!-- Tailwind CSS is injected by the preview runner -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-track { background-color: #0f172a; }
    </style>
</head>
<body class="bg-slate-950 text-slate-50 min-h-screen selection:bg-indigo-500/30">
    <div class="container mx-auto py-12 px-4 space-y-12 max-w-7xl">
        
        <!-- Header Section -->
        <header class="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div class="space-y-6">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-400">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                    </div>
                    <h1 class="text-4xl font-bold tracking-tight text-white">{{name}}</h1>
                </div>
                
                <p class="text-lg text-slate-400 leading-relaxed max-w-3xl">
                    {{#if description}}
                        {{description}}
                    {{else}}
                        暂无描述
                    {{/if}}
                </p>
                
                <div class="flex flex-wrap gap-6 text-sm text-slate-500 pt-2">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                        <span>已收录 <span class="text-slate-200 font-medium">{{paperCount}}</span> 篇论文</span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span>{{adminCount}} 位编辑</span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        <span>创建于 {{createdAt}}</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-10 gap-12">
            <!-- Left Column: Guidelines -->
            <aside class="lg:col-span-4 space-y-6">
                <div class="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                    <h2 class="text-2xl font-bold text-white">投稿指南</h2>
                </div>
                
                <div class="bg-slate-900/30 rounded-2xl border border-slate-800 p-6 space-y-6 hover:border-slate-700 transition-colors">
                    <div class="prose prose-invert prose-sm max-w-none text-slate-400 whitespace-pre-wrap">
                        {{#if guidelines}}
                            {{guidelines}}
                        {{else}}
                            <p class="italic opacity-60">该期刊暂未发布详细的投稿指南。</p>
                        {{/if}}
                    </div>
                    
                    {{#if guidelinesUrl}}
                    <div class="pt-4 border-t border-slate-800">
                        <a href="{{guidelinesUrl}}" target="_blank" class="flex items-center justify-center w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 group-hover:-translate-y-0.5 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            下载投稿附件
                        </a>
                    </div>
                    {{/if}}
                </div>
            </aside>

            <!-- Right Column: Latest Papers -->
            <main class="lg:col-span-6 space-y-6">
                <div class="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                    <h2 class="text-2xl font-bold text-white">最新录用</h2>
                </div>

                <div class="flex flex-col gap-4">
                    {{#if papers.length}}
                        {{#each papers}}
                        <div class="group relative bg-slate-900/30 rounded-2xl border border-slate-800 p-6 hover:bg-slate-900/50 hover:border-indigo-500/30 transition-all duration-300">
                            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                            
                            <div class="relative space-y-3">
                                <a href="/novel/{{id}}" class="block">
                                    <h3 class="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {{title}}
                                    </h3>
                                </a>
                                
                                <div class="flex items-center gap-3 text-xs text-slate-500">
                                    <span class="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        {{author}}
                                    </span>
                                    <span>•</span>
                                    <span>{{date}}</span>
                                    {{#if category}}
                                    <span class="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        {{category}}
                                    </span>
                                    {{/if}}
                                </div>
                                
                                <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                                    {{#if description}}
                                        {{description}}
                                    {{else}}
                                        暂无摘要
                                    {{/if}}
                                </p>
                            </div>
                        </div>
                        {{/each}}
                    {{else}}
                        <div class="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="18"/></svg>
                            <p>该期刊暂无已发表论文</p>
                        </div>
                    {{/if}}
                </div>
            </main>
        </div>
    </div>
</body>
</html>`;
