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
  constructor() {
    this.showingGeuris = false
  }

  start = () => {
    this.renderEboardMembers()
    this.renderContactInfo()
  }

  onClickTreasurer = () => {
    let elemImg = document.getElementById('img_geuris')
    this.showingGeuris = !this.showingGeuris
    if (this.showingGeuris) {
      elemImg.src = './media/eboard-members/geuris.png'
    } else {
      elemImg.src = './media/eboard-members/geuris-german.png'
    }
  }

  renderEboardMembers = () => {
    let root = document.getElementById('eboard-members')
    if (!root) return
    eboardMembers.forEach(m => {
      let elem = this.initEboardMemberElem(m.src, m.title, m.name)
      root.appendChild(elem)
    })
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

  initEboardMemberElem = (src, title, name) => {
    const IMG_SIZE = 140
    let imgElem = document.createElement('img')
    if (title === 'Treasurer') {
      imgElem.id = 'img_geuris'
      imgElem.onclick = this.onClickTreasurer
    }
    imgElem.src = './media/eboard-members/' + src
    imgElem.width = IMG_SIZE
    imgElem.height = IMG_SIZE
    let eboardPosElem = document.createElement('h2')
    eboardPosElem.innerHTML = title
    let nameElem = document.createElement('h3')
    nameElem.innerHTML = name
    let root = document.createElement('div')
    root.classList.add('col-lg-4')
    root.appendChild(imgElem)
    root.appendChild(eboardPosElem)
    root.appendChild(nameElem)
    return root
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