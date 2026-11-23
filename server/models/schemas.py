"""
Typed schemas and data models for workspace portal contracts.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict


class MethodInfo(TypedDict):
    name: str
    signature: str
    docstring: str
    params: str
    returnType: Optional[str]
    decorators: List[str]
    isAsync: bool
    line: int
    file: str


class SymbolInfo(TypedDict, total=False):
    language: str
    kind: str
    name: str
    signature: str
    docstring: str
    decorators: List[str]
    line: int
    file: str
    methods: List[MethodInfo]
    params: str
    returnType: Optional[str]
    properties: List[str]
    isAsync: bool


class CliFlagInfo(TypedDict):
    flag: str
    short: Optional[str]
    type: str
    defaultValue: str
    description: str


class CliToolInfo(TypedDict):
    name: str
    relativePath: str
    description: str
    flags: List[CliFlagInfo]
    usage: str


class ProjectInfo(TypedDict):
    id: str
    title: str
    frontendPort: Optional[int]
    backendPort: Optional[int]
    frontendCmd: str
    backendCmd: Optional[str]
    framework: str
    dbInfo: str
    aiEngine: str


class MarkdownBlock(TypedDict, total=False):
    type: str
    text: str
    id: str
    level: int
    number: int
    language: str
    headers: List[str]
    rows: List[List[str]]
