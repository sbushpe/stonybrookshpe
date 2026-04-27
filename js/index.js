import { eboardMembers } from "./eboard.js";

function showChapterBylaws() {
  open("chapter-bylaws.html")
}

function showNationalSHPEsite() {
  open("https://www.shpe.org/")
}

function showMembershipPage() {
  open("https://www.shpe.org/membership")
}

class App {
  start = () => {
    this.renderContactInfo()
  }

  renderContactInfo = () => {
    let root = document.getElementById('contact-info-section')
    if (!root) return
    eboardMembers.forEach(m => {
      if (m.email) {
        let elem = this.initContactElem(m.title, m.name, m.email)
        root.appendChild(elem)
      }
    })
  }

  initContactElem = (title, name, email) => {
    let nameElem = document.createElement('h6')
    nameElem.innerHTML = `${title} ${name}`
    let emailElem = document.createElement('a')
    emailElem.href = `mailto:${email}`
    emailElem.innerHTML = email
    let root = document.createElement('p')
    root.appendChild(nameElem)
    root.append(emailElem)
    return root
  }
}

function debugContactLayout() {
  try {
    return (
      localStorage.getItem('debugContactLayout') === '1' ||
      new URLSearchParams(window.location.search).has('debugContactLayout')
    )
  } catch {
    return false
  }
}

function applyShowcaseFormHeight(showcase, px) {
  const s = `${px}px`
  showcase.style.height = s
  showcase.style.minHeight = s
  showcase.style.maxHeight = s
}

function clearShowcaseFormHeight(showcase) {
  showcase.style.removeProperty('height')
  showcase.style.removeProperty('min-height')
  showcase.style.removeProperty('max-height')
  showcase.style.removeProperty('--contact-logo-showcase-height')
}

/** At lg+, match .contact-logo-showcase box to .contact-panel--form offsetHeight (triple height lock vs flex). */
function syncContactLogoShowcaseHeight() {
  if (!document.body.classList.contains('page-contact-us')) return

  const formPanel = document.querySelector('.contact-panel--form')
  const showcase = document.querySelector('.contact-logo-showcase')
  if (!formPanel || !showcase) return

  const wide = window.matchMedia('(min-width: 992px)').matches
  if (!wide) {
    clearShowcaseFormHeight(showcase)
    return
  }

  applyShowcaseFormHeight(showcase, formPanel.offsetHeight)

  if (debugContactLayout()) {
    console.debug('[contact layout]', {
      formOffsetHeight: formPanel.offsetHeight,
      showcaseOffsetHeight: showcase.offsetHeight
    })
  }
}

/** Re-sync after paint (fonts/layout); not used on every ResizeObserver tick. */
function scheduleContactLogoShowcaseAfterLayout() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => syncContactLogoShowcaseHeight())
  })
}

function initContactLogoShowcaseHeight() {
  if (!document.body.classList.contains('page-contact-us')) return

  const formPanel = document.querySelector('.contact-panel--form')
  const showcase = document.querySelector('.contact-logo-showcase')
  if (!formPanel || !showcase) return

  syncContactLogoShowcaseHeight()
  scheduleContactLogoShowcaseAfterLayout()

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => syncContactLogoShowcaseHeight()).observe(formPanel)
  }

  const mq = window.matchMedia('(min-width: 992px)')
  const onBreakpoint = () => {
    syncContactLogoShowcaseHeight()
    scheduleContactLogoShowcaseAfterLayout()
  }
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onBreakpoint)
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(onBreakpoint)
  }
}

function bootApp() {
  const app = new App()
  app.start()
  initContactLogoShowcaseHeight()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp, { once: true })
} else {
  bootApp()
}
