// Serviço mínimo da pesquisa do Contábil: serve o formulário (GET /) e envia a
// resposta por e-mail via Resend (POST /enviar). Sem dependências — Bun puro.
const FORM_HTML = await Bun.file(new URL('./form.html', import.meta.url)).text()

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const RESEND_FROM = process.env.RESEND_FROM ?? 'Pesquisa Trama <nao-responder@trama.ac>'
const DESTINO = process.env.DESTINO_EMAIL ?? 'marcos@trama.ac'
const PORT = Number(process.env.PORT ?? 3000)

function esc(s: unknown): string {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
}

function corpoHtml(respondente: string, respostas: Record<string, unknown>): string {
  const blocos = Object.entries(respostas).map(([sec, val]) => {
    let inner: string
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      inner = '<table style="border-collapse:collapse;margin-top:4px">' +
        Object.entries(val as Record<string, unknown>).map(([k, v]) =>
          `<tr><td style="padding:2px 14px 2px 0;color:#665f57;vertical-align:top">${esc(k)}</td><td style="padding:2px 0;font-weight:600">${esc(v)}</td></tr>`).join('') +
        '</table>'
    } else if (Array.isArray(val)) {
      inner = `<div>${esc(val.map(String).join(', '))}</div>`
    } else {
      inner = `<div>${esc(val)}</div>`
    }
    return `<div style="margin:16px 0"><div style="font-weight:600;color:#3b6b52;margin-bottom:2px">${esc(sec)}</div>${inner}</div>`
  }).join('')
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:640px;color:#211f19;line-height:1.5">
    <h2 style="font-family:Georgia,serif;color:#3b6b52;margin:0 0 4px">Nova resposta — Formulário do Contábil</h2>
    <div style="color:#665f57;margin-bottom:18px">Respondente: <b style="color:#211f19">${esc(respondente)}</b></div>
    ${blocos}
    <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e3ddd0;color:#9c9588;font-size:13px">Enviado pela página de pesquisa da Trama.</div>
  </div>`
}

async function enviarEmail(respondente: string, respostas: Record<string, unknown>) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: DESTINO,
      subject: `Formulário do Contábil — resposta de ${respondente}`,
      html: corpoHtml(respondente, respostas)
    })
  })
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`)
  return (await r.json()).id as string
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      return new Response(FORM_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      return new Response('ok', { headers: { 'content-type': 'text/plain' } })
    }
    if (req.method === 'POST' && url.pathname === '/enviar') {
      try {
        const body = await req.json() as { respondente?: string; respostas?: Record<string, unknown> }
        const respondente = (body.respondente || 'Não identificado').toString().slice(0, 120)
        const respostas = body.respostas && typeof body.respostas === 'object' ? body.respostas : {}
        if (Object.keys(respostas).length === 0) {
          return Response.json({ ok: false, erro: 'sem respostas' }, { status: 400 })
        }
        const id = await enviarEmail(respondente, respostas)
        return Response.json({ ok: true, id })
      } catch (e) {
        console.error('[enviar] falhou:', e instanceof Error ? e.message : e)
        return Response.json({ ok: false, erro: 'falha ao enviar' }, { status: 500 })
      }
    }
    return new Response('Not found', { status: 404 })
  }
})

console.log(`pesquisa-contabil ouvindo em :${PORT}`)
