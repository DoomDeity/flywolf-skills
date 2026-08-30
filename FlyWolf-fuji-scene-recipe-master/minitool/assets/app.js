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
    subjectSelect: document.getElementById('subjectSelect'),
    lookSelect: document.getElementById('lookSelect'),
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
    subjectKey: 'portrait',
    lookKey: 'auto'
  };

  var SUBJECT_LABELS = {
    portrait: '人像',
    landscape: '风景',
    street: '街拍',
    architecture: '建筑',
    food: '食物',
    night: '夜景',
    other: '其他'
  };

  var LOOK_LABELS = {
    auto: '自动推荐',
    natural: '自然耐看',
    clean: '日系清透',
    film: '复古胶片',
    cinema: '电影感',
    vivid: '浓郁',
    'low-sat': '低饱和',
    bw: '黑白纪实'
  };

  var SLOT_META = [
    {
      code: 'A',
      title: '自然稳妥',
      role: '尽量尊重现场，颜色干净，反差和特殊效果更有容错。',
      change: '以现场为基准，先保护主体和高光。',
      risk: '风格最克制，可能不如强化方案醒目。'
    },
    {
      code: 'B',
      title: '目标风格',
      role: '把你选择的感觉放进现场，保留主体的可读性。',
      change: '风格、色彩和影调向目标感觉明显靠近。',
      risk: '混合光或复杂肤色仍建议先试一张。'
    },
    {
      code: 'C',
      title: '个性强化',
      role: '把胶片、电影、浓郁、低饱和或黑白质感再推一步。',
      change: '风格取舍最明确，适合比较审美方向。',
      risk: '容错最低，适合小范围试拍。'
    }
  ];

  var STYLE_PROFILES = {
    natural: {
      key: 'natural',
      label: '自然耐看',
      type: 'color',
      films: ['PROVIA', 'REALA ACE', 'ASTIA'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: 0,
      grainModes: ['关闭', '关闭', '弱'],
      chromeModes: ['关闭', '弱', '弱'],
      fxModes: ['关闭', '关闭', '关闭']
    },
    clean: {
      key: 'clean',
      label: '日系清透',
      type: 'color',
      films: ['REALA ACE', 'ASTIA', 'PROVIA'],
      colorBase: 0,
      sharpBase: 1,
      clarityBase: 1,
      grainModes: ['关闭', '关闭', '弱'],
      chromeModes: ['关闭', '弱', '弱'],
      fxModes: ['关闭', '关闭', '关闭']
    },
    film: {
      key: 'film',
      label: '复古胶片',
      type: 'color',
      films: ['Classic Chrome', 'Classic Neg.', 'Nostalgic Neg.'],
      colorBase: 0,
      sharpBase: -1,
      clarityBase: -1,
      grainModes: ['弱', '强', '强'],
      chromeModes: ['弱', '强', '强'],
      fxModes: ['关闭', '弱', '弱']
    },
    cinema: {
      key: 'cinema',
      label: '电影感',
      type: 'color',
      films: ['ETERNA', 'Classic Chrome', 'Classic Neg.'],
      colorBase: -1,
      sharpBase: -1,
      clarityBase: -2,
      grainModes: ['关闭', '弱', '强'],
      chromeModes: ['弱', '弱', '强'],
      fxModes: ['关闭', '弱', '弱']
    },
    warm: {
      key: 'warm',
      label: '暖调人像',
      type: 'color',
      films: ['ASTIA', 'Nostalgic Neg.', 'PRO Neg. Std'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: -1,
      grainModes: ['关闭', '弱', '弱'],
      chromeModes: ['关闭', '弱', '弱'],
      fxModes: ['关闭', '关闭', '弱']
    },
    vivid: {
      key: 'vivid',
      label: '浓郁',
      type: 'color',
      films: ['REALA ACE', 'Velvia', 'Classic Chrome'],
      colorBase: 1,
      sharpBase: 1,
      clarityBase: 1,
      grainModes: ['关闭', '弱', '强'],
      chromeModes: ['弱', '强', '强'],
      fxModes: ['关闭', '弱', '强']
    },
    'low-sat': {
      key: 'low-sat',
      label: '低饱和',
      type: 'color',
      films: ['ETERNA', 'Classic Chrome', 'PROVIA'],
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
      films: ['ACROS', 'ACROS+Ye FILTER', 'ACROS+R FILTER', 'ACROS+G FILTER'],
      colorBase: 0,
      sharpBase: 0,
      clarityBase: 0,
      grainModes: ['弱', '弱', '强'],
      chromeModes: ['关闭', '关闭', '关闭'],
      fxModes: ['关闭', '关闭', '关闭']
    }
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function intValue(value) {
    return Math.round(value);
  }

  function formatSigned(value) {
    if (value > 0) {
      return '+' + value;
    }
    return String(value);
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
    return String(text || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[，。！？、；;,：:]/g, '');
  }

  function containsAny(text, words) {
    for (var index = 0; index < words.length; index += 1) {
      if (text.indexOf(words[index]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function findPattern(text, patterns) {
    for (var index = 0; index < patterns.length; index += 1) {
      patterns[index].lastIndex = 0;
      var match = patterns[index].exec(text);
      if (match) {
        return {
          index: match.index,
          text: match[0]
        };
      }
    }
    return null;
  }

  function degreeFor(text, index) {
    var start = Math.max(0, index - 8);
    var end = Math.min(text.length, index + 14);
    var around = text.slice(start, end);
    if (/特别|非常|很|太|明显|严重|过头/.test(around)) {
      return 1.5;
    }
    if (/有点|稍微|一点点|一点|略微|略/.test(around)) {
      return 0.5;
    }
    return 1;
  }

  function addIntent(result, key, label, patterns, skip) {
    var hit = findPattern(result.normalized, patterns);
    if (!hit || (skip && skip(result.normalized, hit.index))) {
      return;
    }
    for (var index = 0; index < result.intents.length; index += 1) {
      if (result.intents[index].key === key) {
        result.intents[index].amount = Math.max(result.intents[index].amount, degreeFor(result.normalized, hit.index));
        return;
      }
    }
    result.intents.push({
      key: key,
      label: label,
      amount: degreeFor(result.normalized, hit.index),
      source: hit.text
    });
  }

  function getPreferredSlot(text) {
    var chinese = text.match(/第([一二三])套/);
    if (chinese) {
      return { 一: 0, 二: 1, 三: 2 }[chinese[1]];
    }
    var number = text.match(/第([123])套/);
    if (number) {
      return Number(number[1]) - 1;
    }
    var plan = text.match(/方案([abc])/);
    if (plan) {
      return { a: 0, b: 1, c: 2 }[plan[1]];
    }
    return null;
  }

  function parseFeedback(text) {
    var normalized = normalizeText(text);
    var result = {
      raw: String(text || ''),
      normalized: normalized,
      intents: [],
      preferredSlot: getPreferredSlot(normalized),
      keepStyle: false,
      keepColor: false,
      preserveWarm: false,
      preserveCool: false,
      preserveSaturation: false
    };

    if (!normalized) {
      result.canGenerate = false;
      return result;
    }

    result.preserveWarm = containsAny(normalized, [
      '不要变冷',
      '不想变冷',
      '不要更冷',
      '保持暖',
      '保留暖色',
      '暖色保留'
    ]);
    result.preserveCool = containsAny(normalized, [
      '不要变暖',
      '不想变暖',
      '不要更暖',
      '保持冷',
      '保留冷色',
      '冷色保留'
    ]);
    result.preserveSaturation = containsAny(normalized, [
      '不要降低饱和度',
      '不想降低饱和度',
      '不要降饱和',
      '不想降饱和',
      '饱和度保留'
    ]);
    result.keepColor = containsAny(normalized, [
      '颜色保留',
      '保留颜色',
      '色彩保留',
      '保留色彩'
    ]);
    result.keepStyle = result.preferredSlot !== null || containsAny(normalized, [
      '方向不错',
      '比较喜欢',
      '很喜欢',
      '保留这个感觉',
      '保留这套',
      '保留这个方向',
      '感觉保留',
      '只想让'
    ]);

    addIntent(result, 'tooWarm', '压低黄橙', [
      /太黄/,
      /偏黄/,
      /发黄/,
      /太橙/,
      /橙色.{0,3}重/,
      /肤色.{0,3}黄/,
      /太暖/,
      /偏暖/,
      /暖.{0,2}过头/,
      /有点暖/,
      /稍微暖/
    ]);
    addIntent(result, 'tooCool', '拉回冷色', [
      /太蓝/,
      /偏蓝/,
      /发蓝/,
      /太冷/,
      /偏冷/,
      /发冷/,
      /冷了/
    ]);
    addIntent(result, 'tooGreen', '清理绿色', [
      /绿色.{0,3}脏/,
      /绿.{0,2}脏/,
      /偏绿/,
      /发绿/,
      /太绿/,
      /荧光绿/
    ]);
    addIntent(result, 'skinRed', '降低肤色红感', [
      /人脸.{0,3}红/,
      /脸.{0,3}红/,
      /肤色.{0,3}红/,
      /人像.{0,3}红/,
      /发红/
    ]);
    addIntent(result, 'tooVivid', '降低艳度', [
      /太艳/,
      /颜色.{0,3}重/,
      /饱和度.{0,3}高/,
      /太浓/,
      /颜色.{0,3}浓/,
      /艳了/
    ]);
    addIntent(result, 'saturationDown', '降低饱和度', [
      /降低饱和/,
      /降.{0,3}饱和/,
      /少.{0,3}饱和/,
      /饱和度.{0,4}低一点/,
      /不那么艳/
    ], function (value) {
      return /不要|不想|不需要/.test(value.slice(Math.max(0, value.indexOf('饱和') - 5), value.indexOf('饱和') + 2));
    });
    addIntent(result, 'tooFlat', '增加影调层次', [
      /太灰/,
      /发灰/,
      /太平/,
      /没层次/,
      /寡淡/,
      /整体.{0,2}闷/,
      /有点闷/,
      /很闷/
    ]);
    addIntent(result, 'tooHard', '柔化反差', [
      /太硬/,
      /太数码/,
      /数码感/,
      /反差.{0,3}大/,
      /反差.{0,2}硬/,
      /过硬/
    ]);
    addIntent(result, 'highlight', '保护高光', [
      /高光.{0,3}亮/,
      /高光溢出/,
      /高光炸/,
      /天空白/,
      /灯牌溢出/,
      /过曝/,
      /亮部.{0,3}亮/
    ]);
    addIntent(result, 'shadow', '打开暗部', [
      /暗部.{0,3}(黑|暗|亮|打开)/,
      /太暗/,
      /死黑/,
      /堵黑/,
      /阴影.{0,3}重/,
      /脸部.{0,3}暗/
    ]);
    addIntent(result, 'moreFilm', '加强胶片质感', [
      /不够胶片/,
      /更胶片/,
      /不够复古/,
      /更复古/,
      /想要颗粒/,
      /颗粒感/
    ]);
    addIntent(result, 'moreClean', '提高清透度', [
      /不够清透/,
      /更清透/,
      /想要干净/,
      /更干净/,
      /更通透/,
      /通透一点/,
      /通透/
    ]);
    addIntent(result, 'moreNatural', '回到自然', [
      /想更自然/,
      /更自然/,
      /自然一点/,
      /自然耐看/
    ]);
    addIntent(result, 'moreAtmosphere', '增加氛围', [
      /想更有氛围/,
      /更有氛围/,
      /氛围感/
    ]);
    addIntent(result, 'moreCinema', '加强电影感', [
      /更电影/,
      /想更电影/,
      /电影感.{0,3}强/
    ]);
    addIntent(result, 'moreSoft', '变得柔和', [
      /更柔和/,
      /柔和一点/,
      /不够柔和/,
      /柔一点/
    ]);
    addIntent(result, 'moreRich', '增加浓郁度', [
      /更浓郁/,
      /浓郁一点/,
      /想更浓郁/,
      /颜色更重/
    ]);

    result.canGenerate = result.intents.length > 0;
    result.hasPreservation = result.keepStyle || result.keepColor ||
      result.preserveWarm || result.preserveCool || result.preserveSaturation;
    return result;
  }

  function uniquePush(list, value) {
    if (list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  function stepFor(amount) {
    return amount >= 1.4 ? 2 : 1;
  }

  function buildModifiers(parsed) {
    var modifiers = {
      wbR: 0,
      wbB: 0,
      color: 0,
      highlight: 0,
      shadow: 0,
      sharpness: 0,
      clarity: 0,
      monoWarmCool: 0,
      monoGreenMagenta: 0,
      forceDR: false,
      forceFilmGrain: false,
      forceCleanGrain: false,
      preferFilms: null,
      changes: []
    };

    parsed.intents.forEach(function (intent) {
      var step = stepFor(intent.amount);
      if (intent.key === 'tooWarm') {
        if (!parsed.preserveWarm) {
          modifiers.wbB += step;
          modifiers.monoWarmCool += step;
        }
        uniquePush(modifiers.changes, '压低黄橙，冷暖回到更干净的方向');
      }
      if (intent.key === 'tooCool') {
        if (!parsed.preserveCool) {
          modifiers.wbB -= step;
          modifiers.monoWarmCool -= step;
        }
        uniquePush(modifiers.changes, '减少冷蓝感，保留现场层次');
      }
      if (intent.key === 'tooGreen') {
        modifiers.wbR += step;
        modifiers.monoGreenMagenta += step;
        modifiers.color -= 1;
        uniquePush(modifiers.changes, '把绿色往更干净的洋红方向校正');
      }
      if (intent.key === 'skinRed') {
        modifiers.wbR -= step;
        if (!parsed.keepColor) {
          modifiers.color -= 1;
        }
        uniquePush(modifiers.changes, '降低肤色红感，避免脸部抢色');
      }
      if (intent.key === 'tooVivid') {
        if (!parsed.preserveSaturation) {
          modifiers.color -= step;
        }
        uniquePush(modifiers.changes, '降低过艳和过重的色彩');
      }
      if (intent.key === 'saturationDown') {
        if (!parsed.preserveSaturation) {
          modifiers.color -= step;
        }
        uniquePush(modifiers.changes, '整体饱和度下调一档');
      }
      if (intent.key === 'tooFlat') {
        modifiers.highlight += 1;
        modifiers.shadow += 1;
        modifiers.clarity += 1;
        if (!parsed.preserveSaturation) {
          modifiers.color += 1;
        }
        uniquePush(modifiers.changes, '增加影调层次和局部清晰度');
      }
      if (intent.key === 'tooHard') {
        modifiers.highlight -= 1;
        modifiers.shadow -= 1;
        modifiers.sharpness -= 1;
        modifiers.clarity -= 1;
        modifiers.preferFilms = ['ASTIA', 'ETERNA', 'PRO Neg. Std'];
        uniquePush(modifiers.changes, '柔化高光、暗部、锐度和清晰度');
      }
      if (intent.key === 'highlight') {
        modifiers.highlight -= 2;
        modifiers.forceDR = true;
        uniquePush(modifiers.changes, '降低高光并优先保护亮部');
      }
      if (intent.key === 'shadow') {
        modifiers.shadow += 2;
        modifiers.clarity += 1;
        uniquePush(modifiers.changes, '打开暗部，减少死黑和堵塞');
      }
      if (intent.key === 'moreFilm') {
        modifiers.forceFilmGrain = true;
        modifiers.clarity -= 1;
        modifiers.sharpness -= 1;
        modifiers.preferFilms = ['Classic Neg.', 'Classic Chrome', 'Nostalgic Neg.'];
        uniquePush(modifiers.changes, '加入颗粒和更明确的胶片取向');
      }
      if (intent.key === 'moreClean') {
        modifiers.forceCleanGrain = true;
        modifiers.clarity += 2;
        modifiers.sharpness += 1;
        modifiers.preferFilms = ['REALA ACE', 'PROVIA', 'ASTIA'];
        uniquePush(modifiers.changes, '关闭颗粒并提高通透和干净感');
      }
      if (intent.key === 'moreNatural') {
        if (!parsed.keepColor && !parsed.preserveSaturation) {
          modifiers.color -= 1;
        }
        modifiers.preferFilms = ['PROVIA', 'REALA ACE', 'ASTIA'];
        uniquePush(modifiers.changes, '把色彩拉回自然耐看');
      }
      if (intent.key === 'moreAtmosphere') {
        modifiers.clarity -= 1;
        modifiers.forceFilmGrain = true;
        modifiers.preferFilms = ['Classic Chrome', 'ETERNA', 'Classic Neg.'];
        uniquePush(modifiers.changes, '增加氛围和画面质感');
      }
      if (intent.key === 'moreCinema') {
        modifiers.clarity -= 1;
        modifiers.color -= 1;
        modifiers.preferFilms = ['ETERNA', 'Classic Chrome', 'Classic Neg.'];
        uniquePush(modifiers.changes, '往低饱和电影方向靠近');
      }
      if (intent.key === 'moreSoft') {
        modifiers.highlight -= 1;
        modifiers.shadow -= 1;
        modifiers.sharpness -= 1;
        modifiers.clarity -= 1;
        modifiers.preferFilms = ['ASTIA', 'ETERNA', 'PRO Neg. Std'];
        uniquePush(modifiers.changes, '降低过硬反差，保留柔和过渡');
      }
      if (intent.key === 'moreRich') {
        modifiers.color += 2;
        modifiers.preferFilms = ['Velvia', 'REALA ACE', 'Classic Chrome'];
        uniquePush(modifiers.changes, '强化饱和度和色彩存在感');
      }
    });

    return modifiers;
  }

  function collectImageMetrics(image) {
    var maxSide = 128;
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
    var warmPixels = 0;
    var coolPixels = 0;
    var bluePixels = 0;
    var greenPixels = 0;
    var regions = [];
    var regionRows = 3;
    var regionColumns = 3;
    var regionIndex;

    for (regionIndex = 0; regionIndex < regionRows * regionColumns; regionIndex += 1) {
      regions.push({
        count: 0,
        luma: 0,
        saturation: 0,
        warmBias: 0,
        greenBias: 0
      });
    }

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var pixelIndex = (y * width + x) * 4;
        var alpha = pixels[pixelIndex + 3] / 255;
        var red = pixels[pixelIndex] * alpha + 255 * (1 - alpha);
        var green = pixels[pixelIndex + 1] * alpha + 255 * (1 - alpha);
        var blue = pixels[pixelIndex + 2] * alpha + 255 * (1 - alpha);
        var pixelMax = Math.max(red, green, blue);
        var pixelMin = Math.min(red, green, blue);
        var luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        var saturation = pixelMax === 0 ? 0 : (pixelMax - pixelMin) / pixelMax;
        var warmBias = red - blue;
        var greenBias = green - (red + blue) / 2;
        var row = Math.min(regionRows - 1, Math.floor(y / height * regionRows));
        var column = Math.min(regionColumns - 1, Math.floor(x / width * regionColumns));
        var region = regions[row * regionColumns + column];

        sumR += red;
        sumG += green;
        sumB += blue;
        sumLuminance += luminance;
        sumLuminanceSquared += luminance * luminance;
        sumSaturation += saturation;
        region.count += 1;
        region.luma += luminance;
        region.saturation += saturation;
        region.warmBias += warmBias;
        region.greenBias += greenBias;

        if (luminance >= 230) {
          highlights += 1;
        }
        if (luminance <= 42) {
          shadows += 1;
        }
        if (warmBias >= 18) {
          warmPixels += 1;
        }
        if (warmBias <= -18) {
          coolPixels += 1;
        }
        if (blue > red + 16 && blue > green + 8) {
          bluePixels += 1;
        }
        if (green > red + 8 && green > blue + 8) {
          greenPixels += 1;
        }
      }
    }

    var averageLuminance = sumLuminance / count;
    var variance = Math.max(0, sumLuminanceSquared / count - averageLuminance * averageLuminance);
    var averageR = sumR / count;
    var averageG = sumG / count;
    var averageB = sumB / count;
    var regionalStats = regions.map(function (region) {
      return {
        luma: region.count ? region.luma / region.count : 0,
        saturation: region.count ? region.saturation / region.count : 0,
        warmBias: region.count ? region.warmBias / region.count : 0,
        greenBias: region.count ? region.greenBias / region.count : 0
      };
    });
    var lumaValues = regionalStats.map(function (region) { return region.luma; });
    var saturationValues = regionalStats.map(function (region) { return region.saturation; });
    var warmValues = regionalStats.map(function (region) { return region.warmBias; });

    return {
      averageLuminance: averageLuminance,
      contrast: Math.sqrt(variance),
      averageR: averageR,
      averageG: averageG,
      averageB: averageB,
      saturation: sumSaturation / count,
      highlightRatio: highlights / count,
      shadowRatio: shadows / count,
      warmRatio: warmPixels / count,
      coolRatio: coolPixels / count,
      blueRatio: bluePixels / count,
      greenRatio: greenPixels / count,
      warmBias: averageR - averageB,
      greenBias: averageG - (averageR + averageB) / 2,
      magentaBias: (averageR + averageB) / 2 - averageG,
      localBrightnessRange: Math.max.apply(null, lumaValues) - Math.min.apply(null, lumaValues),
      localSaturationRange: Math.max.apply(null, saturationValues) - Math.min.apply(null, saturationValues),
      localColorRange: Math.max.apply(null, warmValues) - Math.min.apply(null, warmValues),
      regions: regionalStats,
      sampleWidth: width,
      sampleHeight: height
    };
  }

  function classifyScene(metrics, subjectKey) {
    var lightLabel;
    var contrastLabel;
    var colorLabel;
    var temperatureLabel;
    var risks = [];

    if (metrics.averageLuminance < 72) {
      lightLabel = '暗部为主';
    } else if (metrics.highlightRatio > 0.05 && metrics.averageLuminance > 170) {
      lightLabel = '明亮、高光明显';
    } else if (metrics.contrast < 31) {
      lightLabel = '柔和散射光倾向';
    } else if (metrics.averageLuminance < 112 && metrics.contrast > 48) {
      lightLabel = '偏暗且有方向性光线';
    } else if (metrics.contrast > 66) {
      lightLabel = '方向性较强光线倾向';
    } else {
      lightLabel = '中等环境光';
    }

    if (metrics.contrast > 66 || (metrics.highlightRatio > 0.06 && metrics.shadowRatio > 0.12)) {
      contrastLabel = '高反差';
    } else if (metrics.contrast < 31) {
      contrastLabel = '低反差';
    } else {
      contrastLabel = '中反差';
    }

    if (metrics.greenRatio > 0.08 || (metrics.greenBias > 10 && metrics.greenBias > Math.abs(metrics.warmBias) * 0.45)) {
      colorLabel = '偏绿';
    } else if (metrics.warmRatio > 0.12 || metrics.warmBias > 18) {
      colorLabel = '偏暖';
    } else if (metrics.coolRatio > 0.12 || metrics.warmBias < -18) {
      colorLabel = '偏冷';
    } else if (metrics.magentaBias > 14) {
      colorLabel = '偏洋红';
    } else {
      colorLabel = '接近中性';
    }

    if (metrics.warmBias > 12) {
      temperatureLabel = '暖';
    } else if (metrics.warmBias < -12) {
      temperatureLabel = '冷';
    } else {
      temperatureLabel = '中性';
    }

    if (metrics.highlightRatio > 0.05) {
      risks.push('高光容易溢出');
    }
    if (metrics.shadowRatio > 0.17) {
      risks.push('暗部可能堵塞');
    }
    if (metrics.saturation > 0.48) {
      risks.push('环境色可能偏重');
    }
    if (metrics.greenRatio > 0.08) {
      risks.push('绿色占比偏高');
    }
    if (metrics.blueRatio > 0.12) {
      risks.push('蓝色占比偏高');
    }
    if (metrics.localBrightnessRange > 55) {
      risks.push('局部明暗差较大');
    }
    if (metrics.localColorRange > 24) {
      risks.push('不同区域色彩差异较大');
    }
    if (!risks.length) {
      risks.push('暂无明显单项风险');
    }

    return {
      subjectKey: subjectKey,
      subjectLabel: SUBJECT_LABELS[subjectKey] || SUBJECT_LABELS.other,
      lightLabel: lightLabel,
      contrastLabel: contrastLabel,
      colorLabel: colorLabel,
      temperatureLabel: temperatureLabel,
      risks: risks,
      confidence: '中（本地特征估计）',
      averageLuminance: metrics.averageLuminance,
      contrast: metrics.contrast,
      averageR: metrics.averageR,
      averageG: metrics.averageG,
      averageB: metrics.averageB,
      saturation: metrics.saturation,
      highlightRatio: metrics.highlightRatio,
      shadowRatio: metrics.shadowRatio,
      warmRatio: metrics.warmRatio,
      coolRatio: metrics.coolRatio,
      blueRatio: metrics.blueRatio,
      greenRatio: metrics.greenRatio,
      warmBias: metrics.warmBias,
      greenBias: metrics.greenBias,
      localBrightnessRange: metrics.localBrightnessRange,
      localSaturationRange: metrics.localSaturationRange,
      localColorRange: metrics.localColorRange,
      sampleWidth: metrics.sampleWidth,
      sampleHeight: metrics.sampleHeight
    };
  }

  function resolveProfileKey(lookKey, subjectKey, analysis) {
    if (lookKey !== 'auto') {
      return lookKey;
    }
    if (subjectKey === 'night' || analysis.averageLuminance < 66) {
      return 'cinema';
    }
    if ((subjectKey === 'landscape' || subjectKey === 'architecture') && analysis.saturation > 0.42) {
      return 'vivid';
    }
    if (subjectKey === 'portrait' && analysis.warmRatio > 0.16) {
      return 'warm';
    }
    if (analysis.contrast < 31) {
      return 'clean';
    }
    return 'natural';
  }

  function axisValue(value, positiveLabel, negativeLabel) {
    if (value === 0) {
      return '0';
    }
    return (value > 0 ? positiveLabel : negativeLabel) + ' ' + Math.abs(value);
  }

  function monoColorText(warmCool, greenMagenta) {
    return 'WARM ↔ COOL：' + axisValue(warmCool, 'COOL +', 'WARM -') +
      '；G ↔ M：' + axisValue(greenMagenta, 'M +', 'G -');
  }

  function grainRank(grain) {
    if (grain === '强') {
      return 2;
    }
    if (grain === '弱') {
      return 1;
    }
    return 0;
  }

  function selectFilms(profile, modifiers, round, previousOutput, parsed) {
    var source = (modifiers.preferFilms || profile.films).slice();
    var anchorFilm = null;
    var preserveAnchor = parsed.keepStyle || parsed.preserveWarm || parsed.preserveCool || parsed.keepColor;
    var anchorIndex = parsed.preferredSlot === null ? 1 : parsed.preferredSlot;
    if (previousOutput && preserveAnchor &&
        previousOutput.recipes[anchorIndex] &&
        previousOutput.recipes[anchorIndex].kind === profile.type) {
      anchorFilm = previousOutput.recipes[anchorIndex].filmSimulation;
      if (source.indexOf(anchorFilm) === -1) {
        source.unshift(anchorFilm);
      }
    }
    if (profile.type === 'bw') {
      source = profile.films.slice();
    }

    var offset = source.length > 1 ? (round - 1) % source.length : 0;
    var films = [];
    for (var slot = 0; slot < 3; slot += 1) {
      films.push(source[(slot + offset) % source.length]);
    }
    if (anchorFilm) {
      films[1] = anchorFilm;
    }

    for (var index = 0; index < films.length; index += 1) {
      for (var next = 0; next < source.length; next += 1) {
        if (films.indexOf(films[index]) === index) {
          break;
        }
        var candidate = source[(next + offset + index) % source.length];
        if (films.indexOf(candidate) === -1) {
          films[index] = candidate;
          break;
        }
      }
    }
    return films;
  }

  function buildRecipeName(recipe, subjectKey) {
    var filmName = {
      PROVIA: '自然基准',
      'REALA ACE': '清透色彩',
      ASTIA: '柔和人像',
      'Classic Chrome': '克制胶片',
      'Classic Neg.': '复古街拍',
      'Nostalgic Neg.': '暖调复古',
      ETERNA: '柔和电影',
      Velvia: '浓郁风景',
      'PRO Neg. Std': '人像自然',
      ACROS: '黑白层次',
      'ACROS+Ye FILTER': '黑白晴光',
      'ACROS+R FILTER': '黑白高光',
      'ACROS+G FILTER': '黑白细节'
    }[recipe.filmSimulation] || recipe.filmSimulation;
    var temperature;
    var color;
    var contrast;
    var texture;
    var toneSummary;
    var subjectSuffix = '';

    if (recipe.kind === 'bw') {
      temperature = recipe.monoWarmCool >= 2 ? '偏冷' : recipe.monoWarmCool <= -2 ? '偏暖' : '中性';
      color = recipe.monoGreenMagenta >= 2 ? '偏洋红' : recipe.monoGreenMagenta <= -2 ? '偏绿' : '中性';
      toneSummary = temperature + (color === '中性' ? '' : color);
    } else {
      temperature = recipe.wbB >= 2 ? '冷调' : recipe.wbB <= -2 ? '暖调' : recipe.wbR >= 2 ? '红润' : recipe.wbR <= -2 ? '青绿' : '中性';
      color = recipe.color <= -2 ? '低饱和' : recipe.color >= 2 ? '浓郁' : recipe.color === -1 ? '克制' : recipe.color === 1 ? '饱满' : '自然';
      toneSummary = temperature + color;
    }

    if (recipe.highlight <= -1 && recipe.shadow <= -1) {
      contrast = '柔和反差';
    } else if (recipe.highlight >= 1 && recipe.shadow >= 1) {
      contrast = '高反差层次';
    } else if (recipe.shadow >= 1) {
      contrast = '暗部通透';
    } else {
      contrast = '平衡影调';
    }

    texture = recipe.grain === '强' ? '强颗粒' : recipe.grain === '弱' ? '细颗粒' : '颗粒关闭';
    if (recipe.kind === 'color' && recipe.clarity >= 2 && recipe.grain === '关闭') {
      contrast = '清透影调';
    }
    if (subjectKey === 'portrait' && recipe.kind === 'color' && recipe.filmSimulation === 'ASTIA') {
      subjectSuffix = '人像';
    } else if (subjectKey === 'landscape' && recipe.filmSimulation === 'Velvia') {
      subjectSuffix = '风景';
    }

    var parts = [filmName];
    if (subjectSuffix && filmName.indexOf(subjectSuffix) === -1) {
      parts.push(subjectSuffix);
    }
    parts.push(toneSummary);
    parts.push(contrast);
    parts.push(texture);
    return parts.join(' · ');
  }

  function buildRiskNote(recipe, analysis) {
    var notes = [];
    if (recipe.highlight <= -1) {
      notes.push('亮部更保守');
    }
    if (recipe.shadow >= 1) {
      notes.push('暗部更开放');
    }
    if (recipe.grain === '强') {
      notes.push('颗粒存在感较强');
    }
    if (analysis.localBrightnessRange > 55 && recipe.dynamicRange === 'DR100') {
      notes.push('局部反差大时需留意亮部');
    }
    if (!notes.length) {
      notes.push('建议先拍一张确认色彩和影调');
    }
    return notes.join('；') + '。';
  }

  function getExposureAdvice(analysis, recipe, subjectKey) {
    if (analysis.highlightRatio > 0.05 || (analysis.contrastLabel === '高反差' && recipe.highlight <= -1)) {
      return '建议稍微欠曝一点，优先保护天空和高光。';
    }
    if (analysis.averageLuminance < 72 || (subjectKey === 'portrait' && analysis.shadowRatio > 0.15)) {
      return '建议稍微过曝一点，让人物肤色和阴影更通透。';
    }
    return '正常曝光。';
  }

  function buildQuickLine(recipe) {
    var parts;
    if (recipe.kind === 'bw') {
      parts = [
        '【' + recipe.name + '】',
        '胶片模拟：' + recipe.filmSimulation,
        '动态范围：' + recipe.dynamicRange,
        '动态范围优先：关闭',
        '高光：' + recipe.highlight,
        '阴影：' + recipe.shadow,
        '锐度：' + recipe.sharpness,
        '高 ISO 降噪：' + recipe.noiseReduction,
        '清晰度：' + recipe.clarity,
        '颗粒效果：' + recipe.grain,
        '颗粒大小：' + recipe.grainSize,
        'MONOCHROMATIC COLOR：' + recipe.monoColor,
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
        '清晰度：' + recipe.clarity,
        '颗粒效果：' + recipe.grain,
        '颗粒大小：' + recipe.grainSize,
        '色彩效果：' + recipe.colorChrome,
        '彩色FX蓝色：' + recipe.fxBlue,
        'ISO：' + recipe.iso
      ];
    }
    return parts.join('；') + '。';
  }

  function buildRecipe(slot, film, analysis, profile, modifiers, round, parsed, previousRecipe, subjectKey) {
    var isBw = profile.type === 'bw';
    var highContrast = analysis.contrastLabel === '高反差' || analysis.highlightRatio > 0.06;
    var lowContrast = analysis.contrastLabel === '低反差';
    var darkScene = analysis.averageLuminance < 80;
    var highlightRisk = analysis.highlightRatio > 0.05;
    var shadowRisk = analysis.shadowRatio > 0.17;
    var slotDelta = [-1, 0, 1][slot];
    var useAnchor = Boolean(previousRecipe && slot === 1 &&
      (parsed.keepStyle || parsed.preserveWarm || parsed.preserveCool || parsed.keepColor) &&
      previousRecipe.kind === profile.type);
    var highlight = highContrast || highlightRisk ? -2 + slot : lowContrast ? -1 + slot : slotDelta;
    var shadow = darkScene || shadowRisk ? -2 + slot : lowContrast ? slotDelta : slotDelta;
    var dynamicRange = highlightRisk || highContrast || modifiers.forceDR ? (slot === 2 ? 'DR400' : 'DR200') : 'DR100';
    var wbR = 0;
    var wbB = 0;
    var color;
    var sharpness;
    var clarity;
    var grain;
    var colorChrome;
    var fxBlue;
    var monoWarmCool;
    var monoGreenMagenta;

    if (analysis.colorLabel === '偏暖') {
      wbB += 1 + (2 - slot);
    }
    if (analysis.colorLabel === '偏冷') {
      wbB -= 1 + (2 - slot);
    }
    if (analysis.colorLabel === '偏绿') {
      wbR += 1 + (2 - slot);
    }
    if (analysis.colorLabel === '偏洋红') {
      wbR -= 1 + (2 - slot);
    }
    if (profile.key === 'warm') {
      wbB -= slot === 2 ? 2 : 1;
    }

    color = profile.colorBase + (analysis.saturation > 0.48 ? -1 : 0) + slotDelta;
    sharpness = profile.sharpBase + (darkScene ? -1 : 0) + slotDelta;
    clarity = profile.clarityBase + slotDelta;
    grain = profile.grainModes[slot];
    colorChrome = profile.chromeModes[slot];
    fxBlue = profile.fxModes[slot];
    monoWarmCool = slot === 0 ? 0 : slot === 1 ? -1 : 1;
    monoGreenMagenta = slot === 0 ? 0 : slot === 1 ? 1 : -1;

    if (useAnchor) {
      dynamicRange = previousRecipe.dynamicRange;
      wbR = previousRecipe.wbR || 0;
      wbB = previousRecipe.wbB || 0;
      color = previousRecipe.color === undefined ? color : previousRecipe.color;
      sharpness = previousRecipe.sharpness;
      clarity = previousRecipe.clarity;
      grain = previousRecipe.grain;
      colorChrome = previousRecipe.colorChrome || '关闭';
      fxBlue = previousRecipe.fxBlue || '关闭';
      monoWarmCool = previousRecipe.monoWarmCool || 0;
      monoGreenMagenta = previousRecipe.monoGreenMagenta || 0;
    }

    wbR = clamp(intValue(wbR + modifiers.wbR), -9, 9);
    wbB = clamp(intValue(wbB + modifiers.wbB), -9, 9);
    highlight = clamp(intValue(highlight + modifiers.highlight), -2, 4);
    shadow = clamp(intValue(shadow + modifiers.shadow), -2, 4);
    color = clamp(intValue(color + modifiers.color), -4, 4);
    sharpness = clamp(intValue(sharpness + modifiers.sharpness), -4, 4);
    clarity = clamp(intValue(clarity + modifiers.clarity), -5, 5);
    monoWarmCool = clamp(intValue(monoWarmCool + modifiers.monoWarmCool), -9, 9);
    monoGreenMagenta = clamp(intValue(monoGreenMagenta + modifiers.monoGreenMagenta), -9, 9);

    if (modifiers.forceCleanGrain) {
      grain = '关闭';
      colorChrome = '关闭';
      fxBlue = '关闭';
    }
    if (modifiers.forceFilmGrain) {
      grain = slot === 0 ? '弱' : '强';
      colorChrome = slot === 0 ? '弱' : '强';
    }

    var grainSize = grain === '关闭' ? '—' : grain === '强' ? '大' : '小';
    var recipe = {
      kind: isBw ? 'bw' : 'color',
      code: SLOT_META[slot].code,
      filmSimulation: film,
      dynamicRange: dynamicRange,
      highlight: highlight,
      shadow: shadow,
      sharpness: sharpness,
      noiseReduction: clamp(-2 + (darkScene ? 1 : 0) + (slot === 2 ? 1 : 0), -4, 4),
      clarity: clarity,
      grain: grain,
      grainSize: grainSize,
      iso: dynamicRange === 'DR100' ? '自动' : '自动（配合 ' + dynamicRange + '）',
      role: SLOT_META[slot].role,
      risk: '',
      exposureAdvice: '',
      changeNote: '',
      monoWarmCool: monoWarmCool,
      monoGreenMagenta: monoGreenMagenta
    };

    if (isBw) {
      recipe.monoColor = monoColorText(monoWarmCool, monoGreenMagenta);
    } else {
      recipe.wbR = wbR;
      recipe.wbB = wbB;
      recipe.color = color;
      recipe.colorChrome = colorChrome;
      recipe.fxBlue = fxBlue;
    }

    recipe.name = buildRecipeName(recipe, subjectKey);
    recipe.risk = buildRiskNote(recipe, analysis);
    recipe.exposureAdvice = getExposureAdvice(analysis, recipe, subjectKey);
    recipe.changeNote = round === 1
      ? SLOT_META[slot].change
      : '针对“' + parsed.raw + '”：' + modifiers.changes.join('；') + '。';
    recipe.quickLine = buildQuickLine(recipe);
    return recipe;
  }

  function ensureUniqueNames(recipes) {
    var suffixes = ['稳妥', '平衡', '强化'];
    for (var index = 0; index < recipes.length; index += 1) {
      for (var previous = 0; previous < index; previous += 1) {
        if (recipes[index].name === recipes[previous].name) {
          recipes[index].name += ' · ' + suffixes[index];
          recipes[index].quickLine = buildQuickLine(recipes[index]);
        }
      }
    }
  }

  function buildOutput(analysis, lookKey, subjectKey, round, feedbackText, previousOutput) {
    var profileKey = resolveProfileKey(lookKey, subjectKey, analysis);
    var profile = STYLE_PROFILES[profileKey] || STYLE_PROFILES.natural;
    var parsed = parseFeedback(feedbackText);
    var modifiers = buildModifiers(parsed);
    var films = selectFilms(profile, modifiers, round, previousOutput, parsed);
    var recipes = films.map(function (film, index) {
      var previousRecipe = null;
      if (previousOutput && (parsed.keepStyle || parsed.preserveWarm || parsed.preserveCool || parsed.keepColor)) {
        if (index === 1 && parsed.preferredSlot !== null) {
          previousRecipe = previousOutput.recipes[parsed.preferredSlot] || null;
        } else if (index < previousOutput.recipes.length) {
          previousRecipe = previousOutput.recipes[index];
        }
      }
      return buildRecipe(index, film, analysis, profile, modifiers, round, parsed, previousRecipe, subjectKey);
    });

    ensureUniqueNames(recipes);
    return {
      profile: profile,
      profileKey: profileKey,
      targetLabel: lookKey === 'auto' ? '自动推荐 · ' + profile.label : LOOK_LABELS[lookKey],
      parsed: parsed,
      modifiers: modifiers,
      feedbackSummary: modifiers.changes.length ? modifiers.changes.join('、') : '现场基准与目标感觉',
      recipes: recipes
    };
  }

  function percent(value) {
    return Math.round(value * 100) + '%';
  }

  function rgbText(analysis) {
    return 'R' + Math.round(analysis.averageR) + ' G' + Math.round(analysis.averageG) + ' B' + Math.round(analysis.averageB);
  }

  function renderAnalysis() {
    var analysis = state.analysis;
    var targetText = LOOK_LABELS[state.lookKey] || LOOK_LABELS.auto;
    var summary = analysis.lightLabel + '，' + analysis.contrastLabel + '，' + analysis.colorLabel + '。';

    elements.sceneSummary.innerHTML =
      '<p class="summary-label">本地特征摘要</p>' +
      '<p class="summary-text">' + escapeHtml(summary) + '</p>' +
      '<p class="summary-subtext">主体：' + escapeHtml(analysis.subjectLabel) +
      '<br />目标感觉：' + escapeHtml(targetText) +
      '<br />主要风险：' + escapeHtml(analysis.risks.join('、')) + '</p>';

    var metrics = [
      { label: '整体亮度', value: Math.round(analysis.averageLuminance / 255 * 100) + '%' },
      { label: '高光比例', value: percent(analysis.highlightRatio) },
      { label: '暗部比例', value: percent(analysis.shadowRatio) },
      { label: '整体反差', value: Math.round(analysis.contrast) + ' /255' },
      { label: 'RGB 色偏', value: rgbText(analysis) },
      { label: '整体饱和度', value: percent(analysis.saturation) },
      { label: '冷暖倾向', value: analysis.temperatureLabel + ' · 暖' + percent(analysis.warmRatio) + ' / 冷' + percent(analysis.coolRatio) },
      { label: '蓝 / 绿占比', value: percent(analysis.blueRatio) + ' / ' + percent(analysis.greenRatio) },
      { label: '局部亮度差', value: Math.round(analysis.localBrightnessRange) + ' /255' },
      { label: '局部色彩差', value: Math.round(analysis.localColorRange) + ' /255' },
      { label: '判断置信度', value: analysis.confidence }
    ];

    elements.metricGrid.innerHTML = metrics.map(function (metric) {
      return '<div class="metric"><span class="metric-label">' + escapeHtml(metric.label) +
        '</span><strong class="metric-value">' + escapeHtml(metric.value) + '</strong></div>';
    }).join('');

    elements.analysisNote.textContent =
      '照片只在本地设备进行 Canvas/JavaScript 特征分析：包含整体与分区亮度、反差、RGB、饱和度、冷暖以及蓝绿暖色占比。不上传照片；指标是估计值，主体和感觉由你的选择补充。';
  }

  function renderRecipeCard(recipe, index) {
    var rows;
    if (recipe.kind === 'bw') {
      rows = [
        ['胶片模拟', recipe.filmSimulation],
        ['动态范围', recipe.dynamicRange],
        ['动态范围优先', '关闭'],
        ['高光', recipe.highlight],
        ['阴影', recipe.shadow],
        ['锐度', recipe.sharpness],
        ['高 ISO 降噪', recipe.noiseReduction],
        ['清晰度', recipe.clarity],
        ['颗粒效果', recipe.grain],
        ['颗粒大小', recipe.grainSize],
        ['MONOCHROMATIC COLOR', recipe.monoColor],
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
        ['清晰度', recipe.clarity],
        ['颗粒效果', recipe.grain],
        ['颗粒大小', recipe.grainSize],
        ['色彩效果', recipe.colorChrome],
        ['彩色FX蓝色', recipe.fxBlue],
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
      '<p><strong>【拍摄曝光建议】：</strong>' + escapeHtml(recipe.exposureAdvice) + '</p>' +
      '<p class="quick-line" tabindex="0">' + escapeHtml(recipe.quickLine) + '</p>' +
      '<p class="copy-hint">长按或拖选上面一行，手动复制到备忘录。</p>' +
      '</div>' +
      '</article>';
  }

  function renderResults() {
    var output = state.output;
    renderAnalysis();
    elements.roundBadge.textContent = '第 ' + state.round + ' 轮';
    elements.recipeContext.textContent = '主体：' + state.analysis.subjectLabel +
      ' · 目标：' + output.targetLabel;
    elements.recipesGrid.innerHTML = output.recipes.map(renderRecipeCard).join('');
    elements.resultsSection.hidden = false;
  }

  function getCurrentInputs() {
    return {
      subjectKey: elements.subjectSelect.value,
      lookKey: elements.lookSelect.value
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
      state.subjectKey = inputs.subjectKey;
      state.lookKey = inputs.lookKey;
      state.analysis = classifyScene(metrics, state.subjectKey);
      state.round = 1;
      state.output = buildOutput(state.analysis, state.lookKey, state.subjectKey, state.round, '', null);
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
      setMessage(elements.feedbackMessage, '请写出具体原因，或点击上面的快捷反馈。', 'error');
      return;
    }

    var parsed = parseFeedback(feedback);
    if (!parsed.canGenerate) {
      setMessage(elements.feedbackMessage, '这句话暂时无法可靠解析；请点击快捷反馈，或补充颜色、明暗、反差、颗粒、清透度和风格方向。', 'error');
      return;
    }

    var inputs = getCurrentInputs();
    state.subjectKey = inputs.subjectKey;
    state.lookKey = inputs.lookKey;
    state.round += 1;
    state.output = buildOutput(state.analysis, state.lookKey, state.subjectKey, state.round, feedback, state.output);
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
