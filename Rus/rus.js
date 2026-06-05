const FontIf = localStorage.getItem('fontState') 
const backPhoto = localStorage.getItem('backPhoto') 
h = localStorage.getItem('colorH');
o = localStorage.getItem('colorO');
s = localStorage.getItem('colorS');
h2 = localStorage.getItem('colorH2');
o2 = localStorage.getItem('colorO2');
s2 = localStorage.getItem('colorS2');
function applyColors() {
    
document.body.style.background = `linear-gradient(45deg, hsl(${h}, ${o}%, ${s}%), hsl(${h2}, ${o2}%, ${s2}%))`
}


if (FontIf === 'true'){
    document.body.classList.add('rusFon')
}else{
    document.body.classList.remove('rusFon')
    
}
if (backPhoto === 'true'){
    document.body.classList.add('rusBack')
}else{
    document.body.classList.remove('rusBack')
  applyColors()
}
function Level(){
    window.location.href = '../test.html'
}