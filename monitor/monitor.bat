@echo off
REM EasyTier Monitor 启动脚本 (Windows)

echo ========================================
echo EasyTier 节点监控程序
echo ========================================
echo.

REM 检查参数
if "%~1"=="" (
    echo 错误: 缺少 API_URL 参数
    echo.
    echo 使用方法: start_monitor.bat ^<API_URL^> ^<JWT_TOKEN^> [LOG_LEVEL]
    echo.
    echo 示例: start_monitor.bat https://api.example.com your_jwt_token INFO
    echo.
    pause
    exit /b 1
)

if "%~2"=="" (
    echo 错误: 缺少 JWT_TOKEN 参数
    echo.
    echo 使用方法: start_monitor.bat ^<API_URL^> ^<JWT_TOKEN^> [LOG_LEVEL]
    echo.
    echo 示例: start_monitor.bat https://api.example.com your_jwt_token INFO
    echo.
    pause
    exit /b 1
)

set API_URL=%~1
set JWT_TOKEN=%~2
set LOG_LEVEL=%~3

if "%LOG_LEVEL%"=="" (
    set LOG_LEVEL=INFO
)

echo API地址: %API_URL%
echo 日志级别: %LOG_LEVEL%
echo.
echo 正在启动监控程序...
echo.

REM 启动 Monitor
python Monitor.py %API_URL% %JWT_TOKEN% --log-level %LOG_LEVEL%

if errorlevel 1 (
    echo.
    echo 程序异常退出
    pause
)
