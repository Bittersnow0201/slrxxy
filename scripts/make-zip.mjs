import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { fileURLToPath } from 'url'
import archiver from 'archiver'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'dist')
const out = path.join(root, 'site.zip')

function walk(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, base, list)
    else list.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return list
}

if (!fs.existsSync(dist)) {
  console.error('dist/ 不存在，请先执行 npm run build')
  process.exit(1)
}

if (fs.existsSync(out)) fs.unlinkSync(out)

const output = createWriteStream(out)
const archive = archiver('zip', { zlib: { level: 9 } })

const done = new Promise((resolve, reject) => {
  output.on('close', () => resolve(archive.pointer()))
  archive.on('error', reject)
})

archive.pipe(output)

for (const file of walk(dist)) {
  archive.file(path.join(dist, file), { name: file })
}

await archive.finalize()
const bytes = await done
console.log(`OK site.zip (${bytes} bytes)`)
