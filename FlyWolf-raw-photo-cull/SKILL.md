---
name: raw-photo-cull
description: First-pass culling for large portrait/photo folders, usually around hundreds to 1000+ images, to select promising originals for later retouching and a second round of selection. Prioritize hard-to-fix subject qualities and preserve variety; do not reject photos only for fixable composition, color, lighting, crop, or background issues.
metadata:
  short-description: 原片潜力粗筛
  version: "1.0.1"
---

# 原片潜力粗筛

## 中文介绍

面向数百到上千张原片的第一轮筛选，从大批量照片中快速保留一批值得继续精修和二次挑选的候选片。重点判断表情、眼神、动作、肢体状态、情绪氛围、瞬间感和场景多样性等后期难以修复的核心质量，不会仅因为构图、裁切、色彩、光线或背景杂物等可后期调整的问题而轻易淘汰。筛选时优先保证不同场景、角度、造型和情绪都有代表性照片，避免某一组相似画面占据全部名额。适合从约数百至上千张原片中，粗筛出几十到一百张左右具有后续价值的照片，具体数量根据素材质量和场景丰富度灵活调整。

## Purpose

Use this skill to produce a retouching shortlist, not a final publishing set. The goal is to keep 50-100 images with editing potential from a large folder, while preserving variety across angles, scenes, styles, poses, and moods.

This is different from `moments-photo-selector`: do not optimize for a final publish-ready set, collage order, or immediate delivery.

## Selection Logic

Prioritize hard-to-fix qualities:
- expression, eye energy, emotional tone,
- pose, gesture, hand shape, body line,
- natural movement, atmosphere, quiet moments,
- distinct angles, framing ideas, scene changes, styling changes,
- images that can become strong after retouching or cropping.

Do not reject only because of fixable issues:
- composition or crop can be adjusted,
- color and lighting can be retouched,
- background intrusions, other people, or props can be removed,
- a non-smiling, non-camera-facing, closed-eye, lowered-head, or profile image can be excellent if it has mood.

Reject or deprioritize only when the core subject performance is weak:
- awkward expression without useful mood,
- poor eye direction with no intention,
- stiff or broken body language,
- unflattering hand/limb position that cannot be repaired,
- near-duplicate weaker frames when a better adjacent frame exists,
- severe technical failure that blocks retouching usefulness.

## Coverage Rule

Protect diversity. If a shoot contains 10 visibly different angles, scenes, styles, or moods, select at least one good frame from each. Do not let one attractive scene crowd out all other usable concepts.

Use a two-pass approach:
1. Coverage pass: identify every distinct scene/angle/style/mood and keep at least one promising frame from each.
2. Quality pass: add the strongest remaining frames until the target count is reached.

Target count:
- Default to 50-100 selected images.
- If the folder has fewer than 500 images, scale down only if the user allows it.
- If the shoot is highly varied, prefer the upper end of the range.
- If many images are near-duplicates, prefer the lower end.

## Workflow

1. Generate review materials from the source folder:

```powershell
python "<skill>/scripts/raw_photo_cull.py" --source "<photo-folder>" --output "<output-folder>" --contact-sheets
```

2. Inspect contact sheets in order. Track candidate filenames and scene labels. Use the original image files for close checks when needed.

3. Write a selection CSV with at least a `filename` column:

```csv
filename,scene,reason
DSCF0001.jpg,classroom desk,strong eyes and relaxed hand
DSCF0048.jpg,window profile,quiet lowered-head mood
```

4. Copy selected originals into a retouching shortlist:

```powershell
python "<skill>/scripts/raw_photo_cull.py" --source "<photo-folder>" --output "<output-folder>" --selection "<selection.csv>" --copy-selected --preview
```

The script creates `selected_for_retouch` with sequential names like `001_DSCF0001.jpg`, plus a manifest and preview contact sheets.

## Cleanup

After all selection, copying, validation, and user-requested output steps are complete, delete intermediate photo files generated during the workflow so they do not consume disk space.

Delete generated image files such as:
- contact sheets,
- preview sheets,
- temporary thumbnails,
- temporary staging copies of source photos.

Keep:
- the final selected photos in the user's requested destination,
- the original source photos,
- lightweight CSV or text records such as manifests and selection lists, unless the user asks to remove them too.

Do not delete any folder or file unless it is clearly an intermediate artifact created for this run. If a preview image is needed for final verification, inspect it first and then remove it before reporting completion.

## Output To User

Report:
- selected count,
- selected folder path,
- whether the original source folder was untouched,
- whether intermediate generated photo files were cleaned up,
- any important coverage decisions, such as "selected at least one from each of 12 scene/mood groups."

Keep the explanation short unless the user asks for detailed rationale.
