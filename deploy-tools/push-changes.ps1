$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredApi {
  [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);
  [DllImport("advapi32.dll", SetLastError=true)]
  public static extern void CredFree(IntPtr cred);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob;
    public int Persist; public int AttributeCount; public IntPtr Attributes;
    public string TargetAlias; public string UserName;
  }
}
"@
$ptr = [IntPtr]::Zero
if (-not [CredApi]::CredRead("gh:github.com:huaishuli", 1, 0, [ref]$ptr)) { throw "credential not found" }
$cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredApi+CREDENTIAL])
$bytes = New-Object byte[] $cred.CredentialBlobSize
[System.Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
$token = [System.Text.Encoding]::Unicode.GetString($bytes).Trim()
[CredApi]::CredFree($ptr)
if (-not $token.StartsWith("gh")) { throw "unexpected token shape" }

$env:GITHUB_TOKEN = $token
$env:GITHUB_REPO = "huaishuli/yuhao-blog"
$env:GITHUB_BRANCH = "main"
$node = "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
$files = @(
  ".pages.yml",
  "src/content/spec/about.md",
  "src/components/widget/SiteInfo.astro",
  "src/components/layout/Footer.astro",
  "src/components/layout/BannerHomeTextOverlay.astro",
  "src/components/features/MusicManager.astro",
  "src/components/features/MusicPlayerView.astro",
  "src/components/features/Live2DWidget.astro",
  "src/components/comment/Twikoo.astro",
  "src/config/commentConfig.ts",
  "src/utils/feed-utils.ts",
  "src/utils/layout-init.ts",
  "src/utils/swup-transitions.ts",
  "src/global.d.ts",
  "src/env.d.ts"
)
& $node "D:\My_task_dsh\My-web_1\deploy-tools\gh-commit.mjs" "chore: pages cms config, about page and branding cleanup" @files
