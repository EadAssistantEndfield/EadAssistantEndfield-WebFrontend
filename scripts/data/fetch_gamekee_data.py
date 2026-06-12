#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 GameKee 网站获取明日方舟终末地基建设备数据

功能：
- 使用 Playwright 渲染 SPA 页面，动态获取设备列表
- 从每个设备详情页解析属性（占地面积、功率等）
- 并发下载设备图片，支持重试和增量更新
- 输出 all-buildings.json（前端 buildingCatalog.ts 直接消费）
- 按设备类型生成 by_type/*.json 分类文件
"""

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image, UnidentifiedImageError
import requests
from playwright.sync_api import sync_playwright

LIST_URL = "https://www.gamekee.com/zmd/second/204958"
NAME_PREFIX = "明日方舟·终末地"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Referer": "https://www.gamekee.com/",
}
MAX_IMAGE_WORKERS = 4
RETRY_COUNT = 3
RETRY_DELAY = 2
REQUEST_TIMEOUT = 30
DETAIL_PAGE_DELAY = 0.5
IMAGE_EXTENSION = ".webp"
WEBP_QUALITY = 90
WEBP_METHOD = 6

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "data" / "gamekee_buildings"

ATTR_LABEL_MAP = {
    "设备类型": "deviceType",
    "耗电功率值": "power",
    "耗电功率": "power",
    "占用面积": "footprint",
    "协议容量消耗": "protocolCapacity",
    "电线长度": "wireLength",
    "供电范围": "supplyRange",
    "设备用途": "purpose",
}

KNOWN_ATTR_FIELDS = {"deviceType", "power", "footprint", "protocolCapacity", "wireLength", "supplyRange", "purpose"}
LEGACY_IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg")


def clean_name(raw: str) -> str:
    if raw.startswith(NAME_PREFIX):
        return raw[len(NAME_PREFIX):].strip()
    return raw.strip()


def collect_device_links(page) -> list[dict]:
    """从渲染后的列表页提取设备条目"""
    page.goto(LIST_URL, timeout=30000)
    page.wait_for_timeout(3000)

    devices = []
    seen = set()

    for link in page.query_selector_all("a[href*='/zmd/']"):
        href = link.get_attribute("href") or ""
        if "/second/" in href or not href.endswith(".html"):
            continue

        img = link.query_selector("img")
        if not img:
            continue

        raw_name = img.get_attribute("alt") or ""
        name = clean_name(raw_name)
        if not name or name in seen:
            continue
        seen.add(name)

        src = img.get_attribute("src") or img.get_attribute("data-src") or ""
        if src:
            src = src.split("?")[0]

        full_url = href if href.startswith("http") else f"https://www.gamekee.com{href}"
        devices.append({"name": name, "image_url": src, "url": full_url})

    return devices


def parse_detail_attrs(page) -> dict:
    """从渲染后的详情页提取设备属性。非设备页面返回 None。"""
    result = {field: "" for field in KNOWN_ATTR_FIELDS}
    result["recommendation"] = ""
    result["unlock"] = ""
    result["sections"] = []

    attr_boxes = page.query_selector_all(".attr-box")
    if not attr_boxes:
        return None

    for box in attr_boxes:
        text = box.inner_text().strip()
        if not text:
            continue
        parts = text.split("\n", 1)
        if len(parts) != 2:
            continue
        label = parts[0].strip()
        value = parts[1].strip()
        field = ATTR_LABEL_MAP.get(label)
        if field:
            result[field] = value

    # Build recommendation from parsed attrs
    parts = []
    for label, field in ATTR_LABEL_MAP.items():
        val = result.get(field, "")
        if val:
            parts.append(f"{label} {val}")
    result["recommendation"] = " ".join(parts)

    # Extract unlock from page text
    body_text = page.inner_text("body")
    for keyword in ["解锁条件"]:
        if keyword in body_text:
            idx = body_text.index(keyword)
            segment = body_text[idx:idx + 100].split("\n")
            if len(segment) > 1:
                result["unlock"] = segment[1].strip()
            break

    # Extract sections from detail content
    detail_sections = page.query_selector_all(".wiki-detail-section, .section-box")
    for section_el in detail_sections:
        title_el = section_el.query_selector("h3, h4, .section-title")
        title = title_el.inner_text().strip() if title_el else ""
        if not title:
            continue
        section_attrs = []
        for box in section_el.query_selector_all(".attr-box"):
            st = box.inner_text().strip()
            sp = st.split("\n", 1)
            if len(sp) == 2:
                section_attrs.append({"label": sp[0].strip(), "value": sp[1].strip()})
        text = section_el.inner_text().strip()
        result["sections"].append({"title": title, "attrs": section_attrs, "text": text})

    return result


def normalize_image_for_webp(image: Image.Image) -> Image.Image:
    """将任意源图片模式转换为适合 WebP 保存的 RGB/RGBA。"""
    has_alpha = image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)
    return image.convert("RGBA" if has_alpha else "RGB")


def save_image_as_webp(content: bytes, output_path: Path) -> None:
    with Image.open(BytesIO(content)) as image:
        normalized = normalize_image_for_webp(image)
        normalized.save(output_path, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)


def remove_legacy_images(webp_path: Path) -> None:
    for extension in LEGACY_IMAGE_EXTENSIONS:
        legacy_path = webp_path.with_suffix(extension)
        if legacy_path.exists():
            legacy_path.unlink()


def image_output_path(name: str, category: str) -> Path:
    return OUTPUT_DIR / "images" / category / f"{name}{IMAGE_EXTENSION}"


def download_image(name: str, url: str, category: str, session: requests.Session) -> bool:
    if not url:
        return False

    if url.startswith("//"):
        url = f"https:{url}"

    cat_dir = OUTPUT_DIR / "images" / category
    cat_dir.mkdir(parents=True, exist_ok=True)
    img_path = image_output_path(name, category)

    if img_path.exists() and img_path.stat().st_size > 0:
        remove_legacy_images(img_path)
        return True

    for attempt in range(1, RETRY_COUNT + 1):
        try:
            resp = session.get(url, headers={**HEADERS, "Referer": "https://www.gamekee.com/"}, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200 and len(resp.content) > 100:
                save_image_as_webp(resp.content, img_path)
                remove_legacy_images(img_path)
                return True
        except (requests.RequestException, UnidentifiedImageError, OSError) as exc:
            print(f"  图片下载异常 [{attempt}/{RETRY_COUNT}] {name}: {exc}")
        if attempt < RETRY_COUNT:
            time.sleep(RETRY_DELAY)

    return False


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "by_type").mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            locale="zh-CN",
        )
        page = context.new_page()

        # Step 1: Collect device links
        print("正在获取设备列表...")
        devices = collect_device_links(page)
        print(f"  找到 {len(devices)} 个设备")

        if not devices:
            print("未找到任何设备，页面结构可能已变化。")
            browser.close()
            return

        # Step 2: Parse each detail page
        print("正在解析设备详情...")
        buildings: list[dict] = []
        failures: list[str] = []
        skipped = 0

        for i, device in enumerate(devices, 1):
            name = device["name"]
            print(f"  [{i}/{len(devices)}] {name}")

            try:
                page.goto(device["url"], timeout=REQUEST_TIMEOUT * 1000)
                page.wait_for_timeout(1500)

                detail = parse_detail_attrs(page)
                if detail is None:
                    skipped += 1
                    continue
                buildings.append({"name": name, "url": device["url"], "image_url": device["image_url"], **detail})
            except Exception as e:
                print(f"    解析失败: {e}")
                failures.append(name)

            time.sleep(DETAIL_PAGE_DELAY)

        browser.close()

    print(f"  跳过 {skipped} 个非设备条目, 解析 {len(buildings)} 个设备, {len(failures)} 个失败")

    # Step 3: Download images concurrently
    print("正在下载设备图片...")
    session = requests.Session()
    image_tasks = [(b["name"], b.get("image_url", ""), b.get("deviceType") or "未分类") for b in buildings if b.get("image_url")]
    failed_downloads = 0

    with ThreadPoolExecutor(max_workers=MAX_IMAGE_WORKERS) as executor:
        futures = {executor.submit(download_image, n, u, c, session): n for n, u, c in image_tasks}
        for future in as_completed(futures):
            name = futures[future]
            if not future.result():
                failed_downloads += 1
                print(f"  图片下载失败: {name}")

    existing_images = sum(1 for name, _, category in image_tasks if image_output_path(name, category).exists())
    print(f"  图片: {existing_images}/{len(image_tasks)} 已存在或下载成功, {failed_downloads} 失败")

    # Step 4: Categorize
    categories_set: dict[str, list[dict]] = {}
    for b in buildings:
        cat = b["deviceType"] or "未分类"
        categories_set.setdefault(cat, []).append(b)

    # Step 5: Write all-buildings.json
    all_buildings = {
        "source": LIST_URL,
        "count": len(buildings),
        "failureCount": len(failures),
        "failures": failures,
        "categories": list(categories_set.keys()),
        "buildings": buildings,
    }
    out_path = OUTPUT_DIR / "all-buildings.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_buildings, f, ensure_ascii=False, indent=2)
    print(f"已保存: {out_path}")

    # Step 6: Write by_type/*.json
    for cat, cat_buildings in categories_set.items():
        cat_path = OUTPUT_DIR / "by_type" / f"{cat}.json"
        with open(cat_path, "w", encoding="utf-8") as f:
            json.dump({"category": cat, "count": len(cat_buildings), "buildings": cat_buildings}, f, ensure_ascii=False, indent=2)

    # Step 7: Write summary.json
    summary = {
        "source": LIST_URL,
        "count": len(buildings),
        "failureCount": len(failures),
        "categories": [{"category": cat, "count": len(bs), "file": f"by_type/{cat}.json"} for cat, bs in categories_set.items()],
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
    }
    with open(OUTPUT_DIR / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n分类统计:")
    for cat, bs in categories_set.items():
        print(f"  {cat}: {len(bs)} 个")
    print(f"总计: {len(buildings)} 个设备, {len(failures)} 个失败")


if __name__ == "__main__":
    main()
