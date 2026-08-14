# 国科大计算机考研站点导航

一个可直接部署到 GitHub Pages 的静态站点。页面会在浏览器中读取并解析 `sites.md`，无需构建步骤。

欢迎通过 [GitHub 仓库](https://github.com/Wzhongkai/cskaoyan-cn) 提交 Issue 或 Pull Request，补充站点、修正介绍或改进页面。

## 维护站点目录

在 `sites.md` 中按下面的格式追加内容：

```md
## 院校简称

[院校完整名称](https://example.cskaoyan.cn/)

这里填写相关介绍。
介绍可以有多行，直到下一个二级标题出现为止。
```

二级标题中的简称显示在卡片左上角，链接文字显示为卡片主标题。页面会自动检测站点的基本连通性并在卡片右上角显示结果。

可在链接和介绍之间添加卡片图片：`![封面](images/example.jpg)` 会将图片作为背景封面；使用 `![海报](images/example.jpg)` 则会完整展示图片，并把访问按钮保留在卡片底部。

## 本地预览

由于页面通过 `fetch` 读取 Markdown，请使用本地 HTTP 服务预览：

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173/`。

## GitHub Pages

将这些文件提交到 GitHub 仓库，在仓库的 Pages 设置中选择从目标分支根目录部署即可。项目不需要安装依赖或运行构建命令。
