---
name: moments-photo-selector
description: Select, refine, group, order, and rename a final set from an already screened photo shortlist for publishing, sharing, or delivery. Focus on expression, sharpness, pose, composition, completeness, rhythm, stylistic consistency, and duplicate control while preserving necessary variety.
metadata:
  short-description: 成片精选定稿
  version: "1.0.1"
---

# 成片精选定稿

## 中文介绍

面向已经完成粗筛的候选照片进行第二轮精挑，从几十到一百张左右的候选片中进一步选出最适合最终发布、分享或交付的一组精选照片。重点比较表情、清晰度、姿态、构图、画面完整度、视觉节奏、风格统一性和照片之间的重复度，在保留必要丰富度的同时进一步淘汰相似帧和次优画面。对于有明确发布需求的场景，还可以继续完成照片分组、顺序安排、横竖图组合和文件命名，最终形成约十到三十张左右的精选成片。具体数量不锁死，以最终整体质量和发布需求为准。

## Workflow

Use this skill for repeated photographer workflows: refine the strongest images from a screened shortlist, arrange them for final publishing, sharing, or delivery, and rename working copies for group order. The Chinese display name is "成片精选定稿"; keep the internal skill id `moments-photo-selector` unchanged.

Default behavior:
- Do not modify the original source folder.
- Work in an output/staging folder unless the user explicitly says to rename an existing working set.
- Preserve original image pixels; only copy, move, and rename files.
- Prefer a coherent final set sized to the user's publishing, sharing, or delivery requirement. When a 9-slot layout is requested, prefer exactly 9 slots.
- When a 9-slot layout is requested, prefer 3 images per collage because it maps cleanly to 27 files. Use single-image slots only when the user asks for them or when that produces a stronger set.

## Selection Rules

When selecting photos:
- First generate contact sheets with visible filenames.
- Choose for expression, sharpness, pose, composition, variety, and visual rhythm.
- Avoid near-duplicates unless they form a deliberate collage sequence.
- Build a strong compact final option first, then expand when the user needs more files or groups.
- If 27 selected files cannot satisfy orientation grouping, replace or remove files so each final group is valid.

Collage constraints:
- Each collage group must have an odd count.
- A collage group may contain at most 5 images.
- Do not mix vertical and horizontal images in the same group.
- If the requested final output is 9 slots and every slot should be a 3-image collage, produce exactly 27 files named `1-1.jpg` through `9-3.jpg`.
- If a photo is meant to appear alone, name it `1.jpg`, `2.jpg`, etc. Do not add `-1`.

## Recommended Process

1. Inventory the folder and image orientations.
2. Generate contact sheets:

```powershell
& "<skill>/scripts/moments_photo_selector.ps1" -SourcePath "<photo-folder>" -OutputPath "<output-folder>" -MakeContactSheets
```

3. Visually inspect contact sheets and decide:
- final filenames,
- source filenames,
- group order,
- whether any selected image needs replacement to satisfy orientation counts.

4. Create a mapping CSV with columns:

```csv
target,source
1-1.jpg,DSCF4578.jpg
1-2.jpg,DSCF4624.jpg
1-3.jpg,DSCF4638.jpg
```

5. Copy and rename from the original folder into a final working folder:

```powershell
& "<skill>/scripts/moments_photo_selector.ps1" -SourcePath "<photo-folder>" -OutputPath "<output-folder>" -MappingCsv "<mapping.csv>" -CopyAndRename -Validate -MakePreview
```

If the user explicitly says to rename an existing selected folder directly, use:

```powershell
& "<skill>/scripts/moments_photo_selector.ps1" -SourcePath "<selected-folder>" -OutputPath "<selected-folder>" -MappingCsv "<mapping.csv>" -RenameExisting -Validate -MakePreview
```

For direct rename, the mapping CSV still uses `target,source`, where `source` is the current filename in the selected folder and `target` is the new filename.

## Cleanup

After all selection, grouping, renaming/copying, validation, and user-requested output steps are complete, delete intermediate photo files generated during the workflow so they do not consume disk space.

Delete generated image files such as:
- contact sheets,
- preview sheets,
- temporary thumbnails,
- temporary staging copies of source photos,
- duplicate working images that are not part of the final named output.

Keep:
- the final selected and renamed photos,
- the original source photos,
- lightweight CSV or text records such as mapping files and manifests, unless the user asks to remove them too.

Do not delete any folder or file unless it is clearly an intermediate artifact created for this run. If a preview image is needed for final verification, inspect it first and then remove it before reporting completion.

## Output

Return:
- the final folder path,
- a short note confirming source files were not changed,
- the group structure and any replacements,
- a short note confirming intermediate generated photo files were cleaned up.

Avoid overwhelming the user with every rejected image unless they ask for the rationale.
