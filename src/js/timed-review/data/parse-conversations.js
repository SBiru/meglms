
var fs = require('fs')
  , path = require('path')

var names = fs.readdirSync(__dirname + '/conversations').filter(function (name) {
  return name.slice(-4) === '.txt'
});

var conversations = names.map(function (name) {
  var text = fs.readFileSync(path.join(__dirname, 'conversations', name), 'utf8')
    , lines = text.split('\n')
    , title = lines.shift()
    , sections = []
    , section = null
  lines.forEach(function (line) {
    if (!line.trim().length) return
    var start = line[0]
      , line = line.slice(1).trim()
    if (start === '<') {
      if (!section) throw new Error('conversation must start with a prompt')
      section.answers.push(line)
    } else if (start === '>') {
      section = {prompt: line, answers: []}
      sections.push(section)
    } else if (start === '~') {
      section.audio = line
    }
  })
  return {
    title: title,
    dialog: sections,
  }
})

fs.writeFileSync(path.join(__dirname, 'conversations.json'), JSON.stringify(conversations, null, 4), {encoding: 'utf8'});

