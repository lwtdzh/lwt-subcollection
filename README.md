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

## 行首修饰符

在 `/admin` 编辑器中，可在任意一行的**行首**添加修饰符。行首 `#` 永远表示注释，该行不会出现在最终订阅中。

- 注释行：`# @prefix(ppp) https://xxx` → 整行忽略。
- 单节点行：`@prefix(ppp) vless://xxx#香港` → 节点名称变为 `ppp香港`（vless/trojan/ss/vmess 等均支持）。
- 订阅行：`@prefix(ppp) https://xxx` → 该订阅内**每个**节点名称都会加上 `ppp` 前缀。
- 顺序限制：`@limit(5) https://xxx` → 该订阅只保留前 5 个节点。
- 随机限制：`@rlimit(5) https://xxx` → 该订阅每次随机保留 5 个节点。
- IP 去重：`@rdedupe(ip) https://xxx` → 按节点 `server` 去重，每个 IP 随机保留一个端口。
- 组合使用：`@prefix(ppp) @rdedupe(ip) @limit(5) https://xxx` → 该订阅先按 IP 随机去重，再保留前 5 个节点，并给节点名称加上 `ppp` 前缀。

说明：
- `@prefix(x)`、`@limit(x)`、`@rlimit(x)`、`@rdedupe(ip)` 支持有空格和无空格写法，如 `@prefix(ppp)@rdedupe(ip)https://xxx`。
- 旧的 `@前缀@` 仍可使用；节点自身的 `#名称` 片段会保留。
- `@dedupe(ip)` 保留每个 IP 下的第一个节点；`@rdedupe(ip)` 随机保留。Clash 输出会同步清理 `proxy-groups` 中已删除的节点名。
- `@limit(x)` / `@rlimit(x)` 只对订阅行生效，`x` 为节点数量；多个筛选修饰符按书写顺序依次执行。
- 明文/Base64 订阅会直接应用修饰符；返回 Clash/Sing-box 配置的订阅会先转为明文节点再统一处理（若转换失败则回退为不处理该订阅的修饰符）。

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
