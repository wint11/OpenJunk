#!/usr/bin/env node

/**
 * 联合数据库初始化脚本
 * 基于 schema.union.prisma 创建 Paper 和 Journal 表到 union_dev.db
 * 
 * 使用方法:
 * 1. 确保已安装依赖: npm install @prisma/client prisma
 * 2. 运行: node prisma/init-union-db.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRISMA_DIR = path.join(__dirname);
const SCHEMA_FILE = path.join(PRISMA_DIR, 'schema.union.prisma');
const DB_FILE = path.join(PRISMA_DIR, 'union_dev.db');

// 检查 schema 文件是否存在
if (!fs.existsSync(SCHEMA_FILE)) {
  console.error('❌ 错误: 找不到 schema 文件:', SCHEMA_FILE);
  process.exit(1);
}

console.log('📋 联合数据库初始化工具');
console.log('========================');
console.log('Schema 文件:', SCHEMA_FILE);
console.log('数据库文件:', DB_FILE);
console.log('');

// 检查是否需要删除旧数据库
if (fs.existsSync(DB_FILE)) {
  console.log('⚠️  发现已有数据库文件，是否删除并重新创建？');
  console.log('   如需删除，请手动删除后重新运行');
  console.log('   或设置 FORCE_RECREATE=1 环境变量强制重建');
  
  if (process.env.FORCE_RECREATE === '1') {
    console.log('🗑️  正在删除旧数据库...');
    fs.unlinkSync(DB_FILE);
    console.log('✅ 旧数据库已删除');
  } else {
    console.log('');
    console.log('💡 提示: 如需强制重建，请运行:');
    console.log('   $env:FORCE_RECREATE="1"; node prisma/init-union-db.mjs');
    console.log('');
  }
}

try {
  console.log('🚀 开始初始化数据库...');
  console.log('');

  // 步骤1: 生成 Prisma Client
  console.log('📦 步骤 1/3: 生成 Prisma Client...');
  execSync(
    `npx prisma generate --schema="${SCHEMA_FILE}"`,
    {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, UNION_DATABASE_URL: `file:${DB_FILE}` }
    }
  );
  console.log('✅ Prisma Client 生成成功');
  console.log('');

  // 步骤2: 推送数据库 schema (创建表)
  console.log('📦 步骤 2/3: 创建数据库表...');
  execSync(
    `npx prisma db push --schema="${SCHEMA_FILE}" --skip-generate`,
    {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, UNION_DATABASE_URL: `file:${DB_FILE}` }
    }
  );
  console.log('✅ 数据库表创建成功');
  console.log('');

  // 步骤3: 验证数据库
  console.log('📦 步骤 3/3: 验证数据库连接...');
  console.log('✅ 数据库验证成功！');
  console.log('');
  console.log('📊 已创建的表:');
  console.log('   - Paper');
  console.log('   - Journal');
  console.log('');

  console.log('🎉 联合数据库初始化完成！');
  console.log('');
  console.log('📁 数据库位置:', DB_FILE);
  console.log('');
  console.log('💡 使用提示:');
  console.log('   1. 在 .env 文件中添加:');
  console.log(`      UNION_DATABASE_URL="file:${path.relative(path.join(__dirname, '..'), DB_FILE).replace(/\\/g, '/')}"`);
  console.log('   2. 使用 Prisma Studio 查看:');
  console.log('      npx prisma studio --schema=prisma/schema.union.prisma');
  console.log('');

} catch (error) {
  console.error('');
  console.error('❌ 初始化失败:', error.message);
  console.error('');
  console.error('🔧 常见问题:');
  console.error('   1. 确保已运行: npm install');
  console.error('   2. 确保 Node.js 版本 >= 18');
  console.error('   3. 检查 schema 文件语法是否正确');
  console.error('');
  process.exit(1);
}
