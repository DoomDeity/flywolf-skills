# 原片潜力粗筛 / Raw Photo Cull

版本：1.0.1

面向数百到上千张原片的第一轮筛选，从大批量照片中快速保留一批值得继续精修和二次挑选的候选片。重点判断表情、眼神、动作、肢体状态、情绪氛围、瞬间感和场景多样性等后期难以修复的核心质量，同时保留构图、裁切、色彩、光线和背景等方面的后期调整空间。

## 功能

- 从大批量人像或摄影原片中建立精修候选集。
- 优先判断表情、眼神、动作、肢体、情绪和瞬间感。
- 对不同场景、角度、造型和情绪保留代表性照片。
- 不会仅因为可后期调整的问题轻易淘汰照片。
- 淘汰明显弱表情、僵硬肢体、严重技术失败和更弱的重复帧。

这是第一轮潜力筛选，不是最终发布或交付定稿。筛选结果通常为几十到一百张左右，具体数量根据素材质量和场景丰富度灵活调整。

## 使用方式

在支持 Skill 的宿主中使用：

~~~text
Use $raw-photo-cull to perform a first-pass potential cull and keep promising photos for retouching from this folder: <path>
~~~

本 Skill 自带脚本，可用于生成带文件名的联系表、整理清单和复制候选片：

~~~powershell
python scripts/raw_photo_cull.py --source "<原片文件夹>" --output "<工作目录>" --contact-sheets
python scripts/raw_photo_cull.py --source "<原片文件夹>" --output "<工作目录>" --selection "<selection.csv>" --copy-selected --preview
~~~

脚本依赖 Python 3 和 Pillow。脚本工作目录中的联系表、预览图和临时缩略图应在最终检查完成后清理；原片和最终候选片保留。

## 目录结构

~~~text
FlyWolf-raw-photo-cull/
├── SKILL.md
├── README.md
├── agents/
│   └── openai.yaml
└── scripts/
    └── raw_photo_cull.py
~~~

## 文件说明

- SKILL.md：供 Agent 读取的完整筛选逻辑、覆盖规则和清理要求。
- README.md：供用户阅读的用途、判断重点和使用方式。
- agents/openai.yaml：Skill 的界面名称、简介和默认调用提示。
- scripts/raw_photo_cull.py：生成原片清单、联系表和候选片副本的辅助脚本。

## License

MIT
