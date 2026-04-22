@echo off
REM EasyTier 节点管理系统 - 快速启动脚本 (Windows)

echo ==================================
echo EasyTier 节点管理系统 - 快速启动
echo ==================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 Node.js
    echo 请访问 https://nodejs.org/ 安装 Node.js 18+
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

REM 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 npm
    exit /b 1
)

echo ✅ npm 已安装
npm --version
echo.

REM 安装依赖
echo 📦 安装依赖...
call npm install

echo.
echo ✅ 依赖安装完成
echo.

echo ==================================
echo 下一步操作：
echo ==================================
echo.
echo 1. 登录 Cloudflare:
echo    npx wrangler login
echo.
echo 2. 创建 D1 数据库:
echo    npx wrangler d1 create easytier-db
echo.
echo 3. 更新 wrangler.jsonc 中的 database_id
echo.
echo 4. 配置环境变量（wrangler.jsonc）:
echo    - JWT_SECRET: 生成强密钥
echo    - ADMIN_EMAIL: 管理员邮箱
echo    - RESEND_API_KEY: Resend API 密钥
echo.
echo 5. 初始化数据库:
echo    npx wrangler d1 execute easytier-db --file=./schema.sql
echo.
echo 6. 本地开发:
echo    npm run dev
echo.
echo 7. 部署到生产环境:
echo    npm run deploy
echo.
echo ==================================
echo 详细文档请查看:
echo   - README.md: 项目文档
echo   - API.md: API 文档
echo   - DEPLOY.md: 部署指南
echo   - PROJECT_SUMMARY.md: 项目总结
echo ==================================
echo.
echo ✨ 准备完成！按照上述步骤继续操作。
echo.
pause
