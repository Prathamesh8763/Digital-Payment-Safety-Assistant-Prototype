$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

$venvPython = Join-Path $scriptDir "backend\.venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    & $venvPython (Join-Path $scriptDir "run.py") --stop
} else {
    python (Join-Path $scriptDir "run.py") --stop
}
