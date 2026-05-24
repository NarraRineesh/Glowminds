from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from typing import Iterable

_DATA_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "data")
)
_SKILLS_FILE = os.path.join(_DATA_DIR, "skills.json")


_WORD_CHAR_RE = re.compile(r"\w")


def _normalize_alias(alias: str) -> str:
    a = alias.strip()
    if not a:
        return ""
    if "\\" in a:
        return a
    escaped = re.escape(a)
    prefix = "\\b" if _WORD_CHAR_RE.match(a[0]) else ""
    suffix = "\\b" if _WORD_CHAR_RE.match(a[-1]) else ""
    return f"{prefix}{escaped}{suffix}"


@lru_cache(maxsize=1)
def _load_skills_index() -> list[tuple[str, re.Pattern]]:
    with open(_SKILLS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    skills = data.get("skills", [])
    out: list[tuple[str, re.Pattern]] = []
    for row in skills:
        canonical = row.get("canonical", "").strip().lower()
        aliases: Iterable[str] = row.get("aliases", []) or [canonical]
        if not canonical:
            continue
        parts = [_normalize_alias(a) for a in aliases if a]
        if not parts:
            continue
        pat = re.compile("|".join(parts), re.IGNORECASE)
        out.append((canonical, pat))
    return out


def extract_skills(text: str, *, limit: int = 40) -> list[str]:
    if not text:
        return []
    hay = text.lower()
    index = _load_skills_index()
    found: list[str] = []
    seen: set[str] = set()
    for canonical, pat in index:
        if canonical in seen:
            continue
        if pat.search(hay):
            seen.add(canonical)
            found.append(canonical)
            if len(found) >= limit:
                break
    return found


_EXPERIENCE_RE = re.compile(
    r"(\d+)\s*\+?\s*(?:to|-|\u2013|\u2014|\u2010)\s*(\d+)?\s*(?:\+)?\s*(?:year|yr)s?",
    re.IGNORECASE,
)
_MIN_EXPERIENCE_RE = re.compile(
    r"(\d+)\s*\+\s*(?:year|yr)s?", re.IGNORECASE
)
_SINGLE_EXPERIENCE_RE = re.compile(
    r"(\d+)\s*(?:year|yr)s?\s+(?:of\s+)?(?:experience|exp)",
    re.IGNORECASE,
)


def extract_experience(text: str) -> str:
    if not text:
        return ""
    m = _EXPERIENCE_RE.search(text)
    if m:
        low = m.group(1)
        high = m.group(2)
        if high:
            return f"{low}-{high} years"
        return f"{low}+ years"
    m = _MIN_EXPERIENCE_RE.search(text)
    if m:
        return f"{m.group(1)}+ years"
    m = _SINGLE_EXPERIENCE_RE.search(text)
    if m:
        return f"{m.group(1)}+ years"
    return ""


_SENIORITY_KEYWORDS = (
    ("lead", re.compile(r"\b(staff|principal|distinguished|lead|head of|director)\b", re.IGNORECASE)),
    ("senior", re.compile(r"\b(senior|sr\.?|sde\s*ii|sde\s*iii|sde\s*iv)\b", re.IGNORECASE)),
    ("junior", re.compile(r"\b(junior|jr\.?|intern|trainee|graduate|fresher|entry[- ]level|sde\s*i)\b", re.IGNORECASE)),
)


def classify_seniority(text: str) -> str:
    if not text:
        return "mid"
    for bucket, pat in _SENIORITY_KEYWORDS:
        if pat.search(text):
            return bucket
    return "mid"


_ROLE_KEYWORDS = (
    ("data", re.compile(r"\b(data engineer|data scientist|analytics engineer|machine learning|\bml engineer\b|ai engineer|data analyst)\b", re.IGNORECASE)),
    ("devops", re.compile(r"\b(devops|sre|site reliability|platform engineer|infrastructure)\b", re.IGNORECASE)),
    ("frontend", re.compile(r"\b(frontend|front[- ]end|ui developer|react developer)\b", re.IGNORECASE)),
    ("backend", re.compile(r"\b(backend|back[- ]end|api developer|server[- ]side)\b", re.IGNORECASE)),
    ("mobile", re.compile(r"\b(android|ios|mobile developer|react native|flutter)\b", re.IGNORECASE)),
    ("design", re.compile(r"\b(ux designer|ui designer|product designer|visual designer)\b", re.IGNORECASE)),
    ("product", re.compile(r"\b(product manager|product owner|associate product manager|\bapm\b)\b", re.IGNORECASE)),
    ("qa", re.compile(r"\b(qa engineer|test engineer|sdet|automation engineer)\b", re.IGNORECASE)),
    ("engineering", re.compile(r"\b(software engineer|swe|full[- ]stack|developer)\b", re.IGNORECASE)),
)


def classify_role(text: str) -> str:
    if not text:
        return "engineering"
    for bucket, pat in _ROLE_KEYWORDS:
        if pat.search(text):
            return bucket
    return "engineering"


_EMPLOYMENT_KEYWORDS = (
    ("internship", re.compile(r"\bintern(?:ship)?\b", re.IGNORECASE)),
    ("contract", re.compile(r"\b(contract|contractor|freelance)\b", re.IGNORECASE)),
    ("part-time", re.compile(r"\bpart[- ]time\b", re.IGNORECASE)),
)


def classify_employment(text: str) -> str:
    if not text:
        return "full-time"
    for bucket, pat in _EMPLOYMENT_KEYWORDS:
        if pat.search(text):
            return bucket
    return "full-time"


def is_remote(text: str) -> bool:
    if not text:
        return False
    return bool(re.search(r"\b(remote|work from home|wfh)\b", text, re.IGNORECASE))


def derive_search_text(text: str, skills: list[str], *, max_chars: int = 500) -> str:
    head = (text or "")[:max_chars].lower()
    tail = " ".join(skills)
    return " ".join(part for part in [head, tail] if part).strip()
