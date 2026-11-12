#!/usr/bin/env python3
"""
DrainSenseAI - One-Command Full-Stack Runner
Launches both the FastAPI backend and Next.js frontend concurrently.
Auto-detects the proper Python environment (e.g. py -3.10 or venv) where dependencies are installed.
Press Ctrl+C to stop both servers.
"""

import os
import sys
import time
import subprocess

def find_working_python():
    """
    Finds a Python interpreter that has the required backend packages (pandas, fastapi, uvicorn).
    """
    # 1. Test current interpreter
    try:
        import pandas  # noqa
        import fastapi  # noqa
        import uvicorn  # noqa
        return sys.executable
    except ImportError:
        pass

    root_dir = os.path.dirname(os.path.abspath(__file__))

    # 2. Candidate list
    candidates = [
        os.path.join(root_dir, "venv", "Scripts", "python.exe"),
        os.path.join(root_dir, ".venv", "Scripts", "python.exe"),
        os.path.join(root_dir, "venv", "bin", "python"),
        os.path.join(root_dir, ".venv", "bin", "python"),
    ]

    # 3. Windows py launcher probes
    if sys.platform.startswith("win"):
        for ver in ["-3.10", "-3.11", "-3.12"]:
            try:
                res = subprocess.run(
                    ["py", ver, "-c", "import sys; print(sys.executable)"],
                    capture_output=True,
                    text=True,
                    check=False
                )
                if res.returncode == 0:
                    exe = res.stdout.strip()
                    if exe and os.path.exists(exe) and exe not in candidates:
                        candidates.append(exe)
            except Exception:
                pass

        # Also check local AppData installs
        appdata_local = os.environ.get("LOCALAPPDATA", "")
        if appdata_local:
            for pyver in ["Python310", "Python311", "Python312"]:
                exe = os.path.join(appdata_local, "Programs", "Python", pyver, "python.exe")
                if os.path.exists(exe) and exe not in candidates:
                    candidates.append(exe)

    # 4. Probe candidates for pandas and fastapi
    for cand in candidates:
        if os.path.exists(cand):
            try:
                check = subprocess.run(
                    [cand, "-c", "import pandas, fastapi, uvicorn"],
                    capture_output=True,
                    check=False
                )
                if check.returncode == 0:
                    return cand
            except Exception:
                continue

    return sys.executable

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    python_exe = find_working_python()

    # If current process is not the working Python, delegate to the working interpreter
    if os.path.abspath(python_exe).lower() != os.path.abspath(sys.executable).lower():
        print(f"Auto-detected Python with project dependencies: {python_exe}")
        try:
            res = subprocess.call([python_exe, os.path.abspath(__file__)] + sys.argv[1:])
            sys.exit(res)
        except Exception as e:
            print(f"Failed to delegate to {python_exe}: {e}")

    # Verify that the current interpreter has pandas
    try:
        import pandas  # noqa
        import fastapi  # noqa
    except ImportError as e:
        print("=" * 65)
        print("ERROR: Missing required backend dependencies.")
        print(f"Current Python: {sys.executable} (Python {sys.version.split()[0]})")
        print(f"Missing package: {e}")
        print("\nTo fix, please install backend requirements:")
        print(f"  {sys.executable} -m pip install -r backend/requirements.txt")
        print("Or if you have Python 3.10 installed, run:")
        print("  py -3.10 run.py")
        print("=" * 65)
        sys.exit(1)

    print("=" * 65)
    print("  DrainSenseAI - Physics-Informed Urban Flood Nowcasting")
    print(f"  Python Runtime: {sys.executable}")
    print("  Starting Backend (FastAPI :8000) & Frontend (Next.js :3000)...")
    print("=" * 65)

    is_win = sys.platform.startswith("win")

    backend_cmd = [
        python_exe,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
    ]

    npm_cmd = "npm.cmd" if is_win else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]

    env = os.environ.copy()
    env["PYTHONPATH"] = root_dir

    backend_proc = None
    frontend_proc = None

    try:
        print("[1/2] Launching FastAPI backend on http://127.0.0.1:8000 ...")
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=root_dir,
            env=env
        )

        time.sleep(2)

        print("[2/2] Launching Next.js frontend on http://localhost:3000 ...")
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            shell=is_win
        )

        print("\n" + "-" * 65)
        print("  DrainSenseAI is now running:")
        print("   - Frontend Command Center: http://localhost:3000")
        print("   - Backend REST API:        http://127.0.0.1:8000")
        print("   - Interactive Swagger Docs: http://127.0.0.1:8000/docs")
        print("   - Health Check:            http://127.0.0.1:8000/health")
        print("-" * 65)
        print("  Press Ctrl+C to terminate both servers.\n")

        while True:
            b_code = backend_proc.poll()
            f_code = frontend_proc.poll()
            if b_code is not None:
                print(f"Backend exited with code {b_code}")
                break
            if f_code is not None:
                print(f"Frontend exited with code {f_code}")
                break
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down DrainSenseAI services...")
    finally:
        for name, proc in [("Frontend", frontend_proc), ("Backend", backend_proc)]:
            if proc and proc.poll() is None:
                try:
                    if is_win:
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL
                        )
                    else:
                        proc.terminate()
                        proc.wait(timeout=3)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass
        print("All DrainSenseAI servers stopped.")

if __name__ == "__main__":
    main()
