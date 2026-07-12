<p align="center">
  <img src="apps/web/public/logored.png" alt="诗语杭研" width="320" />
</p>

<p align="center">
  面向 <a href="https://hz.xidian.edu.cn/">西安电子科技大学杭州研究院</a> 同学的一站式校园生活指南。
</p>

---

- **生活指南** — 园区办事、周边服务、奖助政策、报修医保与实用技巧，一本说清杭研日常。
- **吃在杭研** — 园区内各家餐厅菜单、价格与分类一览，搜菜名、比价格、快速决定今天吃什么。
- **外卖红黑榜** — 同学真实评价外卖与聚餐：种草好吃的，避雷踩雷的，吃饭再不选择困难。

<p align="center">
  <img src="apps/web/public/PBK_2556.jpg" alt="西电杭研院" width="100%" />
</p>

---

## 谁适合用？

- **在读同学**：办事查指南、午饭查菜单、点外卖先翻红黑榜  
- **新生与准研究生**：快速了解园区生活与服务入口  
- **愿意共建的同学**：补充指南内容、更新菜单、留下真实评价  

> 本项目为同学自发维护的生活向工具，**非学校官方站点**。政策与价格请以官方通知及门店当日为准。

---

## 技术概览

| 层级 | 技术 |
|------|------|
| 前端 | React 19 · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| 后端 | Hono · better-sqlite3 · Zod |
| 部署 | 单进程同时提供 API 与静态前端，SQLite 零额外数据库服务 |

---

## 快速开始

需要 **Node.js ≥ 20** 与 **pnpm**。

```bash
pnpm install
pnpm dev
```

- 前端：http://localhost:5173  
- API 健康检查：http://localhost:3000/api/health  
- 管理后台：http://localhost:5173/admin（默认密码 `admin123`）

生产构建：

```bash
pnpm build
NODE_ENV=production ADMIN_PASSWORD=你的密码 pnpm start
```

服务会在同一端口托管 API 与 `apps/web/dist` 静态资源。

---

## 目录结构

```
shi-yu-hang-yan/
├── apps/web          # 前端 SPA
├── apps/server       # API + 生产静态托管
├── packages/shared   # 前后端共享类型
└── data/             # 数据文件
```

---

## 环境变量

见 `.env.example`：

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 服务端口 | `3000` |
| `ADMIN_PASSWORD` | 管理密码 | `admin123` |
| `DATABASE_PATH` | SQLite 路径 | `apps/server/data/hangyan.db` |

---

## 内容与协作

| 内容 | 位置 |
|------|------|
| 生活指南正文 | `apps/web/public/guide/guide.md` |
| 指南附件（图/PDF 等） | `apps/web/public/guide/Images_attachments/`（**本地维护，不入库**） |
| 园区菜单 | `apps/web/src/data/menus.ts` |
| 红黑榜数据 | SQLite（`DATABASE_PATH`，不入库） |

欢迎补充指南条目、勘误菜单价格、分享真实评价。内容更新请尽量注明时间与来源，便于后人核对。

---

## 使用说明

- **无强制登录**：评价与投票面向校园小范围互助场景设计，投票依赖浏览器标识，非严格账号体系。  
- **内容需人工抽查**：管理员定期在后台处理不当信息；生产环境务必修改默认管理密码。  
- **价格与政策会变**：菜单与指南为整理快照，以实际为准。

---

## 许可证

[MIT](./LICENSE)