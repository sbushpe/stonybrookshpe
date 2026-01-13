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

window.onload = () => {
  let app = new App()
  app.start()
}
