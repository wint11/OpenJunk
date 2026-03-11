#!/usr/bin/env node

/**
 * 清空 union_dev.db 数据库
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UNION_DB_URL = `file:${path.join(process.cwd(), 'prisma/union_dev.db')}`;

console.log('🗑️  清空 union_dev.db 数据库');
console.log('============================');
console.log(`数据库: ${UNION_DB_URL}`);
console.log('');

// 检查并生成 Union Client
const unionClientPath = path.join(process.cwd(), 'node_modules/.prisma/union-client');
if (!fs.existsSync(unionClientPath)) {
  console.log('📦 生成 Union Client...');
  execSync('npx prisma generate --schema=prisma/schema.union.prisma', { stdio: 'inherit' });
}

// 动态导入 Union Prisma Client
const { PrismaClient: UnionPrismaClient } = await import('../node_modules/.prisma/union-client/index.js');

const unionPrisma = new UnionPrismaClient({
  datasources: { db: { url: UNION_DB_URL } }
});

async function main() {
  try {
    console.log('🔌 连接数据库...');
    await unionPrisma.$connect();
    console.log('✅ 连接成功\n');
    
    // 获取清空前的数据量
    const paperCountBefore = await unionPrisma.paper.count();
    const journalCountBefore = await unionPrisma.journal.count();
    
    console.log('📊 清空前数据量:');
    console.log(`   Paper: ${paperCountBefore} 条`);
    console.log(`   Journal: ${journalCountBefore} 条`);
    console.log('');
    
    // 清空数据
    console.log('🗑️  正在清空...');
    await unionPrisma.paper.deleteMany({});
    console.log('   ✅ Paper 表已清空');
    
    await unionPrisma.journal.deleteMany({});
    console.log('   ✅ Journal 表已清空');
    
    console.log('');
    
    // 确认清空结果
    const paperCountAfter = await unionPrisma.paper.count();
    const journalCountAfter = await unionPrisma.journal.count();
    
    console.log('📊 清空后数据量:');
    console.log(`   Paper: ${paperCountAfter} 条`);
    console.log(`   Journal: ${journalCountAfter} 条`);
    console.log('');
    console.log('✅ 数据库清空完成！');
    
  } catch (error) {
    console.error('\n❌ 清空失败:', error);
    process.exit(1);
  } finally {
    await unionPrisma.$disconnect();
    console.log('\n👋 数据库连接已关闭');
  }
}

main();
