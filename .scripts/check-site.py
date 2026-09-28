#!/usr/bin/env python3
"""Check publication boundaries and existing article URLs after a Jekyll build."""

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
ORIGIN = "https://fwx2233.github.io"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = []
        self.lang = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag in ("img", "script") and attrs.get("src"):
            self.resources.append(attrs["src"])
        if tag == "link" and attrs.get("rel") in ("stylesheet", "preload"):
            self.resources.append(attrs["href"])


errors = []
for name in ("temp", "docs", "forms-by-example", "README", "CHANGELOG",
             "node_modules", "vendor", "Gemfile", "Gemfile.lock", "package.json",
             "package-lock.json", "webpack.config.js", "jekyll-theme-hydejack.gemspec"):
    for candidate in (SITE / name, SITE / (name + ".html"), SITE / (name + ".md")):
        if candidate.exists():
            errors.append(f"Unpublished material was generated: {candidate}")

historical = json.loads((ROOT / ".scripts/historical-post-urls.json").read_text())
for path in historical:
    if not (SITE / unquote(path).lstrip("/") / "index.html").is_file():
        errors.append(f"Existing article URL disappeared: {path}")

for filename in SITE.rglob("*.html"):
    parser = Page()
    parser.feed(filename.read_text())
    page_url = ORIGIN + "/" + filename.relative_to(SITE).as_posix()
    for resource in parser.resources:
        resolved = urlparse(urljoin(page_url, resource))
        if resolved.netloc == "fwx2233.github.io":
            target = SITE / unquote(resolved.path).lstrip("/")
            if not target.is_file():
                errors.append(f"Missing resource in {filename.relative_to(SITE)}: {resource}")

home = (SITE / "index.html").read_text()
about = (SITE / "about/index.html").read_text()
home_parser = Page()
home_parser.feed(home)
if home_parser.lang != "zh-CN" or "The official Hydejack blog" in home:
    errors.append("Homepage language or metadata regressed")
for text in ("2019", "2023", "博士", "LLM/Agent for Security"):
    if text not in about:
        errors.append(f"Missing profile detail: {text}")
for required in ("page-2/index.html", "page-8/index.html", "feed.xml", "sitemap.xml",
                 "tag/hyde/index.html", "tag/hydejack/index.html"):
    if not (SITE / required).is_file():
        errors.append(f"Missing generated page: {required}")
for name in ("feed.xml", "sitemap.xml"):
    ET.parse(SITE / name)
for node in ET.parse(SITE / "sitemap.xml").iter():
    if node.tag.endswith("}loc") and any(
        part in (node.text or "") for part in ("/temp/", "/docs/", "/forms-by-example")
    ):
        errors.append(f"Excluded page is in sitemap: {node.text}")

if errors:
    raise SystemExit("\n".join(errors))
print(f"Site checks passed: {len(historical)} historical article URLs, local resources, "
      "profile, pagination, feeds and publication boundaries.")
