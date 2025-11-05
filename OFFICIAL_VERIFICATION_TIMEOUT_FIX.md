# 官方验证一直等待问题 - 解决方案

**问题**: 
```
运行官方验证时，界面一直显示"等待中"，无法完成验证
```

**最新更新**: 已修复 `service_amperage` 类型转换错误（2025-11-03）

---

## 🐛 已修复的问题

### 问题: ResponseValidationError - service_amperage 类型错误

**错误信息**:
```
fastapi.exceptions.ResponseValidationError: 1 validation errors:
  {'type': 'int_parsing', 'loc': ('response', 'service_amperage'), 
   'msg': 'Input should be a valid integer, unable to parse string as an integer', 
   'input': '119.11'}
```

**原因**:
- 计算引擎返回 `serviceCurrentA` 为字符串 `"119.11"`（带小数）
- 但后端响应 schema 要求 `service_amperage` 必须是整数
- 导致响应验证失败，返回 500 错误

**解决方案**:
- ✅ 已在 `tradespro/backend/app/models/calculation.py` 中添加类型转换
- ✅ `service_amperage` 和 `calculated_load_w` 现在会自动转换为整数（四舍五入）
- ✅ 如果后端服务正在运行，请**重启后端服务**以应用修复

**重启后端**:
```powershell
# 在运行后端的终端按 Ctrl+C 停止
# 然后重新启动
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---
