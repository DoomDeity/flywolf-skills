# FlyWolf-fuji-scene-recipe-master

FlyWolf 富士现场配方师 3.0.1。

## 功能

上传一张手机或相机拍摄的现场照片，分析现场光线、影调、色彩和主体，输出 3 套明显不同的 Fujifilm JPEG 直出配方。用户可以说明不满意的原因，Skill 会结合完整的自然语言反馈，保留喜欢的方向并重新生成 3 套方案。

Skill 运行在支持视觉和语言理解的宿主 AI 中。图像理解和反馈理解由运行该 Skill 的宿主 AI 模型完成，本 Skill 提供摄影判断框架和 Fujifilm 参数规则。

## 3.0.1 更新

- 删除相机型号兼容判断和机型数据库。
- 删除曝光补偿和 EV 数字，改为每套配方的自然语言拍摄曝光建议。
- 修正 ACROS、滤镜和 MONOCHROMATIC COLOR 的 Fujifilm 菜单表达。
- 让配方名称根据最终实际参数动态生成，反馈重做不沿用旧名称。
- Skill 版直接理解自然语言反馈；离线 minitool 采用快捷反馈、自由文本和本地多意图解析。
- 增强 minitool 的本地图像特征分析，并加入主体和目标感觉选择。

## Skill 入口

在支持 Skill 的宿主中使用 $FlyWolf-fuji-scene-recipe-master，然后上传现场照片。

## 小红书 minitool

minitool 是完全离线的本地版本。照片只在本地设备进行 Canvas/JavaScript 图像特征分析，不上传照片，不调用外部 API。它与 Skill 版的能力等级不同：minitool 使用可解释的本地特征和有限的反馈解析，不宣称能理解任意图像或任意自然语言。

发布页可使用：

- 小工具名称：富士现场配方
- 简介：照片生成3套富士配方
- 图标：minitool/assets/icon.png，1:1 PNG，远小于 5 MB

页面文案使用“智能分析现场光线”“根据现场照片生成富士配方”“告诉我哪里不满意，再生成 3 套”等准确表述。

## 目录

- SKILL.md：宿主 Skill 规则与输出协议
- agents/openai.yaml：宿主入口配置
- minitool/index.html：离线小红书工具入口
- minitool/assets/app.js：本地图像分析、配方生成和反馈解析
- minitool/assets/style.css：本地页面样式
- minitool/assets/icon.png：发布页使用的 1:1 图标

打包时应把 minitool 目录中的内容直接放在 ZIP 根目录，使 index.html 位于 ZIP 根目录。

## License

MIT
