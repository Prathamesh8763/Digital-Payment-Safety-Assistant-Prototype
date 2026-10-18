"""
Unified Development Server Runner for Digital Payment Security Assistant
Handles port conflict detection, auto-freeing stale processes, and clean shutdown.
"""

import sys
import os
import subprocess
import socket
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)


if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a specific port is currently in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0


def free_port(port: int):
    """Automatically find and terminate any lingering/orphaned process on the target port."""
    if not is_port_in_use(port):
        return
    print(f"[*] Port {port} is occupied. Cleaning up stale process...")
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and parts[1].endswith(f":{port}"):
                    pid = parts[-1]
                    if pid != str(os.getpid()) and pid != "0":
                        print(f"[*] Terminating conflicting process PID {pid} on port {port}...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
            time.sleep(0.5)
        except Exception as e:
            print(f"[!] Warning cleaning port {port}: {e}")
    else:
        subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)


def start_backend():
    """Start uvicorn with the virtualenv python interpreter."""
    free_port(8000)
    print("\n[+] Starting Backend API at http://127.0.0.1:8000 ...")
    cmd = [
        str(VENV_PYTHON),
        "-m",
        "uvicorn",
        "main:app",
        "--app-dir",
        "backend",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]
    return subprocess.Popen(cmd, cwd=str(ROOT_DIR))


def start_frontend():
    """Start Vite frontend development server."""
    free_port(5173)
    print("\n[+] Starting Frontend at http://localhost:5173 ...")
    cmd = ["npm", "--prefix", "frontend", "run", "dev"]
    return subprocess.Popen(cmd, cwd=str(ROOT_DIR), shell=True)


def run_all():
    """Run both backend and frontend concurrently with coordinated shutdown."""
    processes = []
    try:
        free_port(8000)
        free_port(5173)
        b_proc = start_backend()
        processes.append(b_proc)
        time.sleep(1)
        f_proc = start_frontend()
        processes.append(f_proc)
        print("\n" + "=" * 60)
        print("  Digital Payment Safety Assistant is Running!")
        print("  - Frontend UI:  http://localhost:5173")
        print("  - Backend API:  http://127.0.0.1:8000/api/health")
        print("  - API Docs:     http://127.0.0.1:8000/docs")
        print("  Press Ctrl+C to stop both servers cleanly.")
        print("=" * 60 + "\n")

        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    print(f"[!] Process {p.pid} exited with code {p.returncode}")
                    return
    except KeyboardInterrupt:
        print("\n[*] Stopping servers and releasing ports...")
    finally:
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=2)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        free_port(8000)
        free_port(5173)
        print("[OK] All ports freed cleanly.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--backend":
        free_port(8000)
        proc = start_backend()
        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
            free_port(8000)
    elif len(sys.argv) > 1 and sys.argv[1] == "--frontend":
        free_port(5173)
        proc = start_frontend()
        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
            free_port(5173)
    elif len(sys.argv) > 1 and sys.argv[1] in ("--stop", "--kill", "--clean"):
        free_port(8000)
        free_port(5173)
        print("[OK] Ports 8000 and 5173 freed successfully.")
    else:
        run_all()
