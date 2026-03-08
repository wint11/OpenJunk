import { getContestStats } from "./actions"
import { ClearButton } from "./clear-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileArchive, Database, FolderOpen, HardDrive, File, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ContestBanner } from "@/components/ppt-contest/contest-banner"

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default async function ContestAdminPage() {
    const stats = await getContestStats()

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto pt-24">
            {/* 横幅图片区域 */}
            <div className="mb-8">
                <ContestBanner className="mb-6" priority={true} />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">第一届乱讲PPT大赛 - 赛事管理</h1>
                        <p className="text-muted-foreground mt-2">
                            查看赛事数据统计，并在必要时清空所有数据（慎用）。
                        </p>
                    </div>
                    <ClearButton />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Database Stats */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">数据库记录</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.submissions + stats.interpretations} 条</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            包含 {stats.submissions} 个参赛作品 (PPT) 和 {stats.interpretations} 个解说录音
                        </p>
                    </CardContent>
                </Card>

                {/* File Storage Stats */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">文件存储占用</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(stats.totalFileSize)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            所有上传文件总大小 (PPT + PDF + Audio)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        文件详情列表
                    </CardTitle>
                    <CardDescription>
                        以下目录中的所有文件将在执行清空操作时被删除。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* PPT Files */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">原始 PPT 文件</p>
                                <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded w-fit mt-1">
                                    public/uploads/ppt-contest
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">{stats.files['ppt-contest']?.count || 0} 个文件</div>
                                <div className="text-xs text-muted-foreground">{formatBytes(stats.files['ppt-contest']?.size || 0)}</div>
                            </div>
                        </div>
                        {stats.files['ppt-contest']?.files.length > 0 && (
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                                <div className="space-y-2">
                                    {stats.files['ppt-contest'].files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs group hover:bg-muted/50 p-1 rounded transition-colors">
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <File className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="truncate" title={file.name}>{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
                                                <span className="font-mono">{formatBytes(file.size)}</span>
                                                <span className="w-24 text-right">{new Date(file.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    <Separator />

                    {/* PDF Preview Files */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">PDF 预览文件</p>
                                <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded w-fit mt-1">
                                    public/uploads/ppt-contest-preview
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">{stats.files['ppt-contest-preview']?.count || 0} 个文件</div>
                                <div className="text-xs text-muted-foreground">{formatBytes(stats.files['ppt-contest-preview']?.size || 0)}</div>
                            </div>
                        </div>
                        {stats.files['ppt-contest-preview']?.files.length > 0 && (
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                                <div className="space-y-2">
                                    {stats.files['ppt-contest-preview'].files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs group hover:bg-muted/50 p-1 rounded transition-colors">
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <File className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="truncate" title={file.name}>{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
                                                <span className="font-mono">{formatBytes(file.size)}</span>
                                                <span className="w-24 text-right">{new Date(file.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    <Separator />

                    {/* Audio Files */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">录音文件 (WebM)</p>
                                <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded w-fit mt-1">
                                    public/uploads/ppt-contest-audio
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">{stats.files['ppt-contest-audio']?.count || 0} 个文件</div>
                                <div className="text-xs text-muted-foreground">{formatBytes(stats.files['ppt-contest-audio']?.size || 0)}</div>
                            </div>
                        </div>
                        {stats.files['ppt-contest-audio']?.files.length > 0 && (
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                                <div className="space-y-2">
                                    {stats.files['ppt-contest-audio'].files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs group hover:bg-muted/50 p-1 rounded transition-colors">
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <File className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="truncate" title={file.name}>{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
                                                <span className="font-mono">{formatBytes(file.size)}</span>
                                                <span className="w-24 text-right">{new Date(file.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
