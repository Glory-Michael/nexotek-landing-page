#!/usr/bin/env python3
"""
Diff two pg_dump --schema-only outputs and emit the additive SQL needed to
migrate a database that matches the FROM dump to one that matches the TO dump.

This sidesteps Payload's drizzle migration generator (which always emits
"from-empty" migrations with destructive DROPs). The output is a series of
CREATE TABLE IF NOT EXISTS / CREATE TYPE (guarded) / CREATE INDEX IF NOT EXISTS
/ ALTER TABLE ADD COLUMN IF NOT EXISTS statements, ordered so ADD COLUMN
happens before any INDEX/CONSTRAINT that depends on the new column.

Usage:
  python3 scripts/diff-schemas.py FROM_DUMP TO_DUMP > OUT.sql
"""
import re
import sys
from collections import OrderedDict
from typing import Dict, List, Tuple

HEADER_RE = re.compile(
    r"^--\s*Name:\s*(?P<name>.+?);\s*Type:\s*(?P<type>[A-Z\s]+);\s*Schema:\s*(?P<schema>\S+);",
    re.MULTILINE,
)


def parse_dump(path: str) -> "OrderedDict[Tuple[str, str], str]":
    """Return OrderedDict mapping (object_name, object_type) -> SQL block."""
    with open(path, "r") as f:
        text = f.read()
    matches = list(HEADER_RE.finditer(text))
    blocks: "OrderedDict[Tuple[str, str], str]" = OrderedDict()
    for i, m in enumerate(matches):
        name = m.group("name").strip()
        type_ = m.group("type").strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end].rstrip() + "\n"
        key = (name, type_)
        if key in blocks:
            blocks[key] = blocks[key].rstrip() + "\n\n" + block
        else:
            blocks[key] = block
    return blocks


def extract_columns(table_block: str) -> "OrderedDict[str, str]":
    """Pull column-name -> column-definition from a CREATE TABLE block."""
    cols: "OrderedDict[str, str]" = OrderedDict()
    m = re.search(r"CREATE TABLE [^\(]+\(\s*\n", table_block, re.MULTILINE)
    if not m:
        return cols
    body = table_block[m.end():]
    depth = 1
    raw_lines: List[str] = []
    for line in body.splitlines():
        depth += line.count("(") - line.count(")")
        if depth <= 0:
            break
        raw_lines.append(line)
    for raw in raw_lines:
        s = raw.strip().rstrip(",").strip()
        if not s:
            continue
        if s.upper().startswith((
            "CONSTRAINT", "PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK", "EXCLUDE",
        )):
            continue
        first = s.split()[0]
        col_name = first.strip('"')
        cols[col_name] = s
    return cols


def header_line(block: str) -> str:
    m = HEADER_RE.search(block)
    return m.group(0) if m else "-- (unknown)"


def emit_key(key: Tuple[str, str], to_blocks: "OrderedDict[Tuple[str, str], str]") -> str:
    """Render the SQL block for a new object with idempotent guards."""
    name, type_ = key
    block = to_blocks[key]

    # Idempotency: CREATE TABLE IF NOT EXISTS
    block = re.sub(
        r"^(CREATE TABLE)(\s+)([\"\w\.]+)",
        lambda m: f"{m.group(1)} IF NOT EXISTS{m.group(2)}{m.group(3)}",
        block,
        flags=re.MULTILINE,
    )

    # CREATE TYPE doesn't support IF NOT EXISTS — wrap in DO $$ guard.
    type_m = re.search(
        r"CREATE TYPE\s+([\"\w\.]+)\s+AS\s+([^\;]+);",
        to_blocks[key],
        re.DOTALL,
    )
    if type_ == "TYPE" and type_m:
        t_name = type_m.group(1)
        t_body = type_m.group(2).strip()
        return (
            f"{header_line(to_blocks[key]).strip()}\n"
            f"DO $$ BEGIN\n"
            f"  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '"
            f"{t_name.split('.')[-1]}') THEN\n"
            f"    CREATE TYPE {t_name} AS {t_body};\n"
            f"  END IF;\n"
            f"END $$;\n"
        )

    # CREATE INDEX [UNIQUE] IF NOT EXISTS
    block = re.sub(
        r"^(CREATE\s+(?:UNIQUE\s+)?INDEX)(\s+)([\"\w\.]+)",
        lambda m: f"{m.group(1)} IF NOT EXISTS{m.group(2)}{m.group(3)}",
        block,
        flags=re.MULTILINE,
    )

    # ALTER TABLE ... ADD CONSTRAINT — wrap with conname guard.
    if type_ in ("CONSTRAINT", "FK CONSTRAINT"):
        cname_m = re.search(r"ADD CONSTRAINT (?:IF NOT EXISTS )?([\"\w]+)", block)
        if cname_m:
            cname = cname_m.group(1).strip('"')
            # Extract the actual ALTER TABLE statement (single line in pg_dump).
            stmt_m = re.search(r"(ALTER TABLE [^;]+;)", block, re.DOTALL)
            if stmt_m:
                stmt = stmt_m.group(1).strip()
                return (
                    f"{header_line(to_blocks[key]).strip()}\n"
                    f"DO $$ BEGIN\n"
                    f"  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{cname}') THEN\n"
                    f"    {stmt}\n"
                    f"  END IF;\n"
                    f"END $$;\n"
                )

    return block.rstrip() + "\n"


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: diff-schemas.py FROM_DUMP TO_DUMP", file=sys.stderr)
        return 2
    from_path, to_path = sys.argv[1], sys.argv[2]
    from_blocks = parse_dump(from_path)
    to_blocks = parse_dump(to_path)

    # New objects = present in TO, missing in FROM.
    new_keys: List[Tuple[str, str]] = [k for k in to_blocks if k not in from_blocks]

    # Diff columns for tables present in both.
    add_column_blocks: List[str] = []
    for key, to_block in to_blocks.items():
        if key[1] != "TABLE":
            continue
        if key not in from_blocks:
            continue
        from_cols = extract_columns(from_blocks[key])
        to_cols = extract_columns(to_block)
        added = [c for c in to_cols if c not in from_cols]
        if not added:
            continue
        lines = [f"-- Added columns on table {key[0]}"]
        for col in added:
            defn = to_cols[col]
            lines.append(f"ALTER TABLE {key[0]} ADD COLUMN IF NOT EXISTS {defn};")
        add_column_blocks.append("\n".join(lines) + "\n")

    # Ordering: types/tables/sequences/defaults FIRST, then ADD COLUMN, then
    # indexes/constraints — otherwise an INDEX that references a newly-added
    # column on an existing table fails.
    PRE_COLUMN = {"TYPE", "FUNCTION", "TABLE", "SEQUENCE", "SEQUENCE OWNED BY", "DEFAULT"}
    POST_COLUMN = {"CONSTRAINT", "INDEX", "FK CONSTRAINT", "TRIGGER"}

    pre_keys = [k for k in new_keys if k[1] in PRE_COLUMN]
    post_keys = [k for k in new_keys if k[1] in POST_COLUMN]
    leftover_keys = [k for k in new_keys if k[1] not in PRE_COLUMN and k[1] not in POST_COLUMN]

    # Within each group, preserve TO-dump order.
    to_position = {key: i for i, key in enumerate(to_blocks)}
    pre_keys.sort(key=lambda k: to_position[k])
    post_keys.sort(key=lambda k: to_position[k])
    leftover_keys.sort(key=lambda k: to_position[k])

    out: List[str] = []
    out.append("-- Generated by scripts/diff-schemas.py")
    out.append(f"-- FROM: {from_path}")
    out.append(f"-- TO:   {to_path}")
    out.append("")

    if pre_keys:
        out.append("-- =========================================")
        out.append("-- NEW TYPES, TABLES, SEQUENCES, DEFAULTS")
        out.append("-- =========================================\n")
        for key in pre_keys:
            out.append(emit_key(key, to_blocks))

    if add_column_blocks:
        out.append("-- =========================================")
        out.append("-- ADDED COLUMNS on existing tables")
        out.append("-- =========================================\n")
        out.extend(add_column_blocks)

    if post_keys:
        out.append("-- =========================================")
        out.append("-- NEW INDEXES, CONSTRAINTS, TRIGGERS")
        out.append("-- =========================================\n")
        for key in post_keys:
            out.append(emit_key(key, to_blocks))

    if leftover_keys:
        out.append("-- =========================================")
        out.append("-- OTHER NEW OBJECTS")
        out.append("-- =========================================\n")
        for key in leftover_keys:
            out.append(emit_key(key, to_blocks))

    out.append("-- End of additive diff.\n")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
