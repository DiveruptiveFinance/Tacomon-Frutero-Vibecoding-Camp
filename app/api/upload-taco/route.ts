import { NextRequest, NextResponse } from 'next/server'

const CF_ACCOUNT_ID = 'f546fc3c06437a0f40a100804e9d6103'
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
const BUCKET_NAME = 'dumbleclaw-assets'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const wallet = formData.get('wallet') as string | null

    if (!file || !wallet) {
      return NextResponse.json({ error: 'Missing file or wallet' }, { status: 400 })
    }

    const timestamp = Date.now()
    const key = `tacodex/${wallet.toLowerCase()}/${timestamp}.jpg`
    const bytes = await file.arrayBuffer()

    // Upload to R2 via Cloudflare API
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`
    
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': file.type || 'image/jpeg',
      },
      body: bytes,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('R2 upload failed:', text)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Construct public URL - using R2 public access
    const publicUrl = `https://pub-${CF_ACCOUNT_ID}.r2.dev/${key}`

    return NextResponse.json({ url: publicUrl, key })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
