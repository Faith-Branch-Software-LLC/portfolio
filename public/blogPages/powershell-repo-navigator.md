---
title: Navigating Repos Faster with PowerShell
description: A two-function PowerShell setup for navigating to repos with an interactive arrow-key menu
date: 2026-04-27
tags:
  - powershell
  - productivity
  - terminal
  - workflow
published: "true"
---
# Navigating Repos Faster with PowerShell

I have a lot of repos, and they're organized into groups. `cd`-ing into them every time was getting old, especially since they are not located on my `C:` drive. so I wrote two PowerShell functions that let me navigate to any repo with arrow keys and Enter.

---

## The Result

Type `repos` in your terminal. A menu appears. Arrow up/down to pick a group, hit Enter. Another menu for the repo. Hit Enter again. You're there.

```bash
Select group:

  > FaithBranch
    Personal
    School
```

---

## The Code

Drop these in your PowerShell profile (`$PROFILE`).

```powershell
function Invoke-Menu {
    param([string[]]$Items, [string]$Prompt = "Select:")
    $selected = 0
    while ($true) {
        Clear-Host
        Write-Host "$Prompt`n" -ForegroundColor Cyan
        for ($i = 0; $i -lt $Items.Count; $i++) {
            if ($i -eq $selected) {
                Write-Host "  > $($Items[$i])" -ForegroundColor Yellow
            } else {
                Write-Host "    $($Items[$i])"
            }
        }
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        switch ($key.VirtualKeyCode) {
            38 { if ($selected -gt 0) { $selected-- } }                      # Up
            40 { if ($selected -lt $Items.Count - 1) { $selected++ } }       # Down
            13 { return $Items[$selected] }                                   # Enter
            27 { return $null }                                               # Escape
        }
    }
}

function repos {
    $root = "E:/repos"

    # Layer 1: top-level folders
    $layer1 = Get-ChildItem -Path $root -Directory | Select-Object -ExpandProperty Name
    $choice1 = Invoke-Menu -Items $layer1 -Prompt "Select group:"
    if (-not $choice1) { Clear-Host; return }

    # Layer 2: sub-folders
    $layer2Path = Join-Path $root $choice1
    $layer2 = Get-ChildItem -Path $layer2Path -Directory | Select-Object -ExpandProperty Name
    $choice2 = Invoke-Menu -Items $layer2 -Prompt "Select repo:"
    if (-not $choice2) { Clear-Host; return }

    $finalPath = Join-Path $layer2Path $choice2
    Clear-Host
    Set-Location $finalPath
    Write-Host "-> $finalPath" -ForegroundColor Green
}
```

---

## How It Works

`Invoke-Menu` is a reusable interactive menu. It reads raw key input with no `Enter` needed to move the cursor. Virtual key codes `38` and `40` are arrow up/down. `13` is Enter, `27` is Escape. It clears and redraws the screen on every keypress, highlighting the selected item in yellow.

`repos` calls `Invoke-Menu` twice, once for the top-level group folder, once for the repo inside it. Then `Set-Location` to move you to the correct spot.

---

## Setup

1. Open your profile: `notepad $PROFILE`
2. Paste both functions
3. Update `$root` to match your repos directory
4. Save and reload: `. $PROFILE`

Escape at any point cancels out cleanly. Add more layers if your structure goes deeper.
