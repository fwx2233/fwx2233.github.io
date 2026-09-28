# Wenxuan Fu 的个人博客

站点：<https://fwx2233.github.io/>

这里记录物联网系统漏洞挖掘、LLM/Agent for Security 相关的论文阅读笔记与学习实践。

## 内容目录

- `_posts/`：正式发布的文章。
- `Images/`、`pdfs/`：文章图片和附件。
- `about.md`、`_data/authors.yml`：个人介绍。
- `_config.yml`：站点配置与发布范围。
- `temp/`：留存的未发布笔记；不进入网站构建。
- `docs/`、`forms-by-example.md`：旧主题参考资料；不进入网站构建。

## 本地预览

安装与 `Gemfile.lock` 兼容的 Ruby 和 Bundler 后运行：

```sh
bundle install
bundle exec jekyll serve
```

在浏览器中打开 <http://localhost:4000/>。前端构建工具的升级和环境固定正在分阶段进行，后续提交会补充对应命令。

## 写作与发布

在 `_posts/` 中添加 `YYYY-MM-DD-title.md`，填写 YAML front matter 和正文。图片放在 `Images/`，附件放在 `pdfs/`。

`temp/` 等目录虽不发布到网站，仍会保存在这个公开 GitHub 仓库中；不用于存放私密信息。

## 主题与许可

本站基于 [Hydejack 7.5.2](https://github.com/hydecorp/hydejack) 的本地主题源码定制。
原主题的许可证和第三方声明保留在 `LICENSE.md`、`NOTICE.md` 和 `licenses/` 中；具体适用范围以这些文件及源码声明为准。
