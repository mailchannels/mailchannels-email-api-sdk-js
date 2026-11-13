#!/usr/bin/env pwsh
# MailChannels-CLI installer for Windows x64
# Optional environment variables:
#   MAILCHANNELS_INSTALL | Install root (default: $HOME\.mailchannels)
# Optional parameter:
#   -Version | Release version (default: latest)

param(
  [string]$Version
)

# Keep installer helpers and settings out of the caller's scope when piped to iex.
& {
  param([AllowNull()][string]$RequestedVersion)

  Set-StrictMode -Version Latest
  $ErrorActionPreference = 'Stop'
  $repositoryUrl = 'https://github.com/mailchannels/mailchannels-email-api-sdk-js'
  $target = 'windows-x64'

  # --- Installer output and web requests ---
  function Write-InstallStep {
    param([Parameter(Mandatory)][string]$Message)

    Write-Host "  $Message" -ForegroundColor DarkGray
  }

  function Invoke-InstallerWebRequest {
    [CmdletBinding()]
    param(
      [Parameter(Mandatory)][string]$Uri,
      [ValidateSet('Get', 'Head')][string]$Method = 'Get',
      [string]$OutFile
    )

    $previousSecurityProtocol = [Net.ServicePointManager]::SecurityProtocol
    $ProgressPreference = 'SilentlyContinue'

    try {
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      $requestParameters = @{
        Uri                 = $Uri
        Method              = $Method
        MaximumRedirection  = 10
        TimeoutSec          = 120
        UseBasicParsing     = $true
        ErrorAction         = 'Stop'
      }

      if (-not [string]::IsNullOrWhiteSpace($OutFile)) {
        $requestParameters.OutFile = $OutFile
        Invoke-WebRequest @requestParameters | Out-Null
        return
      }

      return Invoke-WebRequest @requestParameters
    }
    finally {
      [Net.ServicePointManager]::SecurityProtocol = $previousSecurityProtocol
    }
  }

  # --- Release version resolution ---
  function ConvertTo-ReleaseVersion {
    param([Parameter(Mandatory)][string]$Value)

    $version = $Value.Trim()
    if ($version.StartsWith('v', [StringComparison]::OrdinalIgnoreCase)) {
      $version = $version.Substring(1)
    }

    return $version
  }

  function Get-LatestReleaseVersion {
    $latestUrl = "$repositoryUrl/releases/latest"
    try {
      $response = Invoke-InstallerWebRequest -Uri $latestUrl -Method Head
    }
    catch {
      throw (
        'Could not check the latest release. Confirm GitHub is reachable and try again. ' +
        "Details: $($_.Exception.Message)"
      )
    }

    $baseResponse = $response.BaseResponse
    $finalUri = $null
    if ($baseResponse -is [System.Net.HttpWebResponse]) {
      $finalUri = $baseResponse.ResponseUri
    }
    elseif ($baseResponse.PSObject.Properties['RequestMessage']) {
      $finalUri = $baseResponse.RequestMessage.RequestUri
    }

    if (-not $finalUri) {
      throw "GitHub did not provide a release tag for $latestUrl."
    }

    $tag = [System.Uri]::UnescapeDataString($finalUri.AbsolutePath.Split('/')[-1])
    if ($tag -notmatch '^v(?<Version>.+)$') {
      throw "Could not read the latest release version from $($finalUri.AbsoluteUri)."
    }

    return ConvertTo-ReleaseVersion -Value $Matches['Version']
  }

  function Resolve-ReleaseVersion {
    param([AllowNull()][string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
      return Get-LatestReleaseVersion
    }

    return ConvertTo-ReleaseVersion -Value $Value
  }

  # --- HTTP and checksum helpers ---
  function Get-HttpStatusCode {
    param([Parameter(Mandatory)][System.Exception]$Exception)

    $responseProperty = $Exception.PSObject.Properties['Response']
    if ($null -eq $responseProperty -or $null -eq $responseProperty.Value) {
      return $null
    }

    $statusProperty = $responseProperty.Value.PSObject.Properties['StatusCode']
    if ($null -eq $statusProperty) {
      return $null
    }

    return [int]$statusProperty.Value
  }

  function Get-ExpectedChecksum {
    param(
      [Parameter(Mandatory)][string]$ChecksumsPath,
      [Parameter(Mandatory)][string]$ArchiveName
    )

    foreach ($line in Get-Content -LiteralPath $ChecksumsPath -ErrorAction Stop) {
      $match = [regex]::Match(
        $line.Trim(),
        '^(?<Hash>[A-Fa-f0-9]{64})\s+\*?(?<File>\S+)$'
      )
      if (
        $match.Success -and
        [string]::Equals(
          $match.Groups['File'].Value,
          $ArchiveName,
          [StringComparison]::Ordinal
        )
      ) {
        return $match.Groups['Hash'].Value.ToLowerInvariant()
      }
    }

    return $null
  }

  # --- Windows architecture ---
  function Get-WindowsArchitecture {
    $architecture = $env:PROCESSOR_ARCHITEW6432
    if ([string]::IsNullOrWhiteSpace($architecture)) {
      $architecture = $env:PROCESSOR_ARCHITECTURE
    }

    if ($architecture -notin @('AMD64', 'EM64T')) {
      if ([string]::IsNullOrWhiteSpace($architecture)) {
        $architecture = 'unknown'
      }
      throw (
        "Unsupported Windows architecture '$architecture'. " +
        'The standalone installer supports Windows x64.'
      )
    }

    return $architecture
  }

  # --- PATH setup ---
  function ConvertTo-ComparablePath {
    param([AllowNull()][string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
      return $null
    }

    $path = [Environment]::ExpandEnvironmentVariables($Value.Trim().Trim([char[]]@('"')))
    try {
      $fullPath = [System.IO.Path]::GetFullPath($path)
      $root = [System.IO.Path]::GetPathRoot($fullPath)
      if ($root -and $fullPath.Length -gt $root.Length) {
        $fullPath = $fullPath.TrimEnd([char[]]@('\', '/'))
      }
      return $fullPath
    }
    catch {
      return $path
    }
  }

  function Test-PathContainsDirectory {
    param(
      [AllowNull()][string]$PathValue,
      [Parameter(Mandatory)][string]$Directory
    )

    $expectedPath = ConvertTo-ComparablePath -Value $Directory
    foreach ($entry in ($PathValue -split ';')) {
      if (-not [string]::IsNullOrWhiteSpace($entry)) {
        $currentPath = ConvertTo-ComparablePath -Value $entry
        if ([string]::Equals($currentPath, $expectedPath, [StringComparison]::OrdinalIgnoreCase)) {
          return $true
        }
      }
    }

    return $false
  }

  function Add-InstallDirectoryToPath {
    param([Parameter(Mandatory)][string]$Directory)

    $userPathUpdated = $false
    $userPathError = $null
    try {
      $userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
      if (-not (Test-PathContainsDirectory -PathValue $userPath -Directory $Directory)) {
        $userEntries = @(
          $userPath -split ';' |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        )
        $userPath = (@($userEntries + $Directory) -join ';')
        [Environment]::SetEnvironmentVariable('PATH', $userPath, 'User')
        $userPathUpdated = $true
      }
    }
    catch {
      $userPathError = $_.Exception.Message
    }

    $processPathUpdated = $false
    if (-not (Test-PathContainsDirectory -PathValue $env:PATH -Directory $Directory)) {
      $processEntries = @(
        $env:PATH -split ';' |
          Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
      )
      $env:PATH = (@($processEntries + $Directory) -join ';')
      $processPathUpdated = $true
    }

    return [pscustomobject]@{
      UserPathUpdated    = $userPathUpdated
      ProcessPathUpdated = $processPathUpdated
      UserPathError      = $userPathError
    }
  }

  # --- Release version, URLs, and install paths ---
  function New-InstallContext {
    param([AllowNull()][string]$RequestedVersion)

    $version = Resolve-ReleaseVersion -Value $RequestedVersion
    $archiveName = "mailchannels-$target.zip"
    $releaseUrl = "$repositoryUrl/releases/download/v$version"
    $installRoot = $env:MAILCHANNELS_INSTALL
    if ([string]::IsNullOrWhiteSpace($installRoot)) {
      $installRoot = Join-Path $HOME '.mailchannels'
    }
    try {
      $installRoot = (
        $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(
          $installRoot
        )
      )
      $installRoot = [System.IO.Path]::GetFullPath($installRoot)
    }
    catch {
      throw (
        "Invalid install directory '$installRoot'. " +
        "Details: $($_.Exception.Message)"
      )
    }

    $binDirectory = Join-Path $installRoot 'bin'
    $executablePath = Join-Path $binDirectory 'mailchannels.exe'
    $workDirectoryName = 'mailchannels-cli-{0}' -f `
      [System.Guid]::NewGuid().ToString('N')
    $workDirectory = Join-Path ([System.IO.Path]::GetTempPath()) $workDirectoryName
    $extractDirectory = Join-Path $workDirectory 'extract'
    $archivePath = Join-Path $workDirectory $archiveName
    $checksumsPath = Join-Path $workDirectory 'mailchannels-cli-checksums.txt'

    return [pscustomobject]@{
      Version          = $version
      ArchiveName      = $archiveName
      ArchiveUrl       = "$releaseUrl/$archiveName"
      ChecksumsUrl     = "$releaseUrl/mailchannels-cli-checksums.txt"
      BinDirectory     = $binDirectory
      ExecutablePath   = $executablePath
      WorkDirectory    = $workDirectory
      ExtractDirectory = $extractDirectory
      ArchivePath      = $archivePath
      ChecksumsPath    = $checksumsPath
    }
  }

  # --- Download release assets ---
  function Download-ReleaseAssets {
    param([Parameter(Mandatory)][pscustomobject]$Context)

    Write-InstallStep "Downloading from $($Context.ArchiveUrl)"
    try {
      Invoke-InstallerWebRequest -Uri $Context.ArchiveUrl -OutFile $Context.ArchivePath
    }
    catch {
      throw (
        "Could not download v$($Context.Version). Confirm the release exists and GitHub is " +
        "reachable. URL: $($Context.ArchiveUrl). Details: $($_.Exception.Message)"
      )
    }

    Write-InstallStep 'Verifying the release checksum...'
    try {
      Invoke-InstallerWebRequest -Uri $Context.ChecksumsUrl -OutFile $Context.ChecksumsPath
    }
    catch {
      $requestError = $_
      if ((Get-HttpStatusCode -Exception $requestError.Exception) -eq 404) {
        throw (
          "The checksum file is missing from v$($Context.Version). Refusing to install an " +
          'unverified archive; retry after the release is complete.'
        )
      }
      throw (
        'Could not download the checksum file. Refusing to install an unverified archive. ' +
        "URL: $($Context.ChecksumsUrl). Details: $($requestError.Exception.Message)"
      )
    }
  }

  # --- Checksum verification ---
  function Verify-ReleaseChecksum {
    param([Parameter(Mandatory)][pscustomobject]$Context)

    $expectedChecksum = Get-ExpectedChecksum `
      -ChecksumsPath $Context.ChecksumsPath `
      -ArchiveName $Context.ArchiveName
    if (-not $expectedChecksum) {
      throw (
        'The checksum file does not contain a valid SHA-256 entry for ' +
        "$($Context.ArchiveName). No files were installed"
      )
    }

    $actualChecksum = (
      Get-FileHash -LiteralPath $Context.ArchivePath -Algorithm SHA256 -ErrorAction Stop
    ).Hash.ToLowerInvariant()
    if ($actualChecksum -ne $expectedChecksum) {
      throw (
        "Checksum verification failed for $($Context.ArchiveName). " +
        "Expected $expectedChecksum, got $actualChecksum. No files were installed."
      )
    }
  }

  # --- Extract verified archive ---
  function Expand-ReleaseExecutable {
    param([Parameter(Mandatory)][pscustomobject]$Context)

    New-Item -ItemType Directory -Path $Context.ExtractDirectory -Force | Out-Null
    try {
      Expand-Archive `
        -LiteralPath $Context.ArchivePath `
        -DestinationPath $Context.ExtractDirectory `
        -Force `
        -ErrorAction Stop
    }
    catch {
      throw (
        'Could not extract the verified archive. ' +
        "Details: $($_.Exception.Message)"
      )
    }

    $stagedExecutable = Join-Path $Context.ExtractDirectory 'mailchannels.exe'
    if (-not (Test-Path -LiteralPath $stagedExecutable -PathType Leaf)) {
      throw 'The verified archive does not contain mailchannels.exe. No files were installed.'
    }

    return $stagedExecutable
  }

  # --- Install executable ---
  function Install-Executable {
    param(
      [Parameter(Mandatory)][string]$StagedExecutable,
      [Parameter(Mandatory)][pscustomobject]$Context
    )

    $stagedInstallName = '.mailchannels-{0}.tmp' -f `
      [System.Guid]::NewGuid().ToString('N')
    $stagedInstallPath = $null
    try {
      New-Item -ItemType Directory -Path $Context.BinDirectory -Force | Out-Null
      $stagedInstallPath = Join-Path $Context.BinDirectory $stagedInstallName
      Copy-Item `
        -LiteralPath $StagedExecutable `
        -Destination $stagedInstallPath `
        -ErrorAction Stop
      Move-Item `
        -LiteralPath $stagedInstallPath `
        -Destination $Context.ExecutablePath `
        -Force `
        -ErrorAction Stop
      $stagedInstallPath = $null
    }
    catch {
      throw (
        "Could not install the executable to '$($Context.BinDirectory)'. " +
        'Close any running MailChannels-CLI process and try again. ' +
        "Details: $($_.Exception.Message)"
      )
    }
    finally {
      if ($stagedInstallPath) {
        Remove-Item `
          -LiteralPath $stagedInstallPath `
          -Force `
          -ErrorAction SilentlyContinue
      }
    }
  }

  # --- Installation summary ---
  function Write-InstallSummary {
    param(
      [Parameter(Mandatory)][string]$Version,
      [Parameter(Mandatory)][string]$BinDirectory,
      [Parameter(Mandatory)][string]$ExecutablePath,
      [Parameter(Mandatory)][pscustomobject]$PathResult
    )

    Write-Host ''
    Write-Host "MailChannels-CLI v$Version installed successfully!" -ForegroundColor Green
    Write-InstallStep "Executable: $ExecutablePath"
    if ($PathResult.UserPathUpdated) {
      Write-InstallStep "Added $BinDirectory to your User PATH."
    }
    if ($PathResult.ProcessPathUpdated) {
      Write-InstallStep 'Updated PATH for this PowerShell session.'
    }

    if ($PathResult.UserPathError) {
      Write-Host ('  Could not update User PATH: {0}' -f $PathResult.UserPathError) `
        -ForegroundColor Yellow
      Write-Host "  Add this folder to PATH manually: $BinDirectory" -ForegroundColor Yellow
      Write-Host ('  Run directly: "{0}" --help' -f $ExecutablePath) `
        -ForegroundColor Cyan
    }
    else {
      Write-Host '  Open a new terminal, then run: ' -NoNewline
      Write-Host 'mailchannels --help ' -NoNewline -ForegroundColor Cyan
      Write-Host 'to get started'
    }
    Write-Host ''
  }

  # --- Main installation flow ---
  function Install-MailChannelsCli {
    param([AllowNull()][string]$RequestedVersion)

    $null = Get-WindowsArchitecture
    Write-Host ''
    Write-Host 'MailChannels-CLI Installer' -ForegroundColor Cyan
    if ([string]::IsNullOrWhiteSpace($RequestedVersion)) {
      Write-InstallStep 'Checking the latest release...'
    }

    $context = New-InstallContext -RequestedVersion $RequestedVersion
    Write-InstallStep "Preparing v$($context.Version) for Windows x64"

    try {
      New-Item -ItemType Directory -Path $context.WorkDirectory -Force | Out-Null
      Download-ReleaseAssets -Context $context
      Verify-ReleaseChecksum -Context $context
      $stagedExecutable = Expand-ReleaseExecutable -Context $context
      Install-Executable -StagedExecutable $stagedExecutable -Context $context
    }
    finally {
      Remove-Item `
        -LiteralPath $context.WorkDirectory `
        -Recurse `
        -Force `
        -ErrorAction SilentlyContinue
    }

    $pathResult = Add-InstallDirectoryToPath -Directory $context.BinDirectory
    Write-InstallSummary `
      -Version $context.Version `
      -BinDirectory $context.BinDirectory `
      -ExecutablePath $context.ExecutablePath `
      -PathResult $pathResult
  }

  try {
    Install-MailChannelsCli -RequestedVersion $RequestedVersion
  }
  catch {
    Write-Host ''
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    throw
  }
} $Version
