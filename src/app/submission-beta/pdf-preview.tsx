'use client';

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { PaperDocument, PaperData } from './pdf-document';

interface PdfPreviewProps {
  data: PaperData;
  DocumentComponent?: React.FC<{ data: PaperData }>;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ data, DocumentComponent }) => {
  const DocumentToRender = DocumentComponent || PaperDocument;
  
  return (
    <div className="w-full h-full border rounded-lg shadow-sm overflow-hidden bg-white">
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <DocumentToRender data={data} />
      </PDFViewer>
    </div>
  );
};
