BeforeAll {
  Set-StrictMode -Version Latest
  $ErrorActionPreference = 'Stop'

  $script:installerPath = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot '../../src/cli/install.ps1')
  )
  $script:originalPath = $env:PATH
  $script:originalInstallRoot = $env:MAILCHANNELS_INSTALL
  $script:originalArchitecture = $env:PROCESSOR_ARCHITECTURE
  $script:originalWow64Architecture = $env:PROCESSOR_ARCHITEW6432

  . $script:installerPath -LoadFunctionsOnly
}

Describe 'MailChannels CLI installer' {
  BeforeEach {
    $script:testRoot = Join-Path (
      [System.IO.Path]::GetTempPath()
    ) ('mailchannels-installer-test-{0}' -f [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $script:testRoot -Force | Out-Null

    $env:MAILCHANNELS_INSTALL = Join-Path $script:testRoot 'install'
    $env:PROCESSOR_ARCHITECTURE = 'AMD64'
    $env:PROCESSOR_ARCHITEW6432 = ''

    $sourceDirectory = Join-Path $script:testRoot 'source'
    New-Item -ItemType Directory -Path $sourceDirectory -Force | Out-Null
    $sourceExecutable = Join-Path $sourceDirectory 'mailchannels.exe'
    $script:releaseContents = 'new release executable'
    [System.IO.File]::WriteAllText($sourceExecutable, $script:releaseContents)

    $script:archiveFixture = Join-Path $script:testRoot 'mailchannels-windows-x64.zip'
    Compress-Archive -LiteralPath $sourceExecutable -DestinationPath $script:archiveFixture
    $script:archiveChecksum = (
      Get-FileHash -LiteralPath $script:archiveFixture -Algorithm SHA256
    ).Hash.ToLowerInvariant()
    $script:checksumFixture = Join-Path $script:testRoot 'mailchannels-cli-checksums.txt'
    [System.IO.File]::WriteAllText(
      $script:checksumFixture,
      "$($script:archiveChecksum)  mailchannels-windows-x64.zip"
    )

    $script:mockUserPath = @(
      (Join-Path $script:testRoot 'user-path-one'),
      (Join-Path $script:testRoot 'user-path-two')
    ) -join ';'
    $env:PATH = @(
      (Join-Path $script:testRoot 'process-path-one'),
      (Join-Path $script:testRoot 'process-path-two')
    ) -join ';'
    $script:failArchiveDownload = $false

    Mock Write-Host {}

    Mock Get-UserPath {
      return $script:mockUserPath
    }

    Mock Set-UserPath {
      param([AllowNull()][string]$Value)

      $script:mockUserPath = $Value
    }

    Mock Invoke-InstallerWebRequest {
      param(
        [string]$Uri,
        [string]$Method,
        [string]$OutFile
      )

      if ($script:failArchiveDownload -and $Uri.EndsWith('.zip')) {
        throw [System.Net.WebException]::new('simulated download failure')
      }

      if ($Uri.EndsWith('.zip')) {
        Copy-Item -LiteralPath $script:archiveFixture -Destination $OutFile -Force
      }
      else {
        Copy-Item -LiteralPath $script:checksumFixture -Destination $OutFile -Force
      }
    }
  }

  AfterEach {
    if (Test-Path -LiteralPath $script:testRoot) {
      Remove-Item -LiteralPath $script:testRoot -Recurse -Force
    }

    $env:PATH = $script:originalPath
    $env:MAILCHANNELS_INSTALL = $script:originalInstallRoot
    $env:PROCESSOR_ARCHITECTURE = $script:originalArchitecture
    $env:PROCESSOR_ARCHITEW6432 = $script:originalWow64Architecture
  }

  It 'runs with the production strict and error settings' {
    $ErrorActionPreference | Should -Be 'Stop'
    { $script:installerStrictModeProbe } | Should -Throw
  }

  It 'installs a fresh executable from a verified archive' {
    Install-MailChannelsCli -RequestedVersion '0.0.0'

    $executablePath = Join-Path $env:MAILCHANNELS_INSTALL 'bin/mailchannels.exe'
    [System.IO.File]::ReadAllText($executablePath) | Should -Be $script:releaseContents
    $script:mockUserPath -split ';' | Should -Contain (Split-Path $executablePath -Parent)
    Should -Invoke Invoke-InstallerWebRequest -Times 2 -Exactly
  }

  It 'replaces an existing executable' {
    $binDirectory = Join-Path $env:MAILCHANNELS_INSTALL 'bin'
    New-Item -ItemType Directory -Path $binDirectory -Force | Out-Null
    $executablePath = Join-Path $binDirectory 'mailchannels.exe'
    [System.IO.File]::WriteAllText($executablePath, 'old executable')

    Install-MailChannelsCli -RequestedVersion '0.0.0'

    [System.IO.File]::ReadAllText($executablePath) | Should -Be $script:releaseContents
    @(Get-ChildItem -LiteralPath $binDirectory -File).Count | Should -Be 1
  }

  It 'does not replace an executable when the checksum does not match' {
    $binDirectory = Join-Path $env:MAILCHANNELS_INSTALL 'bin'
    New-Item -ItemType Directory -Path $binDirectory -Force | Out-Null
    $executablePath = Join-Path $binDirectory 'mailchannels.exe'
    [System.IO.File]::WriteAllText($executablePath, 'old executable')
    [System.IO.File]::WriteAllText(
      $script:checksumFixture,
      (('0' * 64) + '  mailchannels-windows-x64.zip')
    )

    { Install-MailChannelsCli -RequestedVersion '0.0.0' } |
      Should -Throw -ExpectedMessage '*Checksum verification failed*'

    [System.IO.File]::ReadAllText($executablePath) | Should -Be 'old executable'
  }

  It 'refuses a checksum file without an entry for the archive' {
    [System.IO.File]::WriteAllText($script:checksumFixture, 'not a checksum entry')

    { Install-MailChannelsCli -RequestedVersion '0.0.0' } |
      Should -Throw -ExpectedMessage '*does not contain a valid SHA-256 entry*'

    Test-Path -LiteralPath (Join-Path $env:MAILCHANNELS_INSTALL 'bin/mailchannels.exe') |
      Should -BeFalse
  }

  It 'does not install when the archive download fails' {
    $script:failArchiveDownload = $true

    { Install-MailChannelsCli -RequestedVersion '0.0.0' } |
      Should -Throw -ExpectedMessage '*Could not download v0.0.0*'

    Test-Path -LiteralPath (Join-Path $env:MAILCHANNELS_INSTALL 'bin/mailchannels.exe') |
      Should -BeFalse
  }

  It 'preserves existing PATH entries and does not add the install directory twice' {
    $binDirectory = Join-Path $env:MAILCHANNELS_INSTALL 'bin'
    $initialUserPath = $script:mockUserPath
    $initialProcessPath = $env:PATH

    $firstResult = Add-InstallDirectoryToPath -Directory $binDirectory
    $secondResult = Add-InstallDirectoryToPath -Directory $binDirectory

    $script:mockUserPath | Should -Be "$initialUserPath;$binDirectory"
    $env:PATH | Should -Be "$initialProcessPath;$binDirectory"
    $firstResult.UserPathUpdated | Should -BeTrue
    $secondResult.UserPathUpdated | Should -BeFalse
    $firstResult.ProcessPathUpdated | Should -BeTrue
    $secondResult.ProcessPathUpdated | Should -BeFalse
    Should -Invoke Set-UserPath -Times 1 -Exactly
  }

  It 'rejects a directory at the executable path without writing into it' {
    $binDirectory = Join-Path $env:MAILCHANNELS_INSTALL 'bin'
    $executablePath = Join-Path $binDirectory 'mailchannels.exe'
    New-Item -ItemType Directory -Path $executablePath -Force | Out-Null
    $sentinelPath = Join-Path $executablePath 'sentinel.txt'
    [System.IO.File]::WriteAllText($sentinelPath, 'keep')

    { Install-MailChannelsCli -RequestedVersion '0.0.0' } |
      Should -Throw -ExpectedMessage '*mailchannels.exe*directory*'

    [System.IO.File]::ReadAllText($sentinelPath) | Should -Be 'keep'
    @(Get-ChildItem -LiteralPath $executablePath -Force).Count | Should -Be 1
  }
}
