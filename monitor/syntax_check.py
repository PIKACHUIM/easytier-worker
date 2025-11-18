#!/usr/bin/env python3
import ast

try:
    with open('NodeChecker.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查语法
    ast.parse(content)
    print("✅ Syntax is OK")
    
except SyntaxError as e:
    print(f"❌ Syntax error on line {e.lineno}:")
    print(f"   {e.text}")
    print(f"   {e.msg}")
    
except Exception as e:
    print(f"❌ Other error: {e}")