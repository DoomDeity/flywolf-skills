# 成片精选定稿

版本：2.0

## 中文介绍

面向已经完成粗筛的候选照片进行第二轮精挑，从几十到一百张左右的候选片中进一步选出最适合最终发布、分享或交付的一组精选照片。重点比较表情、清晰度、姿态、构图、画面完整度、视觉节奏、风格统一性和照片之间的重复度，在保留必要丰富度的同时进一步淘汰相似帧和次优画面。对于朋友圈等发布场景，还可以继续完成照片分组、顺序安排、横竖图组合和文件命名，最终形成约十到三十张左右的精选成片。具体数量不锁死，以最终整体质量和发布需求为准。

## 用途

这是第二轮成片精选工具，不是数百到上千张原片的第一轮粗筛。输入应当是已经完成初筛的候选照片，或一组数量已经明显缩小的照片。

工具重点比较：

- 表情、眼神、清晰度和动作完成度；
- 姿态、肢体状态和画面完整度；
- 构图、视觉节奏和风格统一性；
- 相似帧的重复度与整组照片的丰富度；
- 是否适合最终发布、分享或交付场景。

## 分组与命名规则

- 每个拼图组必须使用奇数张照片。
- 每个拼图组最多 5 张照片。
- 横图只与横图组合，竖图只与竖图组合。
- 需要 9 个成片位且每组 3 张时，输出 `1-1.jpg` 至 `9-3.jpg`，共 27 张。
- 单独出现的照片使用 `1.jpg`、`2.jpg` 等名称，不添加 `-1`。
- 默认只复制或重命名工作副本，不修改源照片。

## 运行环境

标准版使用 Python 3 和 Pillow，支持 Windows 与 macOS。首次使用时，如环境尚未安装依赖，可执行：

```bash
python -m pip install -r requirements.txt
```

macOS 也可以执行：

```bash
python3 -m pip install -r requirements.txt
```

## 使用方式

### 生成清单和联系表

```bash
python scripts/moments_photo_selector.py --source "<候选照片文件夹>" --output "<工作目录>" --contact-sheets
```

macOS：

```bash
python3 scripts/moments_photo_selector.py --source "<候选照片文件夹>" --output "<工作目录>" --contact-sheets
```

检查联系表后，准备两列 mapping CSV：

```csv
target,source
1-1.jpg,DSCF4578.jpg
1-2.jpg,DSCF4624.jpg
1-3.jpg,DSCF4638.jpg
```

### 复制并重命名工作副本

```bash
python scripts/moments_photo_selector.py --source "<候选照片文件夹>" --output "<最终目录>" --mapping "<mapping.csv>" --copy-and-rename --validate --preview
```

脚本会把照片复制到 `final_grouped`，按 mapping CSV 使用目标文件名，并检查总数、分组数量、奇偶性、单组上限和横竖方向一致性。

### 直接重命名已有工作副本

只有用户明确要求直接改名时才使用：

```bash
python scripts/moments_photo_selector.py --source "<已选照片文件夹>" --output "<已选照片文件夹>" --mapping "<mapping.csv>" --rename-existing --validate --preview
```

该模式会先使用临时文件名完成两阶段改名，降低目标文件名互相冲突的风险；源目录仍然是用户明确指定的工作副本目录。

## 输出结构

```text
工作目录/
├── inventory.csv
├── mapping_template.csv
├── contact_sheets/
├── final_grouped/
├── final_grouped_preview.jpg
└── selected_manifest.csv
```

使用 `--rename-existing` 时，最终文件会留在用户指定的工作副本目录。

## 支持格式

支持 `.jpg`、`.jpeg`、`.png`、`.tif`、`.tiff`、`.bmp` 和 `.webp`。视频、RAW 文件以及其他格式会跳过；RAW 与对应 JPG 属于同一张照片时，默认只处理 JPG 或其他可查看的预览格式。

## 清理规则

完成视觉判断、复制或改名、验证和用户要求的输出后，删除本次生成的联系表、预览图、临时缩略图、临时 staging 文件和其他中间照片文件。保留源照片、最终成片以及用户仍需要的 mapping/manifest CSV。删除前先核对精确文件清单。

## 目录说明

```text
moments-photo-selector/
├── SKILL.md
├── README.md
├── requirements.txt
├── agents/
│   └── openai.yaml
└── scripts/
    └── moments_photo_selector.py
```

- `SKILL.md`：供 Agent 使用的完整精选、分组、命名和清理规则。
- `README.md`：面向用户的中文说明。
- `requirements.txt`：Python 图像处理依赖。
- `agents/openai.yaml`：Skill 的显示名称和默认调用提示。
- `scripts/moments_photo_selector.py`：清单、联系表、复制、命名、验证和预览辅助脚本。

## 许可证

MIT
