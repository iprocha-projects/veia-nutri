const fs = require('fs')
const path = require('path')

const directoryPath = path.join(__dirname, 'src')

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f)
    let isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f))
  })
}

walk(directoryPath, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8')
    let original = content

    // Rebrand replacements
    content = content.replace(/rounded-2xl/g, 'rounded-lg')
    content = content.replace(/rounded-xl/g, 'rounded-lg')
    content = content.replace(/shadow-xl/g, '')
    content = content.replace(/shadow-md/g, '')
    content = content.replace(/shadow-sm/g, '')
    content = content.replace(/shadow/g, '')
    
    // Cleanup double spaces
    content = content.replace(/  +/g, ' ')

    if (original !== content) {
      fs.writeFileSync(filePath, content)
      console.log(`Updated: ${filePath}`)
    }
  }
})
