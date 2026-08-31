param(
  [Parameter(Mandatory=$true)][string]$SourcePath,
  [Parameter(Mandatory=$true)][string]$OutputPath,
  [string]$MappingCsv,
  [switch]$MakeContactSheets,
  [switch]$CopyAndRename,
  [switch]$RenameExisting,
  [switch]$Validate,
  [switch]$MakePreview
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$ImageExtensions = @('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp')

function Get-ImageFiles([string]$Path) {
  Get-ChildItem -LiteralPath $Path -File |
    Where-Object { $ImageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name
}

function Apply-ExifOrientation([System.Drawing.Image]$Image) {
  try {
    if ($Image.PropertyIdList -contains 274) {
      $orientation = [BitConverter]::ToUInt16($Image.GetPropertyItem(274).Value, 0)
      switch ($orientation) {
        2 { $Image.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
        3 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        4 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
        5 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
        6 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        7 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
        8 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
  } catch {}
}

function Get-OrientedType([string]$Path) {
  $img = [System.Drawing.Image]::FromFile($Path)
  $w = $img.Width
  $h = $img.Height
  $orientation = 1
  try {
    if ($img.PropertyIdList -contains 274) {
      $orientation = [BitConverter]::ToUInt16($img.GetPropertyItem(274).Value, 0)
    }
  } catch {}
  $img.Dispose()
  if ($orientation -in 5, 6, 7, 8) {
    $tmp = $w; $w = $h; $h = $tmp
  }
  if ($w -ge $h) { return 'H' }
  return 'V'
}

function Draw-Thumb($Graphics, [string]$Path, [int]$X, [int]$Y, [int]$ThumbW, [int]$ThumbH) {
  $img = [System.Drawing.Image]::FromFile($Path)
  Apply-ExifOrientation $img
  $scale = [Math]::Min($ThumbW / $img.Width, $ThumbH / $img.Height)
  $w = [int]($img.Width * $scale)
  $h = [int]($img.Height * $scale)
  $dx = $X + [int](($ThumbW - $w) / 2)
  $dy = $Y + [int](($ThumbH - $h) / 2)
  $Graphics.DrawImage($img, $dx, $dy, $w, $h)
  $img.Dispose()
}

function New-ContactSheets {
  $outDir = Join-Path $OutputPath 'contact_sheets'
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $files = @(Get-ImageFiles $SourcePath)
  $thumbW = 360; $thumbH = 270; $labelH = 34; $cols = 4; $rows = 5; $pad = 12
  $font = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $white = [System.Drawing.Brushes]::White
  $black = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20,20,20))
  $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,245,245))
  $sheetCount = [Math]::Ceiling($files.Count / ($cols * $rows))

  for ($sheetIdx = 0; $sheetIdx -lt $sheetCount; $sheetIdx++) {
    $sheetW = $cols * ($thumbW + $pad) + $pad
    $sheetH = $rows * ($thumbH + $labelH + $pad) + $pad
    $sheet = New-Object System.Drawing.Bitmap($sheetW, $sheetH)
    $g = [System.Drawing.Graphics]::FromImage($sheet)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::White)

    for ($i = 0; $i -lt ($cols * $rows); $i++) {
      $idx = $sheetIdx * ($cols * $rows) + $i
      if ($idx -ge $files.Count) { break }
      $file = $files[$idx]
      $r = [Math]::Floor($i / $cols)
      $c = $i % $cols
      $x = $pad + $c * ($thumbW + $pad)
      $y = $pad + $r * ($thumbH + $labelH + $pad)
      $g.FillRectangle($bgBrush, $x, $y, $thumbW, $thumbH)
      Draw-Thumb $g $file.FullName $x $y $thumbW $thumbH
      $g.FillRectangle($black, $x, $y + $thumbH, $thumbW, $labelH)
      $g.DrawString($file.Name, $font, $white, ($x + 8), ($y + $thumbH + 8))
    }

    $path = Join-Path $outDir ('contact_sheet_{0:D2}.jpg' -f ($sheetIdx + 1))
    $sheet.Save($path, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $g.Dispose(); $sheet.Dispose()
    Write-Output $path
  }

  $font.Dispose(); $black.Dispose(); $bgBrush.Dispose()
}

function Read-Mapping {
  if (-not $MappingCsv) { throw 'MappingCsv is required for rename operations.' }
  if (-not (Test-Path -LiteralPath $MappingCsv)) { throw "MappingCsv not found: $MappingCsv" }
  Import-Csv -LiteralPath $MappingCsv
}

function Invoke-CopyAndRename {
  $finalDir = Join-Path $OutputPath 'final_grouped'
  New-Item -ItemType Directory -Force -Path $finalDir | Out-Null
  $mapping = @(Read-Mapping)
  foreach ($row in $mapping) {
    $src = Join-Path $SourcePath $row.source
    $dst = Join-Path $finalDir $row.target
    if (-not (Test-Path -LiteralPath $src)) { throw "Source image missing: $src" }
    Copy-Item -LiteralPath $src -Destination $dst -Force
  }
  Write-Output $finalDir
}

function Invoke-RenameExisting {
  $mapping = @(Read-Mapping)
  foreach ($row in $mapping) {
    $src = Join-Path $SourcePath $row.source
    if (-not (Test-Path -LiteralPath $src)) { throw "Existing image missing: $src" }
    $tmp = Join-Path $SourcePath ('__tmp__' + $row.target)
    Move-Item -LiteralPath $src -Destination $tmp -Force
  }
  foreach ($row in $mapping) {
    $tmp = Join-Path $SourcePath ('__tmp__' + $row.target)
    $dst = Join-Path $SourcePath $row.target
    Move-Item -LiteralPath $tmp -Destination $dst -Force
  }
  Write-Output $SourcePath
}

function Get-FinalDir {
  if ($RenameExisting) { return $SourcePath }
  $candidate = Join-Path $OutputPath 'final_grouped'
  if (Test-Path -LiteralPath $candidate) { return $candidate }
  return $OutputPath
}

function Test-FinalGroups {
  $dir = Get-FinalDir
  $files = @(Get-ImageFiles $dir)
  $bad = New-Object System.Collections.Generic.List[string]
  if ($files.Count -ne 27) { $bad.Add("Expected 27 images, found $($files.Count).") }
  for ($g = 1; $g -le 9; $g++) {
    $group = @()
    foreach ($f in $files) {
      if ($f.BaseName -match "^$g(?:-(\d+))?$") { $group += $f }
    }
    if ($group.Count -eq 0) {
      $bad.Add("Group $g is missing.")
      continue
    }
    if (($group.Count % 2) -eq 0) { $bad.Add("Group $g has an even count: $($group.Count).") }
    if ($group.Count -gt 5) { $bad.Add("Group $g has more than 5 images: $($group.Count).") }
    $types = @($group | ForEach-Object { Get-OrientedType $_.FullName } | Sort-Object -Unique)
    if ($types.Count -gt 1) { $bad.Add("Group $g mixes vertical and horizontal images.") }
  }
  if ($bad.Count -gt 0) { throw ($bad -join [Environment]::NewLine) }
  Write-Output "Validation passed: $dir"
}

function New-FinalPreview {
  $dir = Get-FinalDir
  $files = @(Get-ImageFiles $dir | Sort-Object {
    if ($_.BaseName -match '^(\d+)(?:-(\d+))?$') { [int]$Matches[1] } else { 999 }
  }, {
    if ($_.BaseName -match '^(\d+)(?:-(\d+))?$' -and $Matches[2]) { [int]$Matches[2] } else { 0 }
  })
  $preview = Join-Path $OutputPath 'final_grouped_preview.jpg'
  if ($RenameExisting) { $preview = Join-Path $dir 'final_grouped_preview.jpg' }
  $thumbW = 360; $thumbH = 480; $labelH = 32; $cols = 3; $pad = 12
  $rows = [Math]::Ceiling($files.Count / $cols)
  $font = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $white = [System.Drawing.Brushes]::White
  $black = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20,20,20))
  $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,245,245))
  $sheet = New-Object System.Drawing.Bitmap(($cols * ($thumbW + $pad) + $pad), ($rows * ($thumbH + $labelH + $pad) + $pad))
  $g = [System.Drawing.Graphics]::FromImage($sheet)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::White)

  for ($i = 0; $i -lt $files.Count; $i++) {
    $file = $files[$i]
    $r = [Math]::Floor($i / $cols)
    $c = $i % $cols
    $x = $pad + $c * ($thumbW + $pad)
    $y = $pad + $r * ($thumbH + $labelH + $pad)
    $g.FillRectangle($bgBrush, $x, $y, $thumbW, $thumbH)
    Draw-Thumb $g $file.FullName $x $y $thumbW $thumbH
    $g.FillRectangle($black, $x, $y + $thumbH, $thumbW, $labelH)
    $g.DrawString($file.Name, $font, $white, ($x + 8), ($y + $thumbH + 8))
  }

  $sheet.Save($preview, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $g.Dispose(); $sheet.Dispose(); $font.Dispose(); $black.Dispose(); $bgBrush.Dispose()
  Write-Output $preview
}

New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
if ($MakeContactSheets) { New-ContactSheets }
if ($CopyAndRename) { Invoke-CopyAndRename }
if ($RenameExisting) { Invoke-RenameExisting }
if ($Validate) { Test-FinalGroups }
if ($MakePreview) { New-FinalPreview }
