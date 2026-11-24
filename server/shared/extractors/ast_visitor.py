"""
Python AST Visitor.
Extracts classes, methods, docstrings, decorators, parameters, return types, and async flags.
"""

from __future__ import annotations

import ast
from pathlib import Path
from typing import Any, Dict, List, Optional


class PythonSymbolVisitor(ast.NodeVisitor):
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
        params = [a.arg for a in node.args.args]
        docstring = ast.get_docstring(node) or ""
        decorators = [ast.unparse(d) for d in node.decorator_list]
        ret = ast.unparse(node.returns) if node.returns else None

        prefix = "async def" if is_async else "def"
        sig = f"{prefix} {node.name}({', '.join(params)})"
        if ret:
            sig += f" -> {ret}:"
        else:
            sig += ":"

        fn_info: Dict[str, Any] = {
            "name": node.name,
            "signature": sig,
            "docstring": docstring,
            "params": ", ".join(params),
            "returnType": ret,
            "decorators": decorators,
            "isAsync": is_async,
            "line": node.lineno,
            "file": self.relative_path,
        }

        if self._current_class:
            self._current_class["methods"].append(fn_info)
        else:
            self.symbols.append({
                "language": "python",
                "kind": "function",
                **fn_info,
            })


def parse_python_symbols(file_path: Path, relative_path: str) -> List[Dict[str, Any]]:
    """Parses a Python file to extract top-level and class AST symbols."""
    try:
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(file_path))
        visitor = PythonSymbolVisitor(relative_path)
        visitor.visit(tree)
        return visitor.symbols
    except Exception:
        return []
