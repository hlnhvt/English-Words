$env:ANTHROPIC_API_KEY = "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"
$logPath = "d:\English-Words\scripts\enrich_log.txt"
$wordsPath = "d:\English-Words\public\data\words.json"
$scriptPath = "d:\English-Words\scripts\test_enrich.py"

Set-Location "d:\English-Words"

$run = 1
while ($true) {
    $remaining = node -e "const w=require('./public/data/words.json'); console.log(w.filter(x=>!x.meaning_vi_detail||!x.examples||x.examples.length===0).length);" 2>&1
    $remaining = [int]($remaining.Trim())

    if ($remaining -eq 0) {
        Write-Output "$(Get-Date -Format 'HH:mm:ss') All words enriched! Done."
        break
    }

    Write-Output "$(Get-Date -Format 'HH:mm:ss') Run #$run — $remaining words remaining. Starting..."
    $proc = Start-Process python -ArgumentList $scriptPath -PassThru -Wait -RedirectStandardOutput $logPath -RedirectStandardError $logPath
    $exitCode = $proc.ExitCode

    $done = node -e "const w=require('./public/data/words.json'); console.log(w.filter(x=>x.meaning_vi_detail).length);" 2>&1
    Write-Output "$(Get-Date -Format 'HH:mm:ss') Run #$run ended (exit=$exitCode). Enriched so far: $($done.Trim())/4908"
    $run++

    Start-Sleep -Seconds 3
}
