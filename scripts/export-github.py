#!/usr/bin/env python3
"""Gera um ZIP portável do portfólio, com os metadados do domínio de destino."""

from pathlib import Path
from urllib.parse import urlparse
import argparse
import re
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path, help="Caminho do arquivo ZIP de saída")
parser.add_argument("--domain", default="paulodarosa.com", help="Domínio final, sem protocolo")
args = parser.parse_args()
if not re.fullmatch(r"[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?", args.domain):
    parser.error("Use apenas o domínio, como paulodarosa.com")

root = Path(__file__).resolve().parent.parent
html = (root / "dist/index.html").read_text(encoding="utf-8")
canonical = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', html)
if not canonical:
    raise SystemExit("O HTML precisa ter uma URL canonical antes de ser exportado.")
parsed = urlparse(canonical.group(1))
source_origin = f"{parsed.scheme}://{parsed.netloc}"
target_origin = f"https://{args.domain}"
excluded_parts = {".git", ".openai", "__pycache__", "node_modules"}
text_extensions = {".html", ".xml", ".txt", ".md", ".css", ".js", ".py", ".yml"}
args.output.parent.mkdir(parents=True, exist_ok=True)
files = []

with zipfile.ZipFile(args.output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.is_symlink() or path.resolve() == args.output.resolve():
            continue
        rel = path.relative_to(root)
        if excluded_parts.intersection(rel.parts) or path.name.startswith("__qa"):
            continue
        if path.suffix in {".zip", ".tar", ".gz", ".tmp", ".log"}:
            continue
        data = path.read_bytes()
        if path.suffix in text_extensions or path.name == "CNAME":
            text = data.decode("utf-8")
            text = text.replace(source_origin, target_origin)
            if path.name == "CNAME":
                text = args.domain + "\n"
            data = text.encode("utf-8")
        archive.writestr("paulo-portfolio/" + rel.as_posix(), data)
        files.append(rel.as_posix())

print(f"Exportação concluída: {args.output}")
print(f"{len(files)} arquivos; domínio de destino: {target_origin}")
print("O ZIP contém a pasta .github e não contém histórico Git ou configuração da prévia.")
