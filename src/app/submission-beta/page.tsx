'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import dynamic from 'next/dynamic';
import { Badge } from "@/components/ui/badge";
import { FileText, Layout, PenTool, CheckCircle2, Plus, Image as ImageIcon, Trash2 } from "lucide-react";

// Dynamically import PdfPreview to avoid SSR issues
const PdfPreview = dynamic(
  () => import('./pdf-preview').then(mod => mod.PdfPreview),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-muted/20 border rounded-lg">
        <p className="text-muted-foreground animate-pulse">正在生成预览...</p>
      </div>
    )
  }
);

interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'single' | 'double';
  color: string;
}

type ContentBlock = 
  | { type: 'text'; value: string }
  | { type: 'image'; src: string; caption?: string };

const AVAILABLE_TEMPLATES: JournalTemplate[] = [
  {
    id: 'general-single',
    name: '通用单栏模板 (General Single)',
    description: '标准学术期刊单栏排版，适合大多数投稿场景。清晰易读，符合一般审稿要求。',
    layout: 'single',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'general-double',
    name: '通用双栏模板 (General Double)',
    description: '紧凑的双栏排版，模拟正式出版物样式。内容自动分布在左右两栏（实验性功能）。',
    layout: 'double',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  }
];

export default function SubmissionBetaPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  
  const [title, setTitle] = useState('关于人工智能在量子纠缠态中的非线性应用研究');
  const [author, setAuthor] = useState('张三丰, 李四光');
  const [abstract, setAbstract] = useState('本文探讨了人工智能技术在量子物理领域的创新应用。通过深度学习算法，我们成功模拟了量子纠缠态的非线性演化过程。实验结果表明，该方法在处理高维量子系统时具有显著优势，为量子计算的发展提供了新的思路。');
  
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { type: 'text', value: '引言\n\n近年来，人工智能（AI）与量子物理的结合成为了研究热点。传统的量子态模拟方法在面对复杂系统时往往捉襟见肘，而机器学习强大的模式识别能力为解决这一难题带来了曙光。' },
    { type: 'text', value: '研究方法\n\n我们采用了一种基于卷积神经网络（CNN）的新型架构，专门用于处理量子态的波函数数据。该网络通过大量的模拟数据进行训练，能够准确预测量子系统的演化轨迹。' },
    { type: 'text', value: '实验结果\n\n通过对多个基准系统的测试，我们的模型在预测精度和计算速度上均优于传统方法。特别是在处理多粒子纠缠态时，计算效率提升了两个数量级。' },
    { type: 'text', value: '结论\n\n本研究证明了人工智能在量子物理研究中的巨大潜力。未来，我们将进一步探索更复杂的神经网络结构，以期在更广泛的量子系统研究中取得突破。' }
  ]);

  const handleTemplateSelect = (template: JournalTemplate) => {
    setSelectedTemplate(template);
    setActiveStep(2);
  };

  const addTextBlock = () => {
    setContentBlocks([...contentBlocks, { type: 'text', value: '' }]);
  };

  const addImageBlock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setContentBlocks([...contentBlocks, { 
            type: 'image', 
            src: event.target.result as string, 
            caption: '图 ' + (contentBlocks.filter(b => b.type === 'image').length + 1) 
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBlock = (index: number, value: string) => {
    const newBlocks = [...contentBlocks];
    if (newBlocks[index].type === 'text') {
      newBlocks[index] = { ...newBlocks[index], value };
      setContentBlocks(newBlocks);
    }
  };

  const updateImageCaption = (index: number, caption: string) => {
    const newBlocks = [...contentBlocks];
    if (newBlocks[index].type === 'image') {
      // @ts-ignore
      newBlocks[index] = { ...newBlocks[index], caption };
      setContentBlocks(newBlocks);
    }
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...contentBlocks];
    newBlocks.splice(index, 1);
    setContentBlocks(newBlocks);
  };

  const renderBlockEditor = (label: string = "正文内容 (Content)") => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">{label}</Label>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addTextBlock}>
            <Plus className="w-4 h-4 mr-1" /> 添加文本
          </Button>
          <div className="relative">
            <Button size="sm" variant="outline" className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-1" /> 添加图片
            </Button>
            <Input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={addImageBlock}
              value=""
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {contentBlocks.map((block, index) => (
          <div key={index} className="relative group border rounded-md p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => removeBlock(index)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {block.type === 'text' ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">段落文本</Label>
                <Textarea 
                  value={block.value}
                  onChange={(e) => updateBlock(index, e.target.value)}
                  className="min-h-[100px] font-mono text-sm bg-background"
                  placeholder="在此输入段落内容..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">图片 & 图注</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 border rounded bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.src} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      value={block.caption || ''}
                      onChange={(e) => updateImageCaption(index, e.target.value)}
                      placeholder="输入图注 (Caption)..."
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      图片将自动调整大小以适应版面。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {contentBlocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>暂无内容，请点击上方按钮添加文本或图片</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">快速投稿 (Beta)</h1>
          <p className="text-muted-foreground mt-1">
            选择期刊模板，填写内容，一键生成符合规范的 PDF。无需掌握 LaTeX。
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
             Beta 功能
           </Badge>
           <span className="text-xs text-muted-foreground">支持中文排版预览</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Configuration & Input */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Step Indicator */}
          <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg">
            <Button 
              variant={activeStep === 1 ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveStep(1)}
              className="flex-1"
            >
              <Layout className="w-4 h-4 mr-2" /> 1. 选择期刊
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button 
              variant={activeStep === 2 ? "default" : "ghost"} 
              size="sm" 
              onClick={() => {
                if (selectedTemplate) setActiveStep(2);
              }}
              disabled={!selectedTemplate}
              className="flex-1"
            >
              <PenTool className="w-4 h-4 mr-2" /> 2. 填写内容
            </Button>
          </div>

          <div className="flex-1 pr-1">
            {activeStep === 1 && (
              <div className="grid grid-cols-1 gap-4 p-1">
                {AVAILABLE_TEMPLATES.map(template => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-3">
                       <Badge variant="secondary" className="text-xs">
                         {template.layout === 'double' ? '双栏排版' : '单栏排版'}
                       </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4 p-1 pb-10">
                <div className="space-y-2">
                  <Label htmlFor="title">论文标题 (Title)</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter paper title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="author">作者 (Author)</Label>
                  <Input 
                    id="author" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    placeholder="Author names..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abstract">摘要 (Abstract)</Label>
                  <Textarea 
                    id="abstract" 
                    value={abstract} 
                    onChange={(e) => setAbstract(e.target.value)} 
                    placeholder="Enter abstract..."
                    className="min-h-[100px]"
                  />
                </div>

                <Separator className="my-4" />
                
                {renderBlockEditor()}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-7 flex flex-col bg-muted/30 rounded-lg border p-4 h-[800px] sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" /> 
              实时预览
            </h2>
            {selectedTemplate && (
              <Badge variant="outline">{selectedTemplate.name}</Badge>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden relative bg-white rounded-md shadow-inner flex flex-col">
            {selectedTemplate ? (
              <PdfPreview 
                key={selectedTemplate.id}
                data={{
                  journalName: selectedTemplate.name,
                  title: title,
                  author: author,
                  abstract: abstract,
                  content: contentBlocks,
                  layout: selectedTemplate.layout
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>请先选择一个模板</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
