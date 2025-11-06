# Script to apply NextRowTheme colors to all pages
# Run this script to update all color classes to NextRowTheme

$files = Get-ChildItem -Path "components\pages" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace color classes
    $content = $content -replace 'text-green-(\d+)', 'text-nextrow-success'
    $content = $content -replace 'bg-green-(\d+)', 'bg-nextrow-success'
    $content = $content -replace 'border-green-(\d+)', 'border-nextrow-success'
    $content = $content -replace 'text-red-(\d+)', 'text-nextrow-danger'
    $content = $content -replace 'bg-red-(\d+)', 'bg-nextrow-danger'
    $content = $content -replace 'border-red-(\d+)', 'border-nextrow-danger'
    $content = $content -replace 'text-blue-(\d+)', 'text-nextrow-primary'
    $content = $content -replace 'bg-blue-(\d+)', 'bg-nextrow-primary'
    $content = $content -replace 'border-blue-(\d+)', 'border-nextrow-primary'
    $content = $content -replace 'text-indigo-(\d+)', 'text-nextrow-primary'
    $content = $content -replace 'bg-indigo-(\d+)', 'bg-nextrow-primary'
    $content = $content -replace 'text-emerald-(\d+)', 'text-nextrow-success'
    $content = $content -replace 'bg-emerald-(\d+)', 'bg-nextrow-success'
    $content = $content -replace 'text-rose-(\d+)', 'text-nextrow-danger'
    $content = $content -replace 'bg-rose-(\d+)', 'bg-nextrow-danger'
    
    # Handle specific patterns
    $content = $content -replace 'bg-green-50', 'bg-nextrow-success/10'
    $content = $content -replace 'dark:bg-green-900/20', 'dark:bg-nextrow-success/20'
    $content = $content -replace 'text-green-400', 'text-nextrow-success'
    $content = $content -replace 'text-green-700', 'text-nextrow-success'
    $content = $content -replace 'dark:text-green-200', 'dark:text-nextrow-success/90'
    $content = $content -replace 'dark:text-green-300', 'dark:text-nextrow-success/90'
    $content = $content -replace 'dark:text-green-400', 'dark:text-nextrow-success/90'
    
    $content = $content -replace 'bg-red-50', 'bg-nextrow-danger/10'
    $content = $content -replace 'bg-red-100', 'bg-nextrow-danger/20'
    $content = $content -replace 'dark:bg-red-900/30', 'dark:bg-nextrow-danger/30'
    $content = $content -replace 'dark:bg-red-900/50', 'dark:bg-nextrow-danger/50'
    $content = $content -replace 'text-red-800', 'text-nextrow-danger'
    $content = $content -replace 'dark:text-red-300', 'dark:text-nextrow-danger/90'
    
    $content = $content -replace 'text-blue-400', 'text-nextrow-primary'
    $content = $content -replace 'text-blue-500', 'text-nextrow-primary'
    $content = $content -replace 'text-blue-600', 'text-nextrow-primary'
    $content = $content -replace 'dark:text-blue-400', 'dark:text-nextrow-primary'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
}

Write-Host "`nDone! All files updated."







