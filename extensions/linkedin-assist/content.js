// [v2:linkedin] Content script — extract public-facing profile fields on /in/*
(function () {
  function textOf(sel) {
    const el = document.querySelector(sel)
    return (el?.innerText || '').trim()
  }

  function extract() {
    const headline =
      textOf('.text-body-medium.break-words') ||
      textOf('[data-generated-suggestion-target]') ||
      textOf('div.ph5.pb5 > div.mt2 > div.text-body-medium')
    const about =
      textOf('#about ~ .display-flex .inline-show-more-text') ||
      textOf('section.pv-about-section .inline-show-more-text') ||
      ''
    const experienceBlocks = [...document.querySelectorAll('#experience ~ .pvs-list__outer-container li, section#experience li')]
      .slice(0, 6)
      .map((li) => (li.innerText || '').replace(/\n+/g, ' · ').trim())
      .filter(Boolean)
    return {
      source: 'glowminds-linkedin-assist',
      url: location.href,
      headline,
      about,
      experience: experienceBlocks.join('\n\n'),
      extractedAt: new Date().toISOString(),
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'GM_EXTRACT_PROFILE') {
      try {
        sendResponse({ ok: true, data: extract() })
      } catch (err) {
        sendResponse({ ok: false, error: String(err?.message || err) })
      }
    }
    return true
  })
})()
