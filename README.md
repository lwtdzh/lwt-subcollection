## 原始工程
[cmliu/](https://github.com/cmliu/CF-Workers-SUB)


## 路由说明

- `/sub`：获取订阅。
  - 不带参数时，会根据 UA 信息自动返回对应格式。
  - 支持通过参数指定格式，例如：
    - `/sub?clash`
    - `/sub?v2ray`
    - ...

- `/admin`：管理员页面。

## KV 桶
KV 桶名字为：KV，大写。

## 环境变量

| 变量名 | 示例值 | 是否必填 | 说明 |
|---|---|---:|---|
| `ADMIN_PWD` | `your-password` | ✅ | `/admin` 管理页面密码 |
| `LINK` | `vless://b7a39...`<br>`vmess://ew0K...`<br>`https://sub...` | ❌ | 可同时放入多个节点链接与多个订阅链接，链接之间用换行分隔。添加 KV 命名空间后，该变量将不会使用 |
| `TGTOKEN` | `6894123456:XXXXXXXXXX0qExVsBPUhHDAbXXXXXqWXgBA` | ❌ | 发送 Telegram 通知的机器人 Token |
| `TGID` | `6946912345` | ❌ | 接收 Telegram 通知的账户数字 ID |
| `SUBNAME` | `CF-Workers-SUB` | ❌ | 订阅名称 |
| `SUBAPI` | `SUBAPI.cmliussss.net` | ❌ | Clash、Sing-box 等订阅转换后端 |
| `SUBCONFIG` | `https://raw.github.../LWT_Custom_Rule.ini` | ❌ | Clash、Sing-box 等订阅转换配置文件 |
