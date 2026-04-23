@echo off
REM EasyTier 健康检查 Windows 批处理示例
REM 演示如何在 Windows 批处理中使用 health-check 工具

setlocal enabledelayedexpansion

echo ========================================
echo EasyTier 节点健康检查
echo 检查时间: %date% %time%
echo ========================================
echo.

REM 健康检查工具路径
set HEALTH_CHECK=target\release\health-check.exe

REM 检查工具是否存在
if not exist "%HEALTH_CHECK%" (
    echo 错误: 未找到 health-check.exe
    echo 请先运行: build.bat
    exit /b 1
)

REM 定义节点配置
set NODE1_NAME=节点1
set NODE1_SERVER=tcp://192.168.1.1:11010
set NODE1_NETWORK=MyNetwork
set NODE1_PASSWORD=MyPassword

set NODE2_NAME=节点2
set NODE2_SERVER=tcp://192.168.1.1:11010
set NODE2_NETWORK=TestNetwork
set NODE2_PASSWORD=TestPassword

REM 统计变量
set TOTAL=0
set ONLINE=0
set OFFLINE=0

REM 检查节点1
echo 检查节点: %NODE1_NAME%
echo   服务器: %NODE1_SERVER%
echo   网络: %NODE1_NETWORK%

%HEALTH_CHECK% -s %NODE1_SERVER% -n %NODE1_NETWORK% -p %NODE1_PASSWORD% > temp_result.txt 2>nul
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 0 (
    set /p RESULT=<temp_result.txt
    for /f "tokens=1,2" %%a in ("!RESULT!") do (
        if "%%a"=="1" (
            echo   状态: √ 在线
            echo   连接数: %%b
            set /a ONLINE+=1
        ) else (
            echo   状态: × 离线
            set /a OFFLINE+=1
        )
    )
) else (
    echo   状态: × 离线
    set /a OFFLINE+=1
)
set /a TOTAL+=1
echo.

REM 检查节点2
echo 检查节点: %NODE2_NAME%
echo   服务器: %NODE2_SERVER%
echo   网络: %NODE2_NETWORK%

%HEALTH_CHECK% -s %NODE2_SERVER% -n %NODE2_NETWORK% -p %NODE2_PASSWORD% > temp_result.txt 2>nul
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 0 (
    set /p RESULT=<temp_result.txt
    for /f "tokens=1,2" %%a in ("!RESULT!") do (
        if "%%a"=="1" (
            echo   状态: √ 在线
            echo   连接数: %%b
            set /a ONLINE+=1
        ) else (
            echo   状态: × 离线
            set /a OFFLINE+=1
        )
    )
) else (
    echo   状态: × 离线
    set /a OFFLINE+=1
)
set /a TOTAL+=1
echo.

REM 清理临时文件
if exist temp_result.txt del temp_result.txt

REM 输出统计
echo ========================================
echo 检查完成
echo 总节点数: %TOTAL%
echo 在线: %ONLINE%
echo 离线: %OFFLINE%
echo ========================================

REM 返回状态码
if %OFFLINE% GTR 0 (
    exit /b 1
) else (
    exit /b 0
)
