$ErrorActionPreference = 'Stop'
$projectRef = 'wqdbfaetsebukzoockly'
$secretFile = Join-Path $env:TEMP ("cortexa-gemini-" + [guid]::NewGuid().ToString('N') + '.env')
$secureValue = $null
$plainValue = $null
$secretPointer = [IntPtr]::Zero

try {
  $secureValue = Read-Host 'Cole sua GEMINI_API_KEY (entrada oculta)' -AsSecureString
  if ($secureValue.Length -eq 0) { throw 'A chave Gemini não pode estar vazia.' }

  [System.IO.File]::WriteAllText($secretFile, '')
  $acl = New-Object System.Security.AccessControl.FileSecurity
  $acl.SetAccessRuleProtection($true, $false)
  $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $acl.SetOwner($identity.User)
  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $identity.User,
    [System.Security.AccessControl.FileSystemRights]::FullControl,
    [System.Security.AccessControl.AccessControlType]::Allow
  )
  $acl.AddAccessRule($rule)
  [System.IO.File]::SetAccessControl($secretFile, $acl)

  $secretPointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  $plainValue = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
  [System.IO.File]::WriteAllText(
    $secretFile,
    "GEMINI_API_KEY=$plainValue`r`n",
    [System.Text.UTF8Encoding]::new($false)
  )

  & npx.cmd supabase secrets set --project-ref $projectRef --env-file $secretFile
  if ($LASTEXITCODE -ne 0) { throw 'O Supabase CLI não conseguiu cadastrar o secret.' }
  Write-Output 'GEMINI_API_KEY cadastrada no Supabase. O valor não foi exibido.'
}
finally {
  if (Test-Path -LiteralPath $secretFile) { Remove-Item -LiteralPath $secretFile -Force }
  if ($secretPointer -ne [IntPtr]::Zero) {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  }
  if ($secureValue) { $secureValue.Dispose() }
  Remove-Variable plainValue, secureValue -ErrorAction SilentlyContinue
}
