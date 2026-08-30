(function () {
  'use strict';

  var elements = {
    photoInput: document.getElementById('photoInput'),
    uploadZone: document.getElementById('uploadZone'),
    uploadTitle: document.getElementById('uploadTitle'),
    previewFrame: document.getElementById('previewFrame'),
    previewImage: document.getElementById('previewImage'),
    imageMeta: document.getElementById('imageMeta'),
    replaceButton: document.getElementById('replaceButton'),
    cameraModel: document.getElementById('cameraModel'),
    lookSelect: document.getElementById('lookSelect'),
    sceneContext: document.getElementById('sceneContext'),
    analyzeButton: document.getElementById('analyzeButton'),
    inputMessage: document.getElementById('inputMessage'),
    resultsSection: document.getElementById('resultsSection'),
    roundBadge: document.getElementById('roundBadge'),
    sceneSummary: document.getElementById('sceneSummary'),
    metricGrid: document.getElementById('metricGrid'),
    analysisNote: document.getElementById('analysisNote'),
    recipeContext: document.getElementById('recipeContext'),
    recipesGrid: document.getElementById('recipesGrid'),
    feedbackChips: document.getElementById('feedbackChips'),
    feedbackInput: document.getElementById('feedbackInput'),
    reviseButton: document.getElementById('reviseButton'),
    feedbackMessage: document.getElementById('feedbackMessage')
  };

  var state = {
    photoUrl: '',
    photoFile: null,
    imageWidth: 0,
    imageHeight: 0,
    analysis: null,
    output: null,
    round: 0,
    cameraModel: '',
    lookKey: 'auto',
    sceneContext: ''
  };

  var SLOT_META = [
    {
      code: 'A',
      title: '安全还原',
      role: '优先保住高光、肤色和白色，适合先试拍。',
      change: '取向最稳，反差和特殊效果最克制。',
      risk: '高光更保守，画面可能比现场观感略平。'
    },
    {
      code: 'B',
      title: '氛围平衡',
      role: '在不牺牲曝光的前提下，把目标风格放进现场。',
      change: '冷暖、色彩和反差更明显，氛围感居中。',
      risk: '混合光或肤色复杂时，需要看一张试拍再微调。'
    },
    {
      code: 'C',
      title: '风格强化',
      role: '把复古、电影、浓郁或低饱和方向再推一步。',
      change: '风格最强，颗粒、暗部或色彩取舍更明确。',
      risk: '高光容错和肤色稳定性最低，不适合盲拍整组。'
    }
  ];

  var STYLE_PROFILES = {
    auto: {
      key: 'auto',
      label: '现场自适应',
      type: 'color',
      films: ['PROVIA', 'REALA ACE', 'Classic Chrome'],
      names: ['现场安全还原', '现场氛围平衡', '现场风格强化'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: 0,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['关闭', '弱', '强'],
      fxModes: ['关闭', '关闭', '弱']
    },
    clean: {
      key: 'clean',
      label: '日系清透',
      type: 'color',
      films: ['REALA ACE', 'ASTIA', 'PROVIA'],
      names: ['清透留白', '日光柔和', '轻胶片清晰感'],
      colorBase: 0,
      sharpBase: 1,
      clarityBase: 0,
      grainModes: ['关闭', '关闭', '弱'],
      chromeModes: ['关闭', '弱', '弱'],
      fxModes: ['关闭', '关闭', '关闭']
    },
    film: {
      key: 'film',
      label: '复古胶片',
      type: 'color',
      films: ['Classic Chrome', 'Classic Neg.', 'Nostalgic Neg.'],
      names: ['经典街拍', '复古颗粒', '旧色强化'],
      colorBase: 0,
      sharpBase: -1,
      clarityBase: -1,
      grainModes: ['关闭', '弱', '强'],
      chromeModes: ['弱', '强', '强'],
      fxModes: ['关闭', '弱', '弱']
    },
    cinema: {
      key: 'cinema',
      label: '电影感',
      type: 'color',
      films: ['ETERNA', 'Classic Chrome', 'Classic Neg.'],
      names: ['高光保留', '低饱和电影', '暗部氛围'],
      colorBase: -1,
      sharpBase: -1,
      clarityBase: -2,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['弱', '弱', '强'],
      fxModes: ['关闭', '弱', '弱']
    },
    warm: {
      key: 'warm',
      label: '暖调人像',
      type: 'color',
      films: ['ASTIA', 'Nostalgic Neg.', 'PRO Neg. Std'],
      names: ['肤色柔和', '暖光自然', '暖调胶片'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: -1,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['关闭', '弱', '弱'],
      fxModes: ['关闭', '关闭', '弱']
    },
    vivid: {
      key: 'vivid',
      label: '风景浓郁',
      type: 'color',
      films: ['REALA ACE', 'Velvia', 'Classic Chrome'],
      names: ['自然浓郁', '风景饱和', '色彩强化'],
      colorBase: 1,
      sharpBase: 1,
      clarityBase: 1,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['弱', '强', '强'],
      fxModes: ['关闭', '弱', '强']
    },
    'low-sat': {
      key: 'low-sat',
      label: '低饱和',
      type: 'color',
      films: ['ETERNA', 'Classic Chrome', 'PROVIA'],
      names: ['轻灰质感', '克制电影', '低饱和强化'],
      colorBase: -2,
      sharpBase: -1,
      clarityBase: -1,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['弱', '弱', '强'],
      fxModes: ['关闭', '关闭', '关闭']
    },
    bw: {
      key: 'bw',
      label: '黑白纪实',
      type: 'bw',
      films: ['ACROS', 'ACROS + Ye', 'ACROS + R'],
      names: ['ACROS 细节', 'ACROS 黄滤镜', 'ACROS 红滤镜'],
      filters: ['标准', 'Ye', 'R'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: 0,
      grainModes: ['弱', '弱', '强'],
      chromeModes: ['关闭', '关闭', '关闭'],
      fxModes: ['关闭', '关闭', '关闭']
    }
  };

  var FEEDBACK_RULES = [
    { key: 'tooWarm', label: '压低黄橙', words: ['太黄', '偏黄', '发黄', '太橙', '橙色重', '肤色黄'] },
    { key: 'tooCool', label: '拉回冷色', words: ['太蓝', '偏蓝', '发冷', '太冷', '冷了'] },
    { key: 'tooGreen', label: '压住绿色', words: ['偏绿', '发绿', '荧光', '绿色脏', '脏'] },
    { key: 'tooVivid', label: '降低饱和', words: ['太艳', '颜色太重', '饱和过头', '太浓', '艳了'] },
    { key: 'tooFlat', label: '增加层次', words: ['太灰', '太平', '没层次', '寡淡', '不够饱和'] },
    { key: 'tooHard', label: '柔化反差', words: ['太硬', '太数码', '对比太强', '反差太大'] },
    { key: 'highlight', label: '保护高光', words: ['高光溢出', '高光炸', '天空白', '灯牌溢出', '过曝'] },
    { key: 'shadow', label: '打开暗部', words: ['暗部太黑', '死黑', '堵黑', '脸部太暗', '阴影太重'] },
    { key: 'notFilm', label: '加强胶片感', words: ['不够复古', '不像胶片', '不够胶片', '更复古', '想要颗粒'] },
    { key: 'notClean', label: '提高清透度', words: ['不够清透', '太脏', '想要干净', '更干净'] },
    { key: 'skin', label: '优先修正肤色', words: ['肤色不自然', '人脸不自然', '人像不自然', '肤色不好'] }
  ];

  var FILM_FALLBACKS = {
    'REALA ACE': 'PROVIA',
    'Nostalgic Neg.': 'ASTIA',
    'Classic Neg.': 'Classic Chrome',
    'ETERNA': 'Classic Chrome',
    Velvia: 'REALA ACE'
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function formatSigned(value) {
    if (value > 0) {
      return '+' + value;
    }
    return String(value);
  }

  function formatEv(value) {
    if (value === 0) {
      return '0 EV';
    }
    return (value > 0 ? '+' : '') + value.toFixed(1) + ' EV';
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setMessage(target, text, kind) {
    target.textContent = text;
    target.className = 'message' + (kind ? ' ' + kind : '');
  }

  function normalizeText(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
  }

  function containsAny(text, words) {
    for (var i = 0; i < words.length; i += 1) {
      if (text.indexOf(words[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function uniquePush(list, value) {
    if (list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  function getFeedbackSignals(text) {
    var normalized = normalizeText(text);
    var signals = [];
    FEEDBACK_RULES.forEach(function (rule) {
      if (containsAny(normalized, rule.words)) {
        signals.push(rule);
      }
    });
    return signals;
  }

  function collectImageMetrics(image) {
    var maxSide = 96;
    var sourceWidth = image.naturalWidth || image.width;
    var sourceHeight = image.naturalHeight || image.height;
    var scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    var width = Math.max(1, Math.round(sourceWidth * scale));
    var height = Math.max(1, Math.round(sourceHeight * scale));
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    if (!context) {
      throw new Error('当前容器无法读取图片像素。');
    }

    context.drawImage(image, 0, 0, width, height);
    var pixels = context.getImageData(0, 0, width, height).data;
    var count = pixels.length / 4;
    var sumLuminance = 0;
    var sumLuminanceSquared = 0;
    var sumR = 0;
    var sumG = 0;
    var sumB = 0;
    var sumSaturation = 0;
    var highlights = 0;
    var shadows = 0;

    for (var index = 0; index < pixels.length; index += 4) {
      var alpha = pixels[index + 3] / 255;
      var red = pixels[index] * alpha + 255 * (1 - alpha);
      var green = pixels[index + 1] * alpha + 255 * (1 - alpha);
      var blue = pixels[index + 2] * alpha + 255 * (1 - alpha);
      var pixelMax = Math.max(red, green, blue);
      var pixelMin = Math.min(red, green, blue);
      var luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

      sumR += red;
      sumG += green;
      sumB += blue;
      sumLuminance += luminance;
      sumLuminanceSquared += luminance * luminance;
      sumSaturation += (pixelMax - pixelMin) / 255;
      if (luminance >= 230) {
        highlights += 1;
      }
      if (luminance <= 38) {
        shadows += 1;
      }
    }

    var averageLuminance = sumLuminance / count;
    var variance = Math.max(0, sumLuminanceSquared / count - averageLuminance * averageLuminance);
    var averageR = sumR / count;
    var averageG = sumG / count;
    var averageB = sumB / count;

    return {
      averageLuminance: averageLuminance,
      contrast: Math.sqrt(variance),
      averageR: averageR,
      averageG: averageG,
      averageB: averageB,
      saturation: sumSaturation / count,
      highlightRatio: highlights / count,
      shadowRatio: shadows / count,
      warmBias: averageR - averageB,
      greenBias: averageG - (averageR + averageB) / 2,
      magentaBias: (averageR + averageB) / 2 - averageG,
      sampleWidth: width,
      sampleHeight: height
    };
  }

  function classifyScene(metrics, subject) {
    var lightLabel;
    var contrastLabel;
    var colorLabel;
    var risks = [];

    if (metrics.averageLuminance < 75) {
      lightLabel = '暗部为主';
    } else if (metrics.averageLuminance > 190 && metrics.highlightRatio > 0.04) {
      lightLabel = '明亮、高光明显';
    } else if (metrics.contrast < 36) {
      lightLabel = '柔和散射光倾向';
    } else if (metrics.contrast > 64) {
      lightLabel = '方向性较强光线倾向';
    } else {
      lightLabel = '中等环境光';
    }

    if (metrics.contrast > 64 || (metrics.highlightRatio > 0.07 && metrics.shadowRatio > 0.12)) {
      contrastLabel = '高反差';
    } else if (metrics.contrast < 36) {
      contrastLabel = '低反差';
    } else {
      contrastLabel = '中反差';
    }

    if (metrics.greenBias > 10 && metrics.greenBias > Math.abs(metrics.warmBias) * 0.45) {
      colorLabel = '偏绿';
    } else if (metrics.warmBias > 18) {
      colorLabel = '偏暖';
    } else if (metrics.warmBias < -18) {
      colorLabel = '偏冷';
    } else if (metrics.magentaBias > 14) {
      colorLabel = '偏洋红';
    } else {
      colorLabel = '接近中性';
    }

    if (metrics.highlightRatio > 0.06) {
      risks.push('高光容易溢出');
    }
    if (metrics.shadowRatio > 0.18) {
      risks.push('暗部可能堵塞');
    }
    if (metrics.saturation > 0.48) {
      risks.push('环境色可能偏重');
    }
    if (colorLabel === '偏暖') {
      risks.push('暖色可能令肤色偏黄');
    }
    if (colorLabel === '偏绿') {
      risks.push('绿色环境可能发脏');
    }
    if (!risks.length) {
      risks.push('暂无明显单项风险');
    }

    return {
      lightLabel: lightLabel,
      contrastLabel: contrastLabel,
      colorLabel: colorLabel,
      risks: risks,
      subject: subject || '未填写，主要依据照片光线判断',
      confidence: '中（本地像素估计）',
      averageLuminance: metrics.averageLuminance,
      contrast: metrics.contrast,
      saturation: metrics.saturation,
      highlightRatio: metrics.highlightRatio,
      shadowRatio: metrics.shadowRatio,
      warmBias: metrics.warmBias,
      greenBias: metrics.greenBias,
      magentaBias: metrics.magentaBias
    };
  }

  function cloneProfile(profile) {
    var cloned = {};
    Object.keys(profile).forEach(function (key) {
      cloned[key] = Array.isArray(profile[key]) ? profile[key].slice() : profile[key];
    });
    return cloned;
  }

  function getProfile(lookKey, analysis) {
    var base = STYLE_PROFILES[lookKey] || STYLE_PROFILES.auto;
    var profile = cloneProfile(base);

    if (lookKey === 'auto') {
      if (analysis.highlightRatio > 0.07 || analysis.contrastLabel === '高反差') {
        profile.films = ['REALA ACE', 'Classic Chrome', 'ETERNA'];
        profile.names = ['高光保留', '氛围平衡', '反差强化'];
      } else if (analysis.averageLuminance < 78) {
        profile.films = ['ETERNA', 'Classic Chrome', 'Classic Neg.'];
        profile.names = ['暗部保留', '夜色平衡', '夜景风格'];
      } else if (analysis.colorLabel === '偏暖') {
        profile.films = ['ASTIA', 'PROVIA', 'Classic Chrome'];
        profile.names = ['暖光保肤', '暖色平衡', '暖调氛围'];
      }
    }

    return profile;
  }

  function buildModifiers(signals) {
    var modifiers = {
      wbR: 0,
      wbB: 0,
      color: 0,
      sharpness: 0,
      clarity: 0,
      highlight: 0,
      shadow: 0,
      exposure: 0,
      forceDR: false,
      forceCleanGrain: false,
      forceFilmGrain: false,
      preferFilms: null,
      changes: []
    };

    signals.forEach(function (signal) {
      if (signal.key === 'tooWarm') {
        modifiers.wbB += 2;
        modifiers.color -= 1;
        modifiers.preferFilms = ['PROVIA', 'ETERNA', 'ASTIA'];
        uniquePush(modifiers.changes, '白平衡向蓝色修正');
        uniquePush(modifiers.changes, '色彩降低 1');
      }
      if (signal.key === 'tooCool') {
        modifiers.wbB -= 2;
        modifiers.preferFilms = ['ASTIA', 'PROVIA', 'REALA ACE'];
        uniquePush(modifiers.changes, '白平衡向暖色修正');
      }
      if (signal.key === 'tooGreen') {
        modifiers.wbR += 2;
        modifiers.color -= 1;
        modifiers.preferFilms = ['REALA ACE', 'Classic Chrome', 'ASTIA'];
        uniquePush(modifiers.changes, '白平衡向洋红修正');
        uniquePush(modifiers.changes, '降低绿色环境的饱和感');
      }
      if (signal.key === 'tooVivid') {
        modifiers.color -= 2;
        modifiers.forceCleanGrain = true;
        modifiers.preferFilms = ['ETERNA', 'Classic Chrome', 'PROVIA'];
        uniquePush(modifiers.changes, '色彩降低 2');
        uniquePush(modifiers.changes, '关闭或减弱特殊色彩效果');
      }
      if (signal.key === 'tooFlat') {
        modifiers.color += 1;
        modifiers.shadow += 1;
        modifiers.highlight += 1;
        modifiers.preferFilms = ['REALA ACE', 'Classic Chrome', 'PROVIA'];
        uniquePush(modifiers.changes, '增加色彩和反差层次');
      }
      if (signal.key === 'tooHard') {
        modifiers.highlight -= 1;
        modifiers.shadow -= 1;
        modifiers.sharpness -= 1;
        modifiers.clarity -= 1;
        modifiers.preferFilms = ['ASTIA', 'ETERNA', 'PRO Neg. Std'];
        uniquePush(modifiers.changes, '高光、阴影和清晰度向柔和方向调整');
      }
      if (signal.key === 'highlight') {
        modifiers.highlight -= 1;
        modifiers.exposure -= 0.3;
        modifiers.forceDR = true;
        uniquePush(modifiers.changes, '降低曝光补偿和高光');
        uniquePush(modifiers.changes, '必要时提高动态范围');
      }
      if (signal.key === 'shadow') {
        modifiers.shadow -= 1;
        modifiers.exposure += 0.3;
        uniquePush(modifiers.changes, '打开阴影并略提曝光');
      }
      if (signal.key === 'notFilm') {
        modifiers.forceFilmGrain = true;
        modifiers.clarity -= 1;
        modifiers.sharpness -= 1;
        modifiers.preferFilms = ['Classic Neg.', 'Classic Chrome', 'Nostalgic Neg.'];
        uniquePush(modifiers.changes, '加入可控颗粒和更低锐度');
      }
      if (signal.key === 'notClean') {
        modifiers.forceCleanGrain = true;
        modifiers.clarity += 1;
        modifiers.sharpness += 1;
        modifiers.preferFilms = ['REALA ACE', 'PROVIA', 'ASTIA'];
        uniquePush(modifiers.changes, '关闭颗粒并提高画面清晰感');
      }
      if (signal.key === 'skin') {
        modifiers.color -= 1;
        modifiers.sharpness -= 1;
        modifiers.preferFilms = ['ASTIA', 'PRO Neg. Std', 'PROVIA'];
        uniquePush(modifiers.changes, '肤色优先，降低色彩和锐度');
      }
    });

    return modifiers;
  }

  function selectFilms(profile, modifiers, round) {
    var source = profile.films.slice();
    if (modifiers.preferFilms && profile.type !== 'bw') {
      source = modifiers.preferFilms.slice();
    }
    var shift = profile.type === 'bw' ? 0 : (round - 1) % source.length;
    var films = [];

    for (var index = 0; index < 3; index += 1) {
      films.push(source[(index + shift) % source.length]);
    }
    return films;
  }

  function getFilmFallback(film, isBw) {
    if (isBw) {
      return '请以机内可用的 ACROS 或黑白模拟为准，不把彩色模拟冒充黑白等效替代';
    }
    return FILM_FALLBACKS[film] || 'PROVIA';
  }

  function buildCompatibilityNote(film, isBw, cameraModel) {
    if (isBw) {
      if (cameraModel) {
        return '机型记录：' + cameraModel + '。本地工具未联网读取菜单；若机内没有该 ACROS 选项，请按菜单选择可用的黑白模拟。';
      }
      return '未填写机型；ACROS、颗粒和黑白调色请以机身菜单是否存在为准。';
    }
    if (cameraModel) {
      return '机型记录：' + cameraModel + '。若菜单没有 ' + film + '，使用接近替代：' + getFilmFallback(film, false) + '；清晰度、颗粒大小和特殊效果按菜单是否存在设置。';
    }
    return '未填写机型；若菜单没有该胶片模拟，使用接近替代：' + getFilmFallback(film, false) + '。特殊参数按机身菜单是否存在设置。';
  }

  function buildQuickLine(recipe) {
    var parts;
    if (recipe.kind === 'bw') {
      parts = [
        '【' + recipe.name + '】',
        '胶片模拟：' + recipe.filmSimulation,
        '黑白滤镜：' + recipe.bwFilter,
        '动态范围：' + recipe.dynamicRange,
        '动态范围优先：关闭',
        '高光：' + recipe.highlight,
        '阴影：' + recipe.shadow,
        '锐度：' + recipe.sharpness,
        '高 ISO 降噪：' + recipe.noiseReduction,
        '清晰度：' + recipe.clarity + '（机型支持时）',
        '颗粒效果：' + recipe.grain,
        '颗粒大小：' + recipe.grainSize + '（机型支持时）',
        '黑白调色：' + recipe.bwTone + '（机型支持时）',
        '曝光补偿：' + recipe.exposure,
        'ISO：' + recipe.iso
      ];
    } else {
      parts = [
        '【' + recipe.name + '】',
        '胶片模拟：' + recipe.filmSimulation,
        '动态范围：' + recipe.dynamicRange,
        '动态范围优先：关闭',
        '白平衡：自动',
        '白平衡偏移：R' + formatSigned(recipe.wbR) + ' B' + formatSigned(recipe.wbB),
        '高光：' + recipe.highlight,
        '阴影：' + recipe.shadow,
        '色彩：' + recipe.color,
        '锐度：' + recipe.sharpness,
        '高 ISO 降噪：' + recipe.noiseReduction,
        '清晰度：' + recipe.clarity + '（机型支持时）',
        '颗粒效果：' + recipe.grain,
        '颗粒大小：' + recipe.grainSize + '（机型支持时）',
        '色彩效果：' + recipe.colorChrome + '（机型支持时）',
        '彩色FX蓝色：' + recipe.fxBlue + '（机型支持时）',
        '曝光补偿：' + recipe.exposure,
        'ISO：' + recipe.iso
      ];
    }
    return parts.join('；') + '。';
  }

  function buildRecipe(slot, film, analysis, profile, modifiers, round, feedbackSummary, cameraModel) {
    var isBw = profile.type === 'bw';
    var highContrast = analysis.contrastLabel === '高反差' || analysis.highlightRatio > 0.07;
    var lowContrast = analysis.contrastLabel === '低反差';
    var darkScene = analysis.averageLuminance < 80;
    var highlightRisk = analysis.highlightRatio > 0.06;
    var shadowRisk = analysis.shadowRatio > 0.18;
    var slotDelta = [-1, 0, 1][slot];
    var highlight = highContrast || highlightRisk ? -2 + slot : lowContrast ? -1 + slot : -1 + slot;
    var shadow = darkScene || shadowRisk ? -2 + slot : lowContrast ? slot : -1 + slot;
    var dynamicRange = 'DR100';

    if (highlightRisk || highContrast || modifiers.forceDR) {
      dynamicRange = slot === 2 ? 'DR400' : 'DR200';
    }
    if (darkScene && !highlightRisk && !modifiers.forceDR) {
      dynamicRange = 'DR100';
    }

    var wbR = 0;
    var wbB = 0;
    var counterBalance = 2 - slot;
    if (analysis.colorLabel === '偏暖') {
      wbB += counterBalance;
    }
    if (analysis.colorLabel === '偏冷') {
      wbB -= counterBalance;
    }
    if (analysis.colorLabel === '偏绿') {
      wbR += counterBalance;
    }
    if (analysis.colorLabel === '偏洋红') {
      wbR -= counterBalance;
    }
    if (profile.key === 'warm') {
      wbB -= slot === 2 ? 2 : 1;
    }

    wbR = clamp(wbR + modifiers.wbR, -9, 9);
    wbB = clamp(wbB + modifiers.wbB, -9, 9);
    highlight = clamp(highlight + modifiers.highlight, -2, 4);
    shadow = clamp(shadow + modifiers.shadow, -2, 4);

    var color = clamp(
      profile.colorBase + (analysis.saturation > 0.48 ? -1 : 0) + slotDelta + modifiers.color,
      -4,
      4
    );
    var sharpness = clamp(profile.sharpBase + (darkScene ? -1 : 0) + slotDelta + modifiers.sharpness, -4, 4);
    var noiseReduction = clamp(-2 + (darkScene ? 1 : 0) + (slot === 2 ? 1 : 0), -4, 4);
    var clarity = clamp(profile.clarityBase + slotDelta + modifiers.clarity, -5, 5);
    var grain = profile.grainModes[slot];
    var colorChrome = profile.chromeModes[slot];
    var fxBlue = profile.fxModes[slot];

    if (modifiers.forceCleanGrain) {
      grain = '关闭';
      colorChrome = '关闭';
      fxBlue = '关闭';
    }
    if (modifiers.forceFilmGrain) {
      grain = slot === 0 ? '弱' : '强';
      colorChrome = slot === 0 ? '弱' : '强';
    }

    var grainSize = grain === '关闭' ? '—' : slot === 2 ? '大' : '小';
    var exposureValue = highlightRisk ? -0.3 : darkScene ? 0.3 : slot === 2 ? -0.2 : 0;
    exposureValue = clamp(exposureValue + modifiers.exposure, -1, 1);
    var recipe = {
      kind: isBw ? 'bw' : 'color',
      code: SLOT_META[slot].code,
      name: profile.names[slot],
      filmSimulation: film,
      dynamicRange: dynamicRange,
      wbR: wbR,
      wbB: wbB,
      highlight: highlight,
      shadow: shadow,
      color: color,
      sharpness: sharpness,
      noiseReduction: noiseReduction,
      clarity: clarity,
      grain: grain,
      grainSize: grainSize,
      colorChrome: colorChrome,
      fxBlue: fxBlue,
      exposure: formatEv(exposureValue),
      iso: dynamicRange === 'DR100' ? '自动' : '自动；最低感光度需满足 ' + dynamicRange,
      role: SLOT_META[slot].role,
      risk: SLOT_META[slot].risk,
      compatibility: buildCompatibilityNote(film, isBw, cameraModel)
    };

    if (isBw) {
      recipe.bwFilter = profile.filters[slot];
      recipe.bwTone = slot === 2 ? 'R+1' : slot === 1 ? 'B+1' : '0';
    }

    if (round === 1) {
      recipe.changeNote = SLOT_META[slot].change;
    } else {
      recipe.changeNote = '针对“' + feedbackSummary + '”：' + modifiers.changes.join('；') + '。';
    }
    recipe.quickLine = buildQuickLine(recipe);
    return recipe;
  }

  function buildOutput(analysis, lookKey, cameraModel, round, feedbackText) {
    var profile = getProfile(lookKey, analysis);
    var signals = getFeedbackSignals(feedbackText);
    var modifiers = buildModifiers(signals);
    var films = selectFilms(profile, modifiers, round);
    var feedbackSummary = signals.length ? signals.map(function (signal) {
      return signal.label;
    }).join('、') : '';
    var recipes = films.map(function (film, index) {
      return buildRecipe(index, film, analysis, profile, modifiers, round, feedbackSummary, cameraModel);
    });

    return {
      profile: profile,
      signals: signals,
      modifiers: modifiers,
      feedbackSummary: feedbackSummary,
      recipes: recipes
    };
  }

  function renderAnalysis() {
    var analysis = state.analysis;
    var subjectText = state.sceneContext || '未填写，主要依据照片光线判断';
    var cameraText = state.cameraModel || '未填写，特殊参数按机身菜单确认';
    var targetText = elements.lookSelect.options[elements.lookSelect.selectedIndex].text;
    var summary = analysis.lightLabel + '，' + analysis.contrastLabel + '，' + analysis.colorLabel + '。';

    elements.sceneSummary.innerHTML =
      '<p class="summary-label">本地分析摘要</p>' +
      '<p class="summary-text">' + escapeHtml(summary) + '</p>' +
      '<p class="summary-subtext">主要风险：' + escapeHtml(analysis.risks.join('、')) +
      '<br />主体/场景：' + escapeHtml(subjectText) +
      '<br />相机：' + escapeHtml(cameraText) + ' · 方向：' + escapeHtml(targetText) + '</p>';

    var metrics = [
      { label: '亮度', value: Math.round(analysis.averageLuminance / 255 * 100) + '%' },
      { label: '反差', value: analysis.contrastLabel },
      { label: '环境色', value: analysis.colorLabel },
      { label: '高光占比', value: Math.round(analysis.highlightRatio * 100) + '%' },
      { label: '暗部占比', value: Math.round(analysis.shadowRatio * 100) + '%' },
      { label: '判断置信度', value: analysis.confidence }
    ];

    elements.metricGrid.innerHTML = metrics.map(function (metric) {
      return '<div class="metric"><span class="metric-label">' + escapeHtml(metric.label) +
        '</span><strong class="metric-value">' + escapeHtml(metric.value) + '</strong></div>';
    }).join('');

    elements.analysisNote.textContent =
      '依据照片缩略采样的平均亮度、像素反差和 RGB 色彩倾向估计；不读取 EXIF，不联网，不上传照片。';
  }

  function renderRecipeCard(recipe, index) {
    var rows;
    if (recipe.kind === 'bw') {
      rows = [
        ['胶片模拟', recipe.filmSimulation],
        ['黑白滤镜', recipe.bwFilter],
        ['动态范围', recipe.dynamicRange],
        ['动态范围优先', '关闭'],
        ['高光', recipe.highlight],
        ['阴影', recipe.shadow],
        ['锐度', recipe.sharpness],
        ['高 ISO 降噪', recipe.noiseReduction],
        ['清晰度', recipe.clarity + '（机型支持时）'],
        ['颗粒效果', recipe.grain],
        ['颗粒大小', recipe.grainSize + '（机型支持时）'],
        ['黑白调色', recipe.bwTone + '（机型支持时）'],
        ['曝光补偿', recipe.exposure],
        ['ISO', recipe.iso]
      ];
    } else {
      rows = [
        ['胶片模拟', recipe.filmSimulation],
        ['动态范围', recipe.dynamicRange],
        ['动态范围优先', '关闭'],
        ['白平衡', '自动'],
        ['白平衡偏移', 'R' + formatSigned(recipe.wbR) + ' B' + formatSigned(recipe.wbB)],
        ['高光', recipe.highlight],
        ['阴影', recipe.shadow],
        ['色彩', recipe.color],
        ['锐度', recipe.sharpness],
        ['高 ISO 降噪', recipe.noiseReduction],
        ['清晰度', recipe.clarity + '（机型支持时）'],
        ['颗粒效果', recipe.grain],
        ['颗粒大小', recipe.grainSize + '（机型支持时）'],
        ['色彩效果', recipe.colorChrome + '（机型支持时）'],
        ['彩色FX蓝色', recipe.fxBlue + '（机型支持时）'],
        ['曝光补偿', recipe.exposure],
        ['ISO', recipe.iso]
      ];
    }

    var rowHtml = rows.map(function (row) {
      return '<div class="parameter-row"><span class="parameter-label">' +
        escapeHtml(row[0]) + '</span><strong class="parameter-value">' +
        escapeHtml(row[1]) + '</strong></div>';
    }).join('');
    var recommended = index === 0 ? ' recommended' : '';
    var tryFirst = index === 0 ? '<span class="try-first">先试这套</span>' : '';

    return '<article class="recipe-card' + recommended + '">' +
      '<div class="recipe-card-head">' +
      '<div class="recipe-kicker"><span>方案 ' + recipe.code + '</span>' + tryFirst + '</div>' +
      '<h3>' + escapeHtml(recipe.name) + '</h3>' +
      '<p class="recipe-role">' + escapeHtml(recipe.role) + '</p>' +
      '</div>' +
      '<div class="parameter-list">' + rowHtml + '</div>' +
      '<div class="recipe-notes">' +
      '<p><strong>本套变化：</strong>' + escapeHtml(recipe.changeNote) + '</p>' +
      '<p class="risk"><strong>取舍：</strong>' + escapeHtml(recipe.risk) + '</p>' +
      '<p><strong>兼容：</strong>' + escapeHtml(recipe.compatibility) + '</p>' +
      '<p class="quick-line" tabindex="0">' + escapeHtml(recipe.quickLine) + '</p>' +
      '<p class="copy-hint">长按或拖选上面一行，手动复制到备忘录。</p>' +
      '</div>' +
      '</article>';
  }

  function renderResults() {
    var output = state.output;
    renderAnalysis();
    elements.roundBadge.textContent = '第 ' + state.round + ' 轮';
    elements.recipeContext.textContent = '方向：' + output.profile.label +
      (state.cameraModel ? ' · ' + state.cameraModel : '');
    elements.recipesGrid.innerHTML = output.recipes.map(renderRecipeCard).join('');
    elements.resultsSection.hidden = false;
  }

  function getCurrentInputs() {
    return {
      cameraModel: elements.cameraModel.value.trim(),
      lookKey: elements.lookSelect.value,
      sceneContext: elements.sceneContext.value.trim()
    };
  }

  function handlePhotoChange(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type || file.type.indexOf('image/') !== 0) {
      event.target.value = '';
      setMessage(elements.inputMessage, '请选择图片文件；当前容器只支持图片输入。', 'error');
      return;
    }

    if (state.photoUrl) {
      URL.revokeObjectURL(state.photoUrl);
    }
    state.photoFile = file;
    state.photoUrl = URL.createObjectURL(file);
    state.analysis = null;
    state.output = null;
    state.round = 0;
    elements.resultsSection.hidden = true;
    elements.uploadTitle.textContent = '已选照片 · 点击换图';
    elements.uploadZone.classList.add('has-photo');
    elements.previewFrame.hidden = false;
    elements.previewImage.onload = function () {
      state.imageWidth = elements.previewImage.naturalWidth;
      state.imageHeight = elements.previewImage.naturalHeight;
      elements.imageMeta.textContent = state.imageWidth + ' × ' + state.imageHeight + ' · ' + file.name;
      setMessage(elements.inputMessage, '照片已就绪，可以开始本地分析。', 'success');
    };
    elements.previewImage.onerror = function () {
      setMessage(elements.inputMessage, '这张图片无法读取，请换一张常见格式的照片。', 'error');
    };
    elements.previewImage.src = state.photoUrl;
  }

  function handleInitialAnalysis() {
    if (!state.photoFile) {
      setMessage(elements.inputMessage, '请先上传一张手机或相机现场照片。', 'error');
      return;
    }
    if (!elements.previewImage.naturalWidth) {
      setMessage(elements.inputMessage, '照片还在读取，请稍等片刻再试。', 'error');
      return;
    }

    var inputs = getCurrentInputs();
    try {
      var metrics = collectImageMetrics(elements.previewImage);
      state.cameraModel = inputs.cameraModel;
      state.lookKey = inputs.lookKey;
      state.sceneContext = inputs.sceneContext;
      state.analysis = classifyScene(metrics, state.sceneContext);
      state.round = 1;
      state.output = buildOutput(state.analysis, state.lookKey, state.cameraModel, state.round, '');
      renderResults();
      setMessage(elements.inputMessage, '已生成 3 套方案；先试方案 A，再根据现场反馈调整。', 'success');
      elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setMessage(elements.inputMessage, error.message || '照片分析失败，请换一张图片重试。', 'error');
    }
  }

  function handleRevision() {
    if (!state.output || !state.analysis) {
      setMessage(elements.feedbackMessage, '请先完成第一轮照片分析。', 'error');
      return;
    }

    var feedback = elements.feedbackInput.value.trim();
    if (feedback.length < 2) {
      setMessage(elements.feedbackMessage, '请写出至少一个原因，例如“太黄、太灰、太硬、不够复古或高光溢出”。', 'error');
      return;
    }

    var signals = getFeedbackSignals(feedback);
    if (!signals.length) {
      setMessage(elements.feedbackMessage, '我还没识别出具体方向；请补充颜色、反差、曝光、胶片感或清透度方面的问题。', 'error');
      return;
    }

    var inputs = getCurrentInputs();
    state.cameraModel = inputs.cameraModel;
    state.lookKey = inputs.lookKey;
    state.sceneContext = inputs.sceneContext;
    state.analysis.subject = state.sceneContext || state.analysis.subject;
    state.round += 1;
    state.output = buildOutput(state.analysis, state.lookKey, state.cameraModel, state.round, feedback);
    renderResults();
    setMessage(
      elements.feedbackMessage,
      '第 ' + state.round + ' 轮已按“' + state.output.feedbackSummary + '”重新生成 3 套方案。',
      'success'
    );
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleFeedbackChip(event) {
    var button = event.target.closest('button[data-feedback]');
    if (!button) {
      return;
    }
    var preset = button.getAttribute('data-feedback');
    var current = elements.feedbackInput.value.trim();
    if (current && current.indexOf(preset) === -1) {
      elements.feedbackInput.value = current + '；' + preset;
    } else if (!current) {
      elements.feedbackInput.value = preset;
    }
    elements.feedbackInput.focus();
  }

  elements.photoInput.addEventListener('change', handlePhotoChange);
  elements.replaceButton.addEventListener('click', function () {
    elements.photoInput.click();
  });
  elements.analyzeButton.addEventListener('click', handleInitialAnalysis);
  elements.reviseButton.addEventListener('click', handleRevision);
  elements.feedbackChips.addEventListener('click', handleFeedbackChip);
  window.addEventListener('pagehide', function () {
    if (state.photoUrl) {
      URL.revokeObjectURL(state.photoUrl);
    }
  });
}());
