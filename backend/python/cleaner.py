from __future__ import annotations

from bs4 import BeautifulSoup


_ENTITY_TAG_RE = (
    ("&nbsp;", " "),
    ("&amp;", "&"),
    ("&lt;", "<"),
    ("&gt;", ">"),
    ("&quot;", '"'),
    ("&#39;", "'"),
    ("&#x27;", "'"),
    ("&apos;", "'"),
)


def _decode_entities(s: str) -> str:
    out = s
    for src, dst in _ENTITY_TAG_RE:
        out = out.replace(src, dst)
    return out


def clean_html(html: str) -> str:
    if not html:
        return ""

    pre = _decode_entities(html)
    try:
        soup = BeautifulSoup(pre, "lxml")
    except Exception:
        soup = BeautifulSoup(pre, "html.parser")

    for s in soup(["script", "style", "noscript"]):
        s.decompose()

    text = soup.get_text(separator=" ", strip=True)
    return " ".join(text.split())
