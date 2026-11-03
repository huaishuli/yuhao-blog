param(
    [Parameter(Mandatory = $true)][string]$Script,
    [string[]]$ScriptArgs = @()
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class CredMan {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);

    [DllImport("Advapi32.dll")]
    public static extern void CredFree(IntPtr cred);

    public static string Get(string target) {
        IntPtr p;
        if (!CredRead(target, 1, 0, out p)) return null;
        try {
            CREDENTIAL c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL));
            byte[] b = new byte[c.CredentialBlobSize];
            Marshal.Copy(c.CredentialBlob, b, 0, c.CredentialBlobSize);
            return Encoding.UTF8.GetString(b);
        } finally {
            CredFree(p);
        }
    }
}
'@

$env:GITHUB_TOKEN = [CredMan]::Get("gh:github.com:huaishuli")
if (-not $env:GITHUB_TOKEN) { throw "GitHub token not found in Windows Credential Manager" }
$env:GITHUB_REPO = "huaishuli/yuhao-blog"

$node = "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
& $node $Script @ScriptArgs
exit $LASTEXITCODE
