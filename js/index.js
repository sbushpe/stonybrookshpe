function showChapterBylaws() {
    open("chapter-bylaws.html")
}

function showNationalSHPEsite() {
  open("https://www.shpe.org/")
}

function showMembershipPage() {
  open("https://www.shpe.org/membership")
}

let geurisClickCount = 0;
function onClickGeuris() {
  let elemImg = document.getElementById('img_geuris')
  geurisClickCount++
  if (geurisClickCount >= 10 && geurisClickCount <= 15) {
    elemImg.src = './media/eboard-members/geuris.png'
  }
  if (geurisClickCount >= 15) {
    elemImg.src = './media/eboard-members/geuris-german.png'
    geurisClickCount = 0
  }
}