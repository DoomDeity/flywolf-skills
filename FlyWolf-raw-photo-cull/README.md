# 原片潜力粗筛

版本：2.0

## 中文介绍

面向数百到上千张原片的第一轮筛选，从大批量照片中快速保留一批值得继续精修和二次挑选的候选片。重点判断表情、眼神、动作、肢体状态、情绪氛围、瞬间感和场景多样性等后期难以修复的核心质量，不会仅因为构图、裁切、色彩、光线或背景杂物等可后期调整的问题而轻易淘汰。筛选时优先保证不同场景、角度、造型和情绪都有代表性照片，避免某一组相似画面占据全部名额。适合从约数百至上千张原片中，粗筛出几十到一百张左右具有后续价值的照片，具体数量根据素材质量和场景丰富度灵活调整。

## 用途

这是第一轮原片潜力筛选工具，不负责最终发布定稿、拼图分组或成片命名。它适合从数百到上千张照片中，保留一批值得继续修图和二次精选的候选片。

## 判断重点

- 优先判断表情、眼神、动作、肢体状态、情绪氛围和瞬间感。
- 优先保证不同场景、角度、造型、风格和情绪都有代表性照片。
- 构图、裁切、色彩、光线和背景杂物如果可以后期调整，不作为轻易淘汰的理由。
- 闭眼、低头、不看镜头或不微笑的照片，只要情绪和画面意图成立，也可以保留。
- 明显失败的表情、僵硬肢体、严重失焦和更弱的重复帧应当淘汰或降级。

## 使用方式

### 安装依赖

Windows 和 macOS 都使用 Python 3。若当前环境还没有 Pillow，可在本目录执行：

```bash
python -m pip install -r requirements.txt
```

macOS 也可以使用：

```bash
python3 -m pip install -r requirements.txt
```

### 生成清单和联系表

```bash
python scripts/raw_photo_cull.py --source "<原片文件夹>" --output "<工作目录>" --contact-sheets
```

macOS：

```bash
python3 scripts/raw_photo_cull.py --source "<原片文件夹>" --output "<工作目录>" --contact-sheets
```

检查带文件名的联系表后，填写 `selection_template.csv`，至少保留 `filename` 列：

```csv
filename,scene,reason
DSCF0001.jpg,教室,眼神自然且动作完整
DSCF0048.jpg,窗边,低头情绪有氛围
```

### 复制入选照片

```bash
python scripts/raw_photo_cull.py --source "<原片文件夹>" --output "<工作目录>" --selection "<selection.csv>" --copy-selected --preview
```

脚本会将入选照片复制到 `selected_for_retouch`，生成顺序前缀、清单和预览联系表，不会修改源照片。

## 输出结构

```text
工作目录/
├── inventory.csv
├── selection_template.csv
├── contact_sheets/
├── selected_for_retouch/
├── selected_manifest.csv
└── selected_preview/
```

## 支持格式

支持 `.jpg`、`.jpeg`、`.png`、`.tif`、`.tiff`、`.bmp` 和 `.webp`。视频文件、RAW 文件及其他未列出的格式会跳过。RAW 与对应 JPG/预览图属于同一张照片时，默认只处理可查看的 JPG 或预览格式。

## 清理规则

完成视觉判断、复制、验证和用户要求的输出后，删除本次生成的联系表图片、预览图片、临时缩略图和其他中间照片文件。保留源照片、最终候选照片以及用户仍需要的轻量 CSV 记录。不要删除源文件。

## 目录说明

```text
raw-photo-cull/
├── SKILL.md
├── README.md
├── requirements.txt
├── agents/
│   └── openai.yaml
└── scripts/
    └── raw_photo_cull.py
```

- `SKILL.md`：供 Agent 使用的完整筛选逻辑和执行规则。
- `README.md`：面向用户的中文说明。
- `requirements.txt`：Python 图像处理依赖。
- `agents/openai.yaml`：Skill 的显示名称和默认调用提示。
- `scripts/raw_photo_cull.py`：清点、联系表、复制和预览辅助脚本。

## 许可证

MIT
