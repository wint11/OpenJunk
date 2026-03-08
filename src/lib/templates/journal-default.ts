export const JOURNAL_DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}}</title>
    <!-- Tailwind CSS is injected by the preview runner -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        /* Custom scrollbar for light theme */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-track { background-color: #f1f5f9; }
    </style>
</head>
<body class="bg-background text-foreground min-h-screen">
    <div class="container mx-auto py-12 px-4 space-y-12 max-w-7xl">

        <!-- Header Section -->
        <header class="bg-muted/30 p-8 rounded-xl border flex flex-col md:flex-row gap-8 items-start">
            <div class="flex-1 space-y-4">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <h1 class="text-3xl font-bold tracking-tight">{{name}}</h1>
                </div>

                <p class="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {{#if description}}
                        {{description}}
                    {{else}}
                        暂无描述
                    {{/if}}
                </p>

                <div class="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                        <span>已收录 <span class="text-foreground font-medium">{{paperCount}}</span> 篇论文</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span>{{adminCount}} 位编辑</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        <span>创建于 {{createdAt}}</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-10 gap-12">
            <!-- Left Column: Guidelines -->
            <aside class="lg:col-span-4 space-y-6">
                <h2 class="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4">
                    投稿指南
                </h2>

                <div class="bg-muted/10 rounded-xl border p-6 space-y-4">
                    <div class="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                        {{#if guidelines}}
                            {{guidelines}}
                        {{else}}
                            <p class="italic opacity-60">该期刊暂未发布详细的投稿指南。</p>
                        {{/if}}
                    </div>

                    {{#if guidelinesUrl}}
                    <div class="pt-4 border-t">
                        <a href="{{guidelinesUrl}}" target="_blank" class="flex items-center justify-center w-full px-4 py-2 bg-background hover:bg-muted border text-foreground text-sm font-medium rounded-lg transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            下载投稿附件
                        </a>
                    </div>
                    {{/if}}
                </div>
            </aside>

            <!-- Right Column: Latest Papers -->
            <main class="lg:col-span-6 space-y-6">
                <h2 class="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4">
                    最新录用
                </h2>

                <div class="flex flex-col gap-4">
                    {{#if papers.length}}
                        {{#each papers}}
                        <div class="group bg-card rounded-xl border p-6 hover:shadow-md transition-all">
                            <div class="space-y-3">
                                <a href="/novel/{{id}}" class="block hover:underline decoration-primary underline-offset-4">
                                    <h3 class="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                        {{title}}
                                    </h3>
                                </a>

                                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{{author}}</span>
                                    <span>•</span>
                                    <span>{{date}}</span>
                                    {{#if category}}
                                    <span class="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">
                                        {{category}}
                                    </span>
                                    {{/if}}
                                </div>

                                <p class="text-sm text-muted-foreground line-clamp-2">
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
                        <div class="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
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
