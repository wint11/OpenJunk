"use client"

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Setup worker with polyfill for older environments if needed
// And ensure it only runs on client
if (typeof window !== 'undefined') {
  // Use a worker that we import as a URL, handled by Next.js/Webpack
  // This is much safer than relying on public path
  // NOTE: This file must exist at src/app/ppt-contest-1/components/pdf.worker.min.mjs
  // We use workerSrc instead of workerPort to avoid complex webpack worker loader config issues
  // But we use the new URL(...) pattern which webpack understands to bundle the file
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).toString();
}

interface PdfPreviewProps {
    url: string;
    controlledPage?: number;
    onPageChange?: (page: number) => void;
}

export default function PdfPreview({ url, controlledPage, onPageChange }: PdfPreviewProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);

    // Sync controlled page
    useEffect(() => {
        if (controlledPage !== undefined) {
            setPageNumber(controlledPage);
        }
    }, [controlledPage]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function changePage(offset: number) {
        // Use a timeout to avoid updating state in render if this is called synchronously (unlikely but safe)
        // But the issue "Cannot update a component (`Stage2Record`) while rendering a different component (`PdfPreview`)"
        // usually happens when a child calls a parent's setState directly in its render phase or useEffect.
        // Here changePage is called by onClick, which is fine.
        // BUT wait, onPageChange is called inside setPageNumber updater function? 
        // No, setState updater is also not render phase.
        
        // However, if we want to be super safe and decoupled:
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            // Defer the parent update to next tick to avoid "update during render" conflicts
            if (onPageChange) {
                setTimeout(() => onPageChange(newPage), 0);
            }
            return newPage;
        });
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    return (
        <div className="w-full h-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden border flex flex-col relative group">
            <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex justify-center max-h-full max-w-full"
                    loading={
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">正在解析 PPT 内容...</p>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center gap-4 text-destructive">
                            <AlertCircle className="h-10 w-10" />
                            <p>无法加载预览，请稍后重试</p>
                        </div>
                    }
                >
                    {numPages > 0 && (
                        <Page 
                            pageNumber={pageNumber} 
                            height={typeof window !== 'undefined' ? window.innerHeight * 0.75 : 600} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                            className="shadow-2xl"
                        />
                    )}
                </Document>

                {/* Navigation Arrows */}
                {numPages > 1 && (
                    <>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            disabled={pageNumber <= 1}
                            onClick={previousPage}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            disabled={pageNumber >= numPages}
                            onClick={nextPage}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}
                
                {/* Page Indicator */}
                {numPages > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur font-medium">
                        第 {pageNumber} 页 / 共 {numPages} 页
                    </div>
                )}
            </div>
        </div>
    );
}
