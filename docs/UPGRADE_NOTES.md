# 2026-09-29 博客维护与依赖升级记录

本轮处理首页和中文文案、发布范围、作者介绍，以及网站实际使用的构建和运行依赖。
主题模板仍为本地定制的 Hydejack 7.5.2；这里的依赖版本与主题模板版本分别管理。

## 内容与发布范围

- 首页、归档页的描述已替换为博客自己的内容，导航、日期、加载和错误提示改为中文。
- `lang` 使用 `zh-CN`，生成的 HTML 保留完整语言标记。
- `temp/`、`docs/`、表单示例、README、主题更新日志及开发配置不再进入网站构建。
- 这些资料仍保存在公开 GitHub 仓库中；排除发布不等于私密存储。
- 作者介绍更新为南开大学信息安全本科（2019—2023）、博士在读，研究兴趣为物联网系统漏洞挖掘和 LLM/Agent for Security。
- 保留已有 39 篇文章的网址和两个标签页的网址。

## 当前版本

| 组件 | 原版本 | 本轮版本 |
| --- | --- | --- |
| Ruby | 未固定 | 4.0.7 |
| Bundler | 1.16.1 | 4.0.21 |
| Jekyll | 3.8.3 | 4.4.1 |
| Sass 编译器 | Ruby Sass 3.5.6 | sass-embedded 1.105.0 |
| Node.js | 未固定 | 24.21.0（LTS） |
| Webpack | 3.12.0 | 5.111.1 |
| Babel | 6.26.3 | 8.0.6 |
| ESLint | 4.19.1 | 10.11.0 |
| Core-js | 2.5.7 | 3.50.0 |
| RxJS（项目直接依赖） | 6.2.1 | 7.8.2 |
| color | 3.0.0 | 5.0.3 |
| elem-dataset | 1.1.1 | 2.0.0 |
| hy-drawer / hy-push-state | 1.0.0-pre.21 | 1.0.0-uvw.0 |
| web-animations-js | 2.3.1 | 2.3.2 |
| KaTeX | 0.8.3 | 0.18.9 |
| Web Font Loader | 1.6.28 | 1.6.28（仍为 latest） |
| html5shiv | 3.7.3 | 3.7.3（仍为 latest） |

`hy-drawer` 和 `hy-push-state` 的 npm `latest` 仍带预发布版本号。本轮锁定精确版本，并适配其 `transitionUntil` 接口，通过桌面和手机视口的浏览器检查。

KaTeX、Web Font Loader 和 html5shiv 由 `.scripts/sync-vendor.js` 从 `node_modules` 同步，保留 `assets/bower_components/` 下的旧资源网址。已经移除 Bower 清单和不用于运行的第三方源码，保留许可证。

## 停止升级的边界

最后一次 `npm update` 将 `rxjs-create-tween` 提升到依赖树根部后，暴露了它对 `rxjs/_esm5` 内部路径的引用，干净安装后构建失败。Webpack 现在把这个精确路径映射到 RxJS 的公开入口；该库仅使用公开的 Observable API，更新后的构建及菜单动画检查通过。

直接 npm 依赖已升级至本轮检查时各包的 `latest`。`npm update` 进一步更新了约束允许的间接依赖；`bundle outdated --strict` 显示当前约束内没有可更新的 Gem。

以下主要间接依赖已有更高主版本，但上游明确不接受，故保留在兼容版本：

| 依赖 | 当前版本 | 已知更高版本 | 上游限制 |
| --- | --- | --- | --- |
| json | 2.21.2 | 3.0.2 | Jekyll 要求 `~> 2.6` |
| liquid | 4.0.4 | 5.14.0 | Jekyll 要求 `~> 4.0` |
| rouge | 4.7.0 | 5.1.0 | Jekyll 要求 `< 5.0` |
| terminal-table | 3.0.2 | 4.0.0 | Jekyll 要求 `< 4.0` |
| unicode-display_width | 2.6.0 | 3.3.0 | terminal-table 要求 `< 3` |
| RxJS（hy-* 内部依赖） | 6.6.7 | 7.8.2 | hy-* 组件要求 `^6.5.5` |
| jQuery（hy-* 内部依赖） | 3.7.1 | 4.0.0 | hy-* 组件要求 `^3.3.1` |

ESLint、Webpack 等工具的间接依赖也遵守各自上游范围。未使用 `--force`、`--legacy-peer-deps` 或跨主版本 overrides 绕过限制。后续升级应先等待上游放宽范围，或单独迁移对应组件。

旧主题 Sass 中的 `@import`、颜色函数和部分运算仍产生弃用警告，当前最新 Sass 可以编译。后续 Sass 移除这些接口前，需要单独迁移主题样式的模块结构。前端包含不同主版本的 RxJS，Webpack 会提示未压缩传输前的单个 bundle 超出默认体积建议；没有因此关闭体积提示。

## 验证方式

```sh
npm ci
npm run lint
npm run build
JEKYLL_ENV=production bundle exec jekyll build
npm run check:site
npx playwright install --no-shell chromium
npm test
npm audit
npm outdated
bundle outdated --strict
```

- 生产构建和站点检查覆盖 39 个历史文章网址、图片等本地资源、分页、标签页、作者资料、feed、sitemap 和发布排除规则。
- Playwright 使用 Chromium 的桌面和手机视口，验证文章动态跳转、浏览器后退、手机菜单、作者页、标签列表和分页。
- 当前文章没有 TeX 公式。测试仅在浏览器内拦截响应、插入公式样例，验证真实 KaTeX 加载和渲染，不发布测试页面。
- 最终检查时 `npm audit` 报告 0 个已知漏洞；这不代表所有代码都没有漏洞。
- 本轮没有逐篇修订论文内容，也没有改动此前审查中的 MQTT、Frida、Tamarin 笔记或失效链接。

## 提交阶段

每一阶段均单独提交并推送至 `origin/main`：

1. `6a747ab`：首页与中文文案。
2. `f578977`：排除草稿、主题文档和示例，更新 README。
3. `6f8a8ce`：个人介绍。
4. `9bbfb9d`：Ruby / Jekyll 升级、站点检查和 Actions 部署。
5. `03198d3`：Webpack / Babel / ESLint 升级及浏览器检查。
6. `8837e4c`：运行库升级和页面跳转接口适配。
7. `0abb288`：取消自动修改仓库 Pages 设置，避免自动令牌权限不足阻断部署。
8. `e4719a0`：KaTeX 和第三方资源同步。

9. 本提交：进一步更新间接依赖、适配动画库导入路径、验证干净安装，并补充本记录。

完整提交记录以 `git log` 为准。

## 部署与后续维护

GitHub Pages 的 Source 使用 GitHub Actions。`.github/workflows/pages.yml` 固定 Ruby 和 Node.js，执行构建、站点及浏览器检查，成功后再发布 `_site`。

更新依赖时先在本地完成检查，再将锁文件和生成资源一起提交。不要仅修改版本号而跳过构建和浏览器验证。
