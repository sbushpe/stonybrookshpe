function showChapterBylaws() {
    open("chapter-bylaws.html")
}

function showNationalSHPEsite() {
  open("https://www.shpe.org/")
}

function showMembershipPage() {
  open("https://www.shpe.org/membership")
}

let showOriginalGeuris = false;
function onClickGeuris() {
  let elemImg = document.getElementById('img_geuris')
  showOriginalGeuris = !showOriginalGeuris;
  if (showOriginalGeuris) {
    elemImg.src = './media/eboard-members/geuris.png'
  } else {
    elemImg.src = './media/eboard-members/geuris-german.png'
  }
}