# 成片精选定稿 / Final Photo Selects

版本：1.0.1

面向已经完成粗筛的候选照片进行第二轮精挑，从几十到一百张左右的候选片中进一步选出最适合最终发布、分享或交付的一组精选照片。重点比较表情、清晰度、姿态、构图、画面完整度、视觉节奏、风格统一性和照片之间的重复度，在保留必要丰富度的同时进一步淘汰相似帧和次优画面。

## 功能

- 对已经粗筛的候选片进行第二轮精挑。
- 比较表情、清晰度、姿态、构图和画面完整度。
- 控制照片之间的重复度，保留必要的丰富度和视觉节奏。
- 根据最终需求完成照片分组、顺序安排、横竖图组合和文件命名。
- 形成约十到三十张左右的精选成片，具体数量以整体质量和使用需求为准。

这是成片精选工具，不是大批量原片的第一轮粗筛。使用前应先完成原片潜力粗筛，或提供一组已经缩小范围的候选照片。

## 使用方式

在支持 Skill 的宿主中使用：

~~~text
Use $moments-photo-selector to refine a screened shortlist into final selects, groups, order, and filenames from this folder: <path>
~~~

本 Skill 自带 PowerShell 辅助脚本。先生成联系表，再根据人工或 Agent 判断准备 mapping CSV：

~~~powershell
& "<skill>/scripts/moments_photo_selector.ps1" -SourcePath "<候选照片文件夹>" -OutputPath "<工作目录>" -MakeContactSheets
& "<skill>/scripts/moments_photo_selector.ps1" -SourcePath "<候选照片文件夹>" -OutputPath "<最终目录>" -MappingCsv "<mapping.csv>" -CopyAndRename -Validate -MakePreview
~~~

mapping CSV 使用 target,source 两列：

~~~csv
target,source
1-1.jpg,DSCF4578.jpg
1-2.jpg,DSCF4624.jpg
1-3.jpg,DSCF4638.jpg
~~~

## 分组与命名规则

- 每个拼图组使用奇数张照片。
- 单个拼图组最多 5 张照片。
- 横图只与横图组合，竖图只与竖图组合。
- 需要 9 个固定成片位且每组使用 3 张时，文件名为 1-1.jpg 至 9-3.jpg。
- 单独出现的照片使用 1.jpg、2.jpg 等名称，不添加 -1。
- 默认只复制或重命名工作副本，不修改原片。

## 目录结构

~~~text
FlyWolf-moments-photo-selector/
├── SKILL.md
├── README.md
├── agents/
│   └── openai.yaml
└── scripts/
    └── moments_photo_selector.ps1
~~~

## 文件说明

- SKILL.md：供 Agent 读取的精选、分组、命名和清理规则。
- README.md：供用户阅读的用途、输入方式、命名规则和使用示例。
- agents/openai.yaml：Skill 的界面名称、简介和默认调用提示。
- scripts/moments_photo_selector.ps1：生成联系表、复制或重命名照片并验证结果的辅助脚本。

## License

MIT
