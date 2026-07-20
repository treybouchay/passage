import { Router } from 'express'
import multer from 'multer'
import { join } from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { insertDesign } from '../store.js'
import type { PrintDesign, PrintDesignMeta } from '../types.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(new Error('Only PNG uploads are supported'))
    }
  },
})

export const designsRouter = Router()

designsRouter.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Missing print image (PNG)' })
      return
    }

    const metaRaw = req.body.meta
    if (!metaRaw) {
      res.status(400).json({ error: 'Missing design metadata' })
      return
    }

    const meta = JSON.parse(metaRaw) as PrintDesignMeta
    if (!meta.passageId || !meta.reference || !meta.printSize || !meta.frameStyle) {
      res.status(400).json({ error: 'Invalid design metadata' })
      return
    }

    const id = uuidv4()
    const ext = '.png'
    const imageFilename = `${id}${ext}`
    const targetPath = join(config.uploadsDir, imageFilename)

    const { rename } = await import('node:fs/promises')
    await rename(req.file.path, targetPath)

    const design: PrintDesign = {
      id,
      ...meta,
      imageFilename,
      createdAt: Date.now(),
    }

    await insertDesign(design)
    res.status(201).json({ designId: id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    res.status(500).json({ error: message })
  }
})

designsRouter.get('/:id', async (req, res) => {
  const { getDesign } = await import('../store.js')
  const design = await getDesign(req.params.id)
  if (!design) {
    res.status(404).json({ error: 'Design not found' })
    return
  }
  res.json({
    id: design.id,
    passageId: design.passageId,
    reference: design.reference,
    printSize: design.printSize,
    frameStyle: design.frameStyle,
    createdAt: design.createdAt,
  })
})
