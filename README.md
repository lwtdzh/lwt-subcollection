## 原始工程
[cmliu/CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB)


## 路由说明

- `/sub`：获取订阅。
  - 不带参数时，会根据 UA 信息自动返回对应格式。
  - 支持通过参数指定格式，例如：
    - `/sub?clash`
    - `/sub?v2ray`
    - ...

- `/admin`：管理员页面。
  - 账户就是 admin，密码是设置的环境变量 ADMIN_PWD

## 名称前缀

在 `/admin` 编辑器中，可在任意一行的**行首**添加 `#前缀#` 标记，为该行节点名称批量添加前缀。

- 单节点行：`#ppp#vless://xxx#香港` → 节点名称变为 `ppp香港`（vless/trojan/ss/vmess 等均支持）。
- 订阅行：`#ppp#https://xxx` → 该订阅内**每个**节点名称都会加上 `ppp` 前缀。

说明：
- 所有节点/订阅链接都以 scheme 开头（如 `vless://`、`http://`），不会以 `#` 开头，因此行首的 `#...#` 不会与节点自身的 `#名称` 片段产生歧义（只消费第一对 `#`）。
- 明文/Base64 订阅直接加前缀；返回 Clash/Sing-box 配置的订阅会先经转换后端转为明文节点再统一加前缀（若转换失败则回退为不加前缀）。

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
| `SUBAPI` | `SUBAPI.cmliussss.net` | ❌ | 订阅转换后端。**未设置时默认使用内置的本地 JS 订阅转换器（支持 Clash / Sing-box / Surge / Quantumult X / Loon 格式，并自动为节点名称添加国旗 emoji，转换在本项目内完成，不再依赖外部后端）**；设置后则改用指定的远程订阅转换后端（可自建 subconverter / psub） |
| `SUBCONFIG` | `https://raw.github.../LWT_Custom_Rule.ini` | ❌ | Clash、Sing-box 等订阅转换配置文件 |
