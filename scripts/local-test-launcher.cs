using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class LocalTestLauncher
{
    private const string LauncherId = "__LAUNCHER_ID__";
    private const string PokRoot = "__POK_ROOT__";
    private const string ElectronExe = "__ELECTRON_EXE__";
    private const string UserDataDir = "__USER_DATA_DIR__";

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            if (HasArg(args, "--launcher-id"))
            {
                Console.WriteLine(LauncherId);
                return 0;
            }

            if (HasArg(args, "--check"))
            {
                Validate();
                Console.WriteLine("POK local-test launcher check passed.");
                return 0;
            }

            Validate();
            Directory.CreateDirectory(UserDataDir);

            var startInfo = new ProcessStartInfo
            {
                FileName = ElectronExe,
                Arguments = Quote(PokRoot) + (HasArg(args, "--debug") ? " --remote-debugging-port=0" : ""),
                WorkingDirectory = PokRoot,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            startInfo.EnvironmentVariables["POK_UI_DATA_DIR"] = UserDataDir;
            startInfo.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
            startInfo.EnvironmentVariables.Remove("POK_RENDERER_URL");

            Process.Start(startInfo);
            return 0;
        }
        catch (Exception error)
        {
            if (HasArg(args, "--check"))
            {
                Console.Error.WriteLine(error.Message);
            }
            else
            {
                MessageBox.Show(error.Message, "POK Local Test Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            return 1;
        }
    }

    private static bool HasArg(string[] args, string expected)
    {
        foreach (var arg in args)
        {
            if (string.Equals(arg, expected, StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
    }

    private static void Validate()
    {
        RequireDirectory(PokRoot, "POK checkout");
        RequireFile(ElectronExe, "Electron executable");
        RequireFile(Path.Combine(PokRoot, "package.json"), "package.json");
        RequireFile(Path.Combine(PokRoot, "dist", "main", "index.cjs"), "built main process");
        RequireFile(Path.Combine(PokRoot, "dist", "preload", "index.cjs"), "built preload");
        RequireFile(Path.Combine(PokRoot, "dist", "renderer", "index.html"), "built renderer");

        var workspaceDir = Path.Combine(UserDataDir, "workspace");
        RequireDirectory(UserDataDir, "local test userData directory");
        RequireDirectory(workspaceDir, "local test workspace directory");

        RequireFile(Path.Combine(workspaceDir, "workspace.v1.json"), "local test workspace state");
    }

    private static void RequireFile(string path, string label)
    {
        if (!Path.IsPathRooted(path) || !File.Exists(path))
        {
            throw new FileNotFoundException(label + " was not found: " + path);
        }
    }

    private static void RequireDirectory(string path, string label)
    {
        if (!Path.IsPathRooted(path) || !Directory.Exists(path))
        {
            throw new DirectoryNotFoundException(label + " was not found: " + path);
        }
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }
}
