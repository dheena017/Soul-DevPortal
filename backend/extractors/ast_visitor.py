"""
Python AST Visitor for exact class, method, function, and docstring extraction.
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


class PythonSymbolVisitor(ast.NodeVisitor):
    """Accurately traverses Python AST to extract symbol metadata."""

    def __init__(self, relative_path: str):
        self.relative_path = relative_path
        self.symbols: List[Dict[str, Any]] = []
        self._current_class: Optional[Dict[str, Any]] = None

    def visit_ClassDef(self, node: ast.ClassDef):
        bases = [ast.unparse(b) for b in node.bases]
        docstring = ast.get_docstring(node) or ""
        decorators = [ast.unparse(d) for d in node.decorator_list]

        cls_info: Dict[str, Any] = {
            "language": "python",
            "kind": "class",
            "name": node.name,
            "signature": f"class {node.name}({', '.join(bases)}):" if bases else f"class {node.name}:",
            "docstring": docstring,
            "decorators": decorators,
            "line": node.lineno,
            "file": self.relative_path,
            "methods": [],
        }

        prev_class = self._current_class
        self._current_class = cls_info
        self.generic_visit(node)
        self._current_class = prev_class

        self.symbols.append(cls_info)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._record_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._record_function(node, is_async=True)

    def _record_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef, is_async: bool):
        docstring = ast.get_docstring(node) or ""
        params: List[str] = []
        for a in node.args.args:
            param_str = a.arg
            if a.annotation:
                param_str += f": {ast.unparse(a.annotation)}"
            params.append(param_str)

        return_type = ast.unparse(node.returns) if node.returns else None
        decorators = [ast.unparse(d) for d in node.decorator_list]

        prefix = "async def" if is_async else "def"
        sig = f"{prefix} {node.name}({', '.join(params)})"
        if return_type:
            sig += f" -> {return_type}:"
        else:
            sig += ":"

        fn_data = {
            "name": node.name,
            "signature": sig,
            "docstring": docstring,
            "params": ", ".join(params),
            "returnType": return_type,
            "decorators": decorators,
            "isAsync": is_async,
            "line": node.lineno,
            "file": self.relative_path,
        }

        if self._current_class is not None:
            self._current_class["methods"].append(fn_data)
        else:
            self.symbols.append({
                "language": "python",
                "kind": "function",
                **fn_data,
            })


def parse_python_symbols(file_path: Path, relative_path: str) -> List[Dict[str, Any]]:
    """Reads a Python file and returns extracted AST symbols."""
    try:
        content = file_path.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(file_path))
        visitor = PythonSymbolVisitor(relative_path)
        visitor.visit(tree)
        return visitor.symbols
    except Exception as exc:
        print(f"Warning: Failed to parse Python AST for {relative_path}: {exc}", file=sys.stderr)
        return []
