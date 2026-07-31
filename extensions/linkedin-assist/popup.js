const status = document.getElementById('status')

document.getElementById('extract').addEventListener('click', async () => {
  status.textContent = 'Extracting…'
  status.className = 'hint'
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !/linkedin\.com\/in\//i.test(tab.url || '')) {
      throw new Error('Open a linkedin.com/in/… profile first')
    }
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GM_EXTRACT_PROFILE' })
    if (!res?.ok) throw new Error(res?.error || 'Extract failed')
    const json = JSON.stringify(res.data, null, 2)
    await navigator.clipboard.writeText(json)
    localStorage.setItem('gm_linkedin_extract', json)
    status.textContent = 'Copied. Paste into Glowminds → LinkedIn Sync → Import.'
    status.className = 'ok'
  } catch (err) {
    status.textContent = err.message || String(err)
    status.className = 'err'
  }
})
