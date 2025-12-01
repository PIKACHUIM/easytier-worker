@echo off
REM 构建脚本 - Windows

echo 开始编译 EasyTier 健康检查 CLI 工具...

cd /d "%~dp0"

cargo build --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 编译完成！
    echo 二进制文件位置: target\release\health-check.exe
    echo.
    echo 使用示例:
    echo   target\release\health-check.exe -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword
    echo.
) else (
    echo.
    echo 编译失败！
    exit /b 1
)
