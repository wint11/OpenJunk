"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
// Using local font file for reliable Chinese support (LXGW WenKai)
Font.register({
  family: 'LXGW WenKai',
  fonts: [
    { src: '/fonts/LXGWWenKai-Regular.ttf' },
    // We can use the same font for bold/italic if we don't have separate files,
    // or let react-pdf simulate it (though simulation is often poor for CJK).
    // For now, map all to the Regular font to avoid crashes.
    { src: '/fonts/LXGWWenKai-Regular.ttf', fontStyle: 'italic' },
    { src: '/fonts/LXGWWenKai-Regular.ttf', fontWeight: 'bold' },
    { src: '/fonts/LXGWWenKai-Regular.ttf', fontStyle: 'italic', fontWeight: 'bold' },
  ]
});

// Styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'LXGW WenKai',
    fontSize: 10.5,
    lineHeight: 1.6,
    color: '#333',
  },
  // Header
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  journalName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 9,
    color: '#666',
  },
  // Title & Author
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#000',
  },
  author: {
    fontSize: 11,
    textAlign: 'center',
    color: '#444',
    marginBottom: 4,
  },
  affiliation: {
    fontSize: 9,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  // Abstract
  abstractContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingVertical: 15,
    backgroundColor: '#fafafa',
  },
  abstractTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  abstractText: {
    fontSize: 9.5,
    lineHeight: 1.5,
    textAlign: 'justify',
    color: '#555',
  },
  // Body
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#000',
    borderLeftWidth: 3,
    borderLeftColor: '#000',
    paddingLeft: 8,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
    textIndent: 20, // Chinese paragraph indentation
  },
  // Double Column
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  // Images
  imageContainer: {
    marginVertical: 10,
    alignItems: 'center',
    padding: 5,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 300,
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: 8.5,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});

export type ContentBlock = 
  | { type: 'text'; value: string }
  | { type: 'image'; src: string; caption?: string };

export interface PaperData {
  journalName: string;
  title: string;
  author: string;
  abstract: string;
  content: ContentBlock[];
  layout: 'single' | 'double';
}

interface PaperDocumentProps {
  data: PaperData;
}

export const PaperDocument: React.FC<PaperDocumentProps> = ({ data }) => {
  const isDoubleColumn = data.layout === 'double';

  // Helper to check if a block is a "Section Title" (simple heuristic: short and no punctuation at end?)
  // For now, we just render everything as paragraphs or images.
  
  const renderBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'text') {
      // Simple heuristic for section titles: if it's short (< 20 chars) and has no newline?
      // Or we can rely on user input. For now, just render as paragraph.
      // If the text starts with specific patterns like "1. ", "Abstract", etc., we could style it.
      // Let's check for newlines. If it's a single line and short, treat as heading.
      const isHeading = block.value.length < 30 && !block.value.includes('\n');
      
      return (
        <View key={index}>
          {isHeading ? (
            <Text style={styles.sectionTitle}>{block.value}</Text>
          ) : (
            <Text style={styles.paragraph}>{block.value}</Text>
          )}
        </View>
      );
    } else if (block.type === 'image') {
      return (
        <View key={index} style={styles.imageContainer} wrap={false}>
          <Image src={block.src} style={styles.image} />
          {block.caption && (
            <Text style={styles.imageCaption}>{block.caption}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (isDoubleColumn) {
      // Split content into two columns (approximate balance)
      // This is a naive split: first half to left, second half to right.
      // In a real PDF generator, text would flow. React-PDF doesn't support flow across columns.
      // This simulates a "Two Column" layout where the user defines the order.
      // Reading order: Left Column (Top->Bottom) -> Right Column (Top->Bottom).
      const midPoint = Math.ceil(data.content.length / 2);
      const leftBlocks = data.content.slice(0, midPoint);
      const rightBlocks = data.content.slice(midPoint);

      return (
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            {leftBlocks.map((block, i) => renderBlock(block, i))}
          </View>
          <View style={styles.column}>
            {rightBlocks.map((block, i) => renderBlock(block, i + midPoint))}
          </View>
        </View>
      );
    } else {
      return (
        <View>
          {data.content.map((block, i) => renderBlock(block, i))}
        </View>
      );
    }
  };

  return (
    <Document 
      title={data.title}
      author={data.author}
      subject={data.journalName}
      creator="SmartReview Beta"
      producer="SmartReview Beta"
      keywords={`${data.journalName}, ${data.author}, Research Paper`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer} fixed>
          <Text style={styles.journalName}>{data.journalName || 'SMART REVIEW JOURNAL'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Title & Author (Always Single Column) */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{data.title || 'Untitled Paper'}</Text>
          <Text style={styles.author}>{data.author || 'Unknown Author'}</Text>
          <Text style={styles.affiliation}>Department of Research, Smart Review Institute</Text>
        </View>

        {/* Abstract (Always Single Column, styled distinctly) */}
        <View style={styles.abstractContainer}>
          <Text style={styles.abstractTitle}>ABSTRACT</Text>
          <Text style={styles.abstractText}>
            {data.abstract || 'No abstract provided.'}
          </Text>
        </View>

        {/* Main Content */}
        {renderContent()}

        {/* Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}  |  Generated by SmartReview`
        )} fixed />
      </Page>
    </Document>
  );
};
