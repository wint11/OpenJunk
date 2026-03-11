#!/usr/bin/env node

/**
 * 数据迁移脚本: dev.db -> union_dev.db
 * 迁移 Novel(PUBLISHED) -> Paper, Journal -> Journal
 * 
 * 使用方法:
 * 1. 先确保两个 schema 都已生成: 
 *    npx prisma generate --schema=prisma/schema.prisma
 *    npx prisma generate --schema=prisma/schema.union.prisma
 * 2. 运行迁移: node scripts/migrate-to-union.mjs
 * 3. 强制清空后迁移: CLEAR_TARGET=1 node scripts/migrate-to-union.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const DEV_DB_URL = `file:${path.join(process.cwd(), 'prisma/dev.db')}`;
const UNION_DB_URL = `file:${path.join(process.cwd(), 'prisma/union_dev.db')}`;

console.log('🚀 数据迁移工具');
console.log('================');
console.log(`源数据库: ${DEV_DB_URL}`);
console.log(`目标数据库: ${UNION_DB_URL}`);
console.log('');

// 检查并生成 Clients
console.log('📦 检查 Prisma Clients...');

// 生成 dev client
const devClientPath = path.join(process.cwd(), 'node_modules/@prisma/client');
if (!fs.existsSync(devClientPath)) {
  console.log('   生成 Dev Client...');
  execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' });
}

// 生成 union client
const unionClientPath = path.join(process.cwd(), 'node_modules/.prisma/union-client');
if (!fs.existsSync(unionClientPath)) {
  console.log('   生成 Union Client...');
  execSync('npx prisma generate --schema=prisma/schema.union.prisma', { stdio: 'inherit' });
}

console.log('✅ Clients 准备完成\n');

// 动态导入 Prisma Clients
const { PrismaClient: DevPrismaClient } = await import('@prisma/client');
const { PrismaClient: UnionPrismaClient } = await import('../node_modules/.prisma/union-client/index.js');

// 创建客户端 - 明确指定各自的数据库
const devPrisma = new DevPrismaClient({
  datasources: { db: { url: DEV_DB_URL } }
});

const unionPrisma = new UnionPrismaClient({
  datasources: { db: { url: UNION_DB_URL } }
});

// ==================== 辅助函数 ====================

// 转换作者格式: author + extraAuthors -> JSON
function convertAuthors(author, extraAuthors) {
  const authors = [];
  
  if (author) {
    authors.push({ name: author, unit: '' });
  }
  
  if (extraAuthors) {
    try {
      const extra = JSON.parse(extraAuthors);
      if (Array.isArray(extra)) {
        extra.forEach(a => {
          if (typeof a === 'string') {
            authors.push({ name: a, unit: '' });
          } else if (a && typeof a === 'object') {
            authors.push({
              name: a.name || '',
              unit: a.unit || ''
            });
          }
        });
      }
    } catch (e) {
      const names = extraAuthors.split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
      names.forEach(name => authors.push({ name, unit: '' }));
    }
  }
  
  return JSON.stringify(authors.length > 0 ? authors : [{ name: '未知作者', unit: '' }]);
}

// 转换状态
function convertStatus(novelStatus) {
  const statusMap = {
    'PUBLISHED': 'PUBLISHED',
    'PENDING': 'RECEIVED_PENDING_REVIEWER',
    'REJECTED': 'REJECTED_AFTER_REVIEW',
    'PENDING_DELETION': 'RETRACTED',
    'TAKEDOWN': 'RETRACTED'
  };
  return statusMap[novelStatus] || 'PUBLISHED';
}

// 生成 NOI
let noiCounter = 1;
function generateNOI() {
  const year = new Date().getFullYear();
  const seq = String(noiCounter++).padStart(5, '0');
  return `NOI-${year}-${seq}`;
}

// 转换类型
function convertType(novelType) {
  const typeMap = {
    'NOVEL': 'PAPER',
    'PAPER': 'PAPER',
    'AUTOBIOGRAPHY': 'PAPER',
    'ARTICLE': 'COMMENT'
  };
  return typeMap[novelType] || 'PAPER';
}

// ==================== 迁移函数 ====================

// 迁移 Journal
async function migrateJournals() {
  console.log('📰 开始迁移 Journal 数据...');
  
  // 直接查询，不使用关联（避免关系问题）
  // dev.db 中的 Journal 字段: id, name, description, guidelines, guidelinesUrl, coverUrl, customConfig, status, createdAt, updatedAt, combatPower
  const journals = await devPrisma.$queryRaw`SELECT * FROM Journal`;
  
  console.log(`   找到 ${journals.length} 条期刊记录`);
  
  let success = 0;
  let failed = 0;
  
  for (const journal of journals) {
    try {
      // 从 User 表查询该期刊的管理员和审稿人
      const admins = await devPrisma.$queryRaw`
        SELECT name, email FROM User WHERE managedJournalId = ${journal.id}
      `;
      
      const reviewers = await devPrisma.$queryRaw`
        SELECT u.name FROM User u
        JOIN _JournalReviewers jr ON u.id = jr.B
        WHERE jr.A = ${journal.id}
      `;
      
      const editorInChief = admins && admins.length > 0 
        ? JSON.stringify(admins.map(a => ({ 
            name: a.name || '未知', 
            unit: '', 
            email: a.email || '' 
          })))
        : null;
        
      const associateEditors = reviewers && reviewers.length > 0
        ? JSON.stringify(reviewers.map(r => ({ 
            name: r.name || '未知', 
            unit: '' 
          })))
        : null;
      
      await unionPrisma.journal.create({
        data: {
          id: journal.id,
          name: journal.name,
          description: journal.description || null,
          coverUrl: journal.coverUrl || null,
          templateUrl: journal.guidelinesUrl || null,
          homepage: null,
          contact: null,
          nssn: null,
          editorInChief,
          associateEditors,
          editorialBoard: null,
          createdAt: journal.createdAt,
          updatedAt: journal.updatedAt
        }
      });
      success++;
    } catch (e) {
      console.error(`   ❌ 期刊 "${journal.name}" 迁移失败:`, e.message);
      failed++;
    }
  }
  
  console.log(`   ✅ 成功: ${success}, ❌ 失败: ${failed}`);
  return { success, failed };
}

// 迁移 Novel -> Paper
async function migratePapers() {
  console.log('\n📄 开始迁移 Novel -> Paper 数据...');
  
  // 使用原始 SQL 查询 Novel 表，避免关联问题
  const novels = await devPrisma.$queryRaw`
    SELECT * FROM Novel WHERE status = 'PUBLISHED'
  `;
  
  console.log(`   找到 ${novels.length} 条已发布论文记录`);
  
  let success = 0;
  let failed = 0;
  
  for (const novel of novels) {
    try {
      // 查询期刊名称
      let journalName = null;
      try {
        if (novel.journalId) {
          const journalResult = await devPrisma.$queryRaw`
            SELECT name FROM Journal WHERE id = ${novel.journalId}
          `;
          journalName = journalResult[0]?.name || null;
        }
      } catch (e) {
        // 忽略期刊查询错误
      }
      
      // 查询基金信息 - 中间表名: _FundApplicationToNovel
      // A = Novel.id, B = FundApplication.id (按模型名字母顺序)
      let fundInfo = {};
      try {
        const fundApps = await devPrisma.$queryRaw`
          SELECT f.id as fundId, f.title as fundName, fc.code as categoryCode, fc.name as categoryName
          FROM _FundApplicationToNovel fan
          JOIN FundApplication fa ON fan.B = fa.id
          JOIN Fund f ON fa.fundId = f.id
          LEFT JOIN FundCategory fc ON f.categoryId = fc.id
          WHERE fan.A = ${novel.id}
          LIMIT 1
        `;
        fundInfo = fundApps[0] || {};
      } catch (e) {
        console.error(`   ⚠️  论文 "${novel.title?.substring(0, 30)}..." 基金查询失败: ${e.message}`);
        fundInfo = {};
      }
      
      await unionPrisma.paper.create({
        data: {
          id: novel.id,
          title: novel.title || '无标题',
          authors: convertAuthors(novel.author, novel.extraAuthors),
          abstract: novel.description || null,
          coverUrl: novel.coverUrl || null,
          pdfUrl: novel.pdfUrl || null,
          pdfHash: novel.pdfHash || null,
          status: convertStatus(novel.status),
          category: novel.category || null,
          type: convertType(novel.type),
          submitTime: novel.createdAt,
          views: novel.views || 0,
          downloads: 0,
          cite: 0,
          journalName: journalName,
          vol: null,
          no: null,
          fundCategoryId: fundInfo.categoryCode || null,
          fundCategoryName: fundInfo.categoryName || null,
          fundDepartmentId: null,
          fundDepartmentName: null,
          fundProjectId: fundInfo.fundId || null,
          fundProjectName: fundInfo.fundName || null,
          fundApprovalNumber: null,
          aiObjectivity: novel.aiObjectivity || null,
          aiProfessionalism: novel.aiProfessionalism || null,
          aiReproducibility: novel.aiReproducibility || null,
          aiRigor: novel.aiRigor || null,
          aiStandardization: novel.aiStandardization || null,
          aoiScore: novel.aoiScore || null,
          noi: generateNOI(),
          createdAt: novel.createdAt,
          updatedAt: novel.updatedAt
        }
      });
      success++;
    } catch (e) {
      console.error(`   ❌ 论文 "${novel.title?.substring(0, 30)}..." 迁移失败:`, e.message);
      failed++;
    }
  }
  
  console.log(`   ✅ 成功: ${success}, ❌ 失败: ${failed}`);
  return { success, failed };
}

// ==================== 主函数 ====================

async function main() {
  try {
    console.log('🔌 连接数据库...');
    await devPrisma.$connect();
    await unionPrisma.$connect();
    console.log('✅ 数据库连接成功\n');
    
    const shouldClear = process.env.CLEAR_TARGET === '1';
    if (shouldClear) {
      console.log('🗑️  清空目标数据库...');
      await unionPrisma.paper.deleteMany({});
      await unionPrisma.journal.deleteMany({});
      console.log('✅ 已清空\n');
    }
    
    const journalResult = await migrateJournals();
    const paperResult = await migratePapers();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 迁移完成报告');
    console.log('='.repeat(50));
    console.log('\n📰 Journal 表:');
    console.log(`   成功: ${journalResult.success}`);
    console.log(`   失败: ${journalResult.failed}`);
    console.log('\n📄 Paper 表:');
    console.log(`   成功: ${paperResult.success}`);
    console.log(`   失败: ${paperResult.failed}`);
    
    const journalCount = await unionPrisma.journal.count();
    const paperCount = await unionPrisma.paper.count();
    console.log('\n📋 目标数据库最终数据:');
    console.log(`   Journal: ${journalCount} 条`);
    console.log(`   Paper: ${paperCount} 条`);
    
  } catch (error) {
    console.error('\n❌ 迁移过程出错:', error);
    process.exit(1);
  } finally {
    await devPrisma.$disconnect();
    await unionPrisma.$disconnect();
    console.log('\n👋 数据库连接已关闭');
  }
}

main();
