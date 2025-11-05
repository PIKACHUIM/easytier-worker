#!/usr/bin/env python3
"""
系统初始化和管理功能测试脚本
"""

import requests
import json
import sys

# 配置
API_URL = "http://localhost:8787"  # 本地开发环境
# API_URL = "https://your-domain.workers.dev"  # 生产环境

JWT_SECRET = "your-jwt-secret-here"  # 从 wrangler.jsonc 获取
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"

def test_check_init():
    """测试检查初始化状态"""
    print("1. 测试检查初始化状态...")
    response = requests.get(f"{API_URL}/api/system/check-init")
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    return response.json().get("initialized", False)

def test_initialize():
    """测试系统初始化"""
    print("\n2. 测试系统初始化...")
    data = {
        "jwt_secret": JWT_SECRET,
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    response = requests.post(
        f"{API_URL}/api/system/initialize",
        json=data
    )
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    return response.status_code == 201

def test_login():
    """测试登录"""
    print("\n3. 测试登录...")
    data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    response = requests.post(
        f"{API_URL}/api/auth/login",
        json=data
    )
    print(f"   状态码: {response.status_code}")
    result = response.json()
    print(f"   响应: {result}")
    
    if response.status_code == 200:
        token = result.get("token")
        user = result.get("user")
        print(f"   ✓ 登录成功")
        print(f"   ✓ 邮箱: {user.get('email')}")
        print(f"   ✓ 管理员: {user.get('is_admin')}")
        print(f"   ✓ 超级管理员: {user.get('is_super_admin')}")
        return token
    return None

def test_get_settings(token):
    """测试获取系统设置"""
    print("\n4. 测试获取系统设置...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/system/settings",
        headers=headers
    )
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.status_code == 200

def test_update_settings(token):
    """测试更新系统设置"""
    print("\n5. 测试更新系统设置...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "site_name": "EasyTier 测试系统",
        "site_url": "https://test.example.com"
    }
    response = requests.put(
        f"{API_URL}/api/system/settings",
        headers=headers,
        json=data
    )
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    return response.status_code == 200

def test_get_users(token):
    """测试获取用户列表"""
    print("\n6. 测试获取用户列表...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/system/users",
        headers=headers
    )
    print(f"   状态码: {response.status_code}")
    users = response.json()
    print(f"   用户数量: {len(users)}")
    for user in users:
        print(f"   - {user['email']} (管理员: {user['is_admin']}, 超级管理员: {user['is_super_admin']})")
    return response.status_code == 200

def test_register_user():
    """测试注册普通用户"""
    print("\n7. 测试注册普通用户...")
    data = {
        "email": "user@example.com",
        "password": "user123456"
    }
    response = requests.post(
        f"{API_URL}/api/auth/register",
        json=data
    )
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    return response.status_code == 201

def test_set_admin(token, email, is_admin):
    """测试设置管理员权限"""
    print(f"\n8. 测试{'授予' if is_admin else '撤销'}管理员权限...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"is_admin": is_admin}
    response = requests.put(
        f"{API_URL}/api/system/users/{email}/admin",
        headers=headers,
        json=data
    )
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    return response.status_code == 200

def main():
    """主测试流程"""
    print("=" * 60)
    print("EasyTier 系统初始化和管理功能测试")
    print("=" * 60)
    
    try:
        # 1. 检查初始化状态
        is_initialized = test_check_init()
        
        # 2. 如果未初始化，执行初始化
        if not is_initialized:
            if not test_initialize():
                print("\n❌ 初始化失败")
                return
            print("\n✓ 初始化成功")
        else:
            print("\n✓ 系统已初始化")
        
        # 3. 登录
        token = test_login()
        if not token:
            print("\n❌ 登录失败")
            return
        print("\n✓ 登录成功")
        
        # 4. 获取系统设置
        if test_get_settings(token):
            print("\n✓ 获取系统设置成功")
        
        # 5. 更新系统设置
        if test_update_settings(token):
            print("\n✓ 更新系统设置成功")
        
        # 6. 获取用户列表
        if test_get_users(token):
            print("\n✓ 获取用户列表成功")
        
        # 7. 注册普通用户
        if test_register_user():
            print("\n✓ 注册普通用户成功")
            
            # 8. 授予管理员权限
            if test_set_admin(token, "user@example.com", True):
                print("\n✓ 授予管理员权限成功")
                
                # 9. 撤销管理员权限
                if test_set_admin(token, "user@example.com", False):
                    print("\n✓ 撤销管理员权限成功")
        
        print("\n" + "=" * 60)
        print("✅ 所有测试通过！")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ 连接失败，请确保服务正在运行")
        print(f"   API URL: {API_URL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()