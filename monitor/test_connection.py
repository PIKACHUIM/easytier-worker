#!/usr/bin/env python3
import asyncio
import socket

async def test_connection():
    try:
        print("正在连接到 127.0.0.1:15888...")
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection('127.0.0.1', 15888),
            timeout=5
        )
        print("✅ 连接成功!")
        
        # 发送测试数据
        test_data = b'{"method": "get_info"}'
        writer.write(test_data)
        await writer.drain()
        print("📤 已发送测试数据")
        
        # 读取响应
        response = await asyncio.wait_for(
            reader.read(1024),
            timeout=5
        )
        print(f"📥 收到响应: {response}")
        print(f"📥 响应文本: {response.decode('utf-8', errors='ignore')}")
        
        writer.close()
        await writer.wait_closed()
        
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())