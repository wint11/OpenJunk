#!/usr/bin/env node

/**
 * Union API Server - 简化版
 * 只提供 GET 接口查询数据
 * 端口: 8848
 * 
 * 启动方式: node union-api/server.js
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('../node_modules/.prisma/union-client');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8848;

// 初始化 Prisma Client - 使用 union schema
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, '../prisma/union_dev.db')}`
    }
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// ==================== Paper 接口 ====================

/**
 * GET /papers
 * 获取所有论文，支持筛选
 */
app.get('/papers', async (req, res) => {
  try {
    const { status, category, journalName, dataSource, search, limit = 100 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (journalName) where.journalName = { contains: journalName };
    if (dataSource) where.dataSource = dataSource;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { abstract: { contains: search } },
        { authors: { contains: search } }
      ];
    }

    const papers = await prisma.paper.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: papers.length,
      data: papers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /papers/:id
 * 获取单篇论文
 */
app.get('/papers/:id', async (req, res) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: req.params.id }
    });

    if (!paper) {
      return res.status(404).json({ success: false, error: '论文不存在' });
    }

    res.json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Journal 接口 ====================

/**
 * GET /journals
 * 获取所有期刊，支持筛选
 */
app.get('/journals', async (req, res) => {
  try {
    const { name, dataSource, search, limit = 100 } = req.query;

    const where = {};
    if (name) where.name = { contains: name };
    if (dataSource) where.dataSource = dataSource;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const journals = await prisma.journal.findMany({
      where,
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      count: journals.length,
      data: journals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /journals/:id
 * 获取单个期刊
 */
app.get('/journals/:id', async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: req.params.id }
    });

    if (!journal) {
      return res.status(404).json({ success: false, error: '期刊不存在' });
    }

    res.json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 启动 ====================

app.listen(PORT, () => {
  console.log(`Union API 已启动: http://localhost:${PORT}`);
  console.log('接口:');
  console.log('  GET /papers       - 获取论文列表');
  console.log('  GET /papers/:id   - 获取单篇论文');
  console.log('  GET /journals     - 获取期刊列表');
  console.log('  GET /journals/:id - 获取单个期刊');
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
