/**
 * One-time helper: get a Spotify refresh token for playlist sync.
 *
 * 1. Put SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in .env / server/.env
 * 2. In the Spotify Dashboard app, add Redirect URI: http://127.0.0.1:3847/callback
 * 3. Run: npm run sync:playlist:auth --prefix server
 * 4. Log in as the playlist owner/collaborator, then copy SPOTIFY_REFRESH_TOKEN
 *    into .env and/or GitHub Actions secrets.
 */

import { config as loadEnv } from 'dotenv'
import { createServer } from 'node:http'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
loadEnv({ path: resolve(repoRoot, '.env') })
loadEnv({ path: resolve(repoRoot, 'server/.env') })

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim() ?? ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim() ?? ''
const REDIRECT_URI = 'http://127.0.0.1:3847/callback'
const SCOPE = 'playlist-read-private playlist-read-collaborative'
const PORT = 3847

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env or server/.env first.',
  )
  process.exit(1)
}

const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
  }).toString()

console.info('Add this Redirect URI in your Spotify Dashboard app if needed:')
console.info(`  ${REDIRECT_URI}`)
console.info('')
console.info('Open this URL, log in as the playlist owner/collaborator:')
console.info(`  ${authUrl}`)
console.info('')
console.info(`Waiting for callback on ${REDIRECT_URI} …`)

const server = createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
    if (reqUrl.pathname !== '/callback') {
      res.writeHead(404).end('Not found')
      return
    }

    const err = reqUrl.searchParams.get('error')
    const code = reqUrl.searchParams.get('code')
    if (err || !code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Auth failed: ${err ?? 'no code'}`)
      console.error(`Auth failed: ${err ?? 'no code'}`)
      server.close()
      process.exit(1)
    }

    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    })

    const body = await tokenRes.text()
    if (!tokenRes.ok) {
      res.writeHead(500, { 'Content-Type': 'text/plain' }).end(body)
      console.error(`Token exchange failed (${tokenRes.status}): ${body}`)
      server.close()
      process.exit(1)
    }

    const data = JSON.parse(body) as { refresh_token?: string; access_token?: string }
    if (!data.refresh_token) {
      res.writeHead(500, { 'Content-Type': 'text/plain' }).end('No refresh_token in response')
      console.error('No refresh_token returned — try revoking app access and re-running.')
      server.close()
      process.exit(1)
    }

    const message = [
      'Success. Add this to .env / GitHub Actions secrets:',
      '',
      `SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`,
      '',
      'You can close this tab.',
    ].join('\n')

    res.writeHead(200, { 'Content-Type': 'text/plain' }).end(message)
    console.info('')
    console.info(message)
    server.close()
    process.exit(0)
  } catch (e) {
    console.error(e)
    res.writeHead(500).end('Error')
    server.close()
    process.exit(1)
  }
})

server.listen(PORT)
