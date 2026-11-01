#!/usr/bin/env python3
"""Build the offline passive tree display bundle from a pinned PoB checkout.

Build dependencies: Python 3.12+, Pillow >= 11, zstandard >= 0.23.
Example:
  python scripts/prepare-tree-assets.py --pob-root /path/to/PathOfBuilding-PoE2 \
    --source-revision <commit> --versions 0_5 --output resources/passive-tree

PoB's ddsCoords values are ONE-BASED DDS texture-array layers, not atlas UVs.
This script decodes each array layer, preserving mip-chain offsets, and packs
small textures into a bounded atlas. The app reads one tree document and loads
each atlas once; there are no per-node knowledge-server or network requests.
The raw tree remains the authority for geometry, connections and artwork names.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import re
import shutil
import struct
import subprocess
import time

from PIL import Image
import zstandard


SCHEMA_VERSION = 1
MAX_ATLAS_EDGE = 4096
GUTTER = 2
SINGLE_TEXTURE_EDGE = 1024
PORTRAIT_MAX_EDGE = 1024
CENTER_MAX_EDGE = 2048


def resolve_source_revision(pob_root: Path, revision: str) -> str:
    """Record a full source commit and reject a checkout/revision mismatch.

    A frozen source bundle has no .git metadata; require its caller to provide
    the complete 40-character revision rather than silently trust a prefix.
    Never discover an unrelated parent Git repository for a frozen bundle.
    """
    if not re.fullmatch(r"[0-9a-fA-F]{7,40}", revision):
        raise ValueError("--source-revision must be a hexadecimal commit ID (7 to 40 characters)")
    revision = revision.lower()
    if not (pob_root / ".git").exists():
        if len(revision) != 40:
            raise ValueError("A frozen source without .git requires the full 40-character --source-revision")
        return revision

    def git_value(*args: str) -> str:
        try:
            completed = subprocess.run(["git", "-C", str(pob_root), *args], check=True,
                                       text=True, capture_output=True, timeout=20)
        except (OSError, subprocess.SubprocessError) as error:
            raise ValueError(f"Cannot verify the source Git revision: {error}") from error
        return completed.stdout.strip()

    if Path(git_value("rev-parse", "--show-toplevel")).resolve() != pob_root.resolve():
        raise ValueError("--pob-root must name the root of its own source Git checkout")
    head = git_value("rev-parse", "--verify", "HEAD^{commit}")
    resolved = git_value("rev-parse", "--verify", revision + "^{commit}")
    if not re.fullmatch(r"[0-9a-f]{40}", resolved):
        raise ValueError("The source Git repository did not return a full 40-character commit")
    if resolved != head:
        raise ValueError(f"Source revision {resolved} does not match the checked-out source HEAD {head}")
    return resolved


def relative_file(root: Path, name: str) -> Path:
    """Accept data-file paths only within the explicit source directory."""
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Asset path escapes its source directory: {name!r}")
    if not path.is_file():
        raise FileNotFoundError(path)
    return path


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def json_write(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def dds_layers(data: bytes) -> tuple[int, int, int, list[bytes]]:
    """Extract DDS DX10 texture arrays without losing the mip-chain stride.

    DDS header fields are little-endian, the DX10 extension starts at byte 128,
    and its arraySize is at byte 140. Every layer contains the same complete mip
    chain. Pillow decodes the first mip; each standalone layer header therefore
    gets arraySize=1, while the payload retains that layer's full mip chain.
    """
    if data[:4] != b"DDS " or len(data) < 148 or data[84:88] != b"DX10":
        raise ValueError("Expected a DDS file with a DX10 texture-array header")
    height, width = struct.unpack_from("<II", data, 12)
    dxgi, dimension, misc, count, _ = struct.unpack_from("<IIIII", data, 128)
    if dimension != 3 or misc & 4 or count < 1:
        raise ValueError("Only 2D, non-cubemap texture arrays are supported")
    if dxgi not in (28, 71, 72, 74, 75, 77, 78, 80, 81, 83, 84, 95, 96, 98, 99):
        raise ValueError(f"Unsupported DDS DXGI format: {dxgi}")
    payload_size = len(data) - 148
    if payload_size % count:
        raise ValueError("DDS array payload does not contain equal-sized mip chains")
    stride = payload_size // count
    if width < 1 or height < 1 or width > 8192 or height > 8192:
        raise ValueError(f"Unexpected DDS dimensions: {width} x {height}")
    header = bytearray(data[:148])
    struct.pack_into("<I", header, 140, 1)
    return width, height, count, [bytes(header) + data[148 + index * stride:148 + (index + 1) * stride] for index in range(count)]


def image_decode(data: bytes) -> Image.Image:
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        return image.convert("RGBA")


def asset_entry(file: str, width: int, height: int, x: int = 0, y: int = 0) -> dict:
    return {"file": file, "mime": "image/webp", "width": width, "height": height, "x": x, "y": y}


def write_webp(image: Image.Image, path: Path, *, background: bool = False) -> None:
    # Sprites and their alpha are lossless. Large artwork uses high-quality WebP
    # to keep a complete offline map inexpensive to distribute and decode.
    image.save(path, "WEBP", lossless=not background, quality=92, method=4, exact=True)


def safe_stem(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "-", Path(name).name.split(".", 1)[0])


def paste_with_gutter(atlas: Image.Image, image: Image.Image, x: int, y: int) -> None:
    """Extrude a border so bilinear filtering cannot bleed adjacent sprites."""
    width, height = image.size
    atlas.paste(image, (x, y))
    atlas.paste(image.crop((0, 0, 1, height)).resize((GUTTER, height)), (x - GUTTER, y))
    atlas.paste(image.crop((width - 1, 0, width, height)).resize((GUTTER, height)), (x + width, y))
    atlas.paste(image.crop((0, 0, width, 1)).resize((width, GUTTER)), (x, y - GUTTER))
    atlas.paste(image.crop((0, height - 1, width, height)).resize((width, GUTTER)), (x, y + height))
    for sx, sy, tx, ty in ((0, 0, x - GUTTER, y - GUTTER), (width - 1, 0, x + width, y - GUTTER),
                           (0, height - 1, x - GUTTER, y + height), (width - 1, height - 1, x + width, y + height)):
        atlas.paste(image.crop((sx, sy, sx + 1, sy + 1)).resize((GUTTER, GUTTER)), (tx, ty))


def convert_array(path: Path, coords: dict[str, int], output: Path) -> dict[str, dict]:
    compressed = path.read_bytes()
    decompressed = zstandard.ZstdDecompressor().decompress(compressed, max_output_size=512 * 1024 * 1024)
    width, height, count, layers = dds_layers(decompressed)
    indices = sorted(set(coords.values()))
    if any(not isinstance(index, int) or index < 1 or index > count for index in indices):
        raise ValueError(f"Invalid DDS slice reference in {path.name}")
    names_by_index: dict[int, list[str]] = {}
    for name, index in coords.items():
        names_by_index.setdefault(index, []).append(name)
    stem = safe_stem(path.name)
    result: dict[str, dict] = {}
    if max(width, height) > SINGLE_TEXTURE_EDGE:
        for index in indices:
            file = f"{stem}-{index:03d}.webp"
            image = image_decode(layers[index - 1])
            max_edge = CENTER_MAX_EDGE if max(width, height) >= 4000 else PORTRAIT_MAX_EDGE
            image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
            write_webp(image, output / file, background=True)
            for name in names_by_index[index]:
                result[name] = asset_entry(file, image.width, image.height)
        return result

    tile_width, tile_height = width + GUTTER * 2, height + GUTTER * 2
    columns = min(MAX_ATLAS_EDGE // tile_width, max(1, math.ceil(math.sqrt(len(indices) * tile_height / tile_width))))
    rows = MAX_ATLAS_EDGE // tile_height
    capacity = columns * rows
    for page, offset in enumerate(range(0, len(indices), capacity)):
        page_indices = indices[offset:offset + capacity]
        used_rows = math.ceil(len(page_indices) / columns)
        used_columns = min(columns, len(page_indices))
        atlas = Image.new("RGBA", (used_columns * tile_width, used_rows * tile_height))
        file = f"{stem}-atlas-{page:02d}.webp"
        for position, index in enumerate(page_indices):
            x = (position % columns) * tile_width + GUTTER
            y = (position // columns) * tile_height + GUTTER
            image = image_decode(layers[index - 1])
            paste_with_gutter(atlas, image, x, y)
            for name in names_by_index[index]:
                result[name] = asset_entry(file, width, height, x, y)
        write_webp(atlas, output / file)
    return result


def convert_single(path: Path, output: Path) -> dict:
    with Image.open(path) as image:
        image.load()
        file = safe_stem(path.name) + ".webp"
        write_webp(image.convert("RGBA"), output / file)
        return asset_entry(file, image.width, image.height)


def collect_references(tree: dict) -> set[str]:
    references: set[str] = {"Background2", "BGTree", "BGTreeActive", "AscendancyMiddle"}
    for overlay in tree.get("nodeOverlay", {}).values():
        references.update(value for value in overlay.values() if isinstance(value, str))
    for node in tree["nodes"].values():
        if not isinstance(node, dict):
            continue
        # Decorative OnlyImage nodes render activeEffectImage; their obsolete
        # mastery 'icon' paths are deliberately absent from the upstream atlas.
        for key in (("activeEffectImage",) if node.get("isOnlyImage") else ("icon", "activeEffectImage")):
            if node.get(key):
                references.add(node[key])
        references.update(value for value in node.get("nodeOverlay", {}).values() if isinstance(value, str))
    for group in tree["groups"].values():
        if not isinstance(group, dict):
            continue
        if group.get("background", {}).get("image"):
            references.add(group["background"]["image"])
    for character in tree["classes"]:
        for entry in [character, *character.get("ascendancies", [])]:
            if entry.get("background", {}).get("image"):
                references.add(entry["background"]["image"])
    return references


def reusable_bundles(output_root: Path) -> list[tuple[Path, dict, dict]]:
    bundles = []
    expected_conversion = {"portraitMaxEdge": PORTRAIT_MAX_EDGE, "centerMaxEdge": CENTER_MAX_EDGE,
                           "atlasMaxEdge": MAX_ATLAS_EDGE, "atlasGutter": GUTTER, "spritesLossless": True}
    for manifest_path in sorted(output_root.glob("*/manifest.json")):
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if manifest.get("conversion") != expected_conversion:
                continue
            tree = json.loads((manifest_path.parent / "tree.json").read_text(encoding="utf-8"))
            bundles.append((manifest_path.parent, manifest, tree))
        except (OSError, ValueError):
            # An interrupted bundle is never a cache source.
            continue
    return bundles


def reuse_array(bundles: list, file: str, digest: str, coords: dict, output: Path) -> dict | None:
    for directory, manifest, tree in bundles:
        if manifest.get("source", {}).get("files", {}).get(file) != digest:
            continue
        if tree.get("ddsCoords", {}).get(file) != coords:
            continue
        entries = {name: manifest["assets"].get(name) for name in coords}
        if any(entry is None for entry in entries.values()):
            continue
        # Asset names can exist in both disabled and enabled containers. Only
        # reuse the cache if every cached entry belongs to this container.
        stem = safe_stem(file)
        if any(not entry["file"].startswith(stem + "-") for entry in entries.values()):
            continue
        files = {entry["file"] for entry in entries.values()}
        if not all((directory / name).is_file() for name in files):
            continue
        for name in files:
            source = relative_file(directory, name)
            destination = output / name
            if source != destination.resolve():
                shutil.copyfile(source, destination)
        return entries
    return None


def build_version(pob_root: Path, version: str, output_root: Path, revision: str) -> dict:
    started = time.perf_counter()
    source = pob_root / "src" / "TreeData" / version
    tree_path = relative_file(source, "tree.json")
    tree = json.loads(tree_path.read_text(encoding="utf-8-sig"))
    # JSON arrays become 1-based arrays when PoB's Lua loader reads them. Export
    # explicit keys so browser code cannot accidentally offset every group by 1.
    if isinstance(tree["groups"], list):
        tree["groups"] = {str(index): group for index, group in enumerate(tree["groups"], start=1) if group is not None}
    output = output_root / version
    output.mkdir(parents=True, exist_ok=True)
    cache = reusable_bundles(output_root)
    assets: dict[str, dict] = {}
    source_hashes: dict[str, str] = {"tree.json": sha256(tree_path)}
    # PoB precedence: ddsMap > assets > spriteMap.
    containers = sorted(tree.get("ddsCoords", {}).items())
    owners = {name: file for file, coords in containers for name in coords}
    for file, coords in containers:
        path = relative_file(source, file)
        source_hashes[file] = sha256(path)
        if all(owners[name] != file for name in coords):
            continue
        assets.update(reuse_array(cache, file, source_hashes[file], coords, output) or convert_array(path, coords, output))
    singles: dict[str, dict] = {}
    for name, data in sorted(tree.get("assets", {}).items()):
        file = data[0]
        if file not in singles:
            path = relative_file(source, file)
            source_hashes[file] = sha256(path)
            singles[file] = convert_single(path, output)
        assets.setdefault(name, singles[file])
    for file, coords in sorted(tree.get("spriteCoords", {}).items()):
        if file not in singles:
            path = relative_file(source, file)
            source_hashes[file] = sha256(path)
            singles[file] = convert_single(path, output)
        for name, rect in coords.items():
            assets.setdefault(name, {**singles[file], "x": rect["x"], "y": rect["y"], "width": rect["w"], "height": rect["h"]})
    missing = sorted(collect_references(tree) - assets.keys())
    # Missing references may exist upstream, but known assets must never silently
    # disappear during conversion. Export diagnostics alongside original data.
    tree_output = output / "tree.json"
    json_write(tree_output, tree)
    tree_file_sha256 = sha256(tree_output)
    files = sorted({entry["file"] for entry in assets.values()})
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "version": version,
        "treeFile": "tree.json",
        "assets": dict(sorted(assets.items())),
        "source": {
            "project": "PathOfBuildingCommunity/PathOfBuilding-PoE2",
            "url": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2",
            "commit": revision,
            "treeSha256": source_hashes["tree.json"],
            "files": source_hashes,
        },
        "treeFileSha256": tree_file_sha256,
        "diagnostics": {"missingArtwork": missing},
        "conversion": {"portraitMaxEdge": PORTRAIT_MAX_EDGE, "centerMaxEdge": CENTER_MAX_EDGE,
                       "atlasMaxEdge": MAX_ATLAS_EDGE, "atlasGutter": GUTTER, "spritesLossless": True},
        "counts": {"nodes": len(tree["nodes"]), "assetNames": len(assets), "imageFiles": len(files)},
    }
    json_write(output / "manifest.json", manifest)
    # This version directory is generated output. Remove only obsolete WebP
    # files within this exact resolved directory; never traverse other paths.
    for obsolete in output.glob("*.webp"):
        if obsolete.name not in files:
            resolved = obsolete.resolve()
            if resolved.parent != output.resolve():
                raise ValueError(f"Refusing to remove output outside its version directory: {resolved}")
            resolved.unlink()
    shutil.copyfile(pob_root / "LICENSE.md", output / "POB-LICENSE.md")
    (output / "ATTRIBUTION.md").write_text(
        "Passive tree data and artwork are derived from Path of Building Community (PoE2).\n"
        "Source: https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2\n"
        f"Source revision: {revision}; tree version: {version}.\n"
        "PoB software copyright (c) 2016 David Gowor and contributors; see POB-LICENSE.md.\n"
        "Path of Exile artwork, names, and game data belong to Grinding Gear Games.\n"
        "This bundle preserves source artwork attribution; the software license does not transfer ownership of game artwork.\n"
        "Conversion: DDS/Zstandard texture-array layers decoded to WebP; small layers packed with 2px atlas gutters.\n"
        "Class portraits capped at 1024px and center backgrounds at 2048px; original display dimensions remain in tree.json.\n",
        encoding="utf-8",
    )
    result = {"version": version, **manifest["counts"], "imageBytes": sum((output / file).stat().st_size for file in files),
              "missingArtwork": len(missing), "seconds": round(time.perf_counter() - started, 2)}
    print(json.dumps(result), flush=True)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pob-root", type=Path, required=True, help="Pinned PoB repository root containing src/TreeData")
    parser.add_argument("--source-revision", required=True, help="Pinned source commit; normalized to full SHA in Git, full 40-character SHA required for frozen sources")
    parser.add_argument("--versions", nargs="+", default=["0_5"], help="Tree folder versions, or 'all'")
    parser.add_argument("--output", type=Path, default=Path("resources/passive-tree"))
    args = parser.parse_args()
    pob_root = args.pob_root.resolve()
    try:
        revision = resolve_source_revision(pob_root, args.source_revision)
    except ValueError as error:
        parser.error(str(error))
    versions = args.versions
    if versions == ["all"]:
        versions = sorted(path.name for path in (pob_root / "src" / "TreeData").iterdir() if re.fullmatch(r"\d+_\d+", path.name))
    if any(not re.fullmatch(r"\d+_\d+", version) for version in versions):
        parser.error("Versions must be folder identifiers such as 0_5")
    if not (pob_root / "LICENSE.md").is_file():
        parser.error("The source repository must include LICENSE.md for redistribution attribution")
    for version in versions:
        build_version(pob_root, version, args.output.resolve(), revision)


if __name__ == "__main__":
    main()
