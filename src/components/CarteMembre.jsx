import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { texteQRCarte, PRIX_CARTE_FCFA, formatMontant } from '../data.js'

// Carte de membre numérique : ce que le membre voit sur le site, et ce
// qu'il télécharge en image PNG (même contenu). Pas de photo sur la carte
// (décision du bureau, novembre 2026) : nom, numéro de carte et QR code.
// Le QR code regroupe le nom et le numéro du membre.
const LARGEUR = 1000
const HAUTEUR = 630
const BLEU_FONCE = '#0a2347'
const BLEU = '#12407f'
const OR = '#e3b02e'

function arrondir(ctx, x, y, l, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + l, y, x + l, y + h, r)
  ctx.arcTo(x + l, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + l, y, r)
  ctx.closePath()
}

function chargerImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export default function CarteMembre({ membre }) {
  const [qrUrl, setQrUrl] = useState('')
  const [telechargement, setTelechargement] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    QRCode.toDataURL(texteQRCarte(membre), {
      width: 220,
      margin: 1,
      color: { dark: BLEU_FONCE, light: '#ffffff' }
    })
      .then((url) => {
        if (actif) setQrUrl(url)
      })
      .catch(() => {
        if (actif) setErreur('QR code indisponible.')
      })
    return () => {
      actif = false
    }
  }, [membre])

  const telecharger = async () => {
    setErreur('')
    setTelechargement(true)
    try {
      const qr = await QRCode.toDataURL(texteQRCarte(membre), {
        width: 220,
        margin: 1,
        color: { dark: BLEU_FONCE, light: '#ffffff' }
      })
      const qrImage = await chargerImage(qr)
      const logo = await chargerImage('/Logo_AERD_UAM.png')
      const canvas = document.createElement('canvas')
      canvas.width = LARGEUR
      canvas.height = HAUTEUR
      const ctx = canvas.getContext('2d')
      // Fond bleu, coins arrondis, bordure or.
      arrondir(ctx, 0, 0, LARGEUR, HAUTEUR, 36)
      ctx.fillStyle = BLEU_FONCE
      ctx.fill()
      ctx.lineWidth = 8
      ctx.strokeStyle = OR
      arrondir(ctx, 8, 8, LARGEUR - 16, HAUTEUR - 16, 30)
      ctx.stroke()
      // Bande or sous l'en-tête.
      ctx.fillStyle = OR
      ctx.fillRect(60, 148, LARGEUR - 120, 4)
      // Logo dans un rond blanc.
      if (logo) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(118, 92, 52, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.clip()
        ctx.drawImage(logo, 66, 40, 104, 104)
        ctx.restore()
      }
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'alphabetic'
      ctx.font = '800 46px Arial, sans-serif'
      ctx.fillText('AERD / UAM', 196, 88)
      ctx.font = '400 21px Arial, sans-serif'
      ctx.fillStyle = '#c9d8f2'
      ctx.fillText('Amicale des Étudiants Ressortissants de Diourbel', 196, 122)
      // Titre de la carte.
      ctx.font = '800 42px Arial, sans-serif'
      ctx.fillStyle = OR
      ctx.fillText('CARTE DE MEMBRE', 60, 218)
      // Nom et numéro.
      ctx.font = '800 56px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(membre.prenom + ' ' + membre.nom, 60, 310)
      ctx.font = '800 38px Arial, sans-serif'
      ctx.fillStyle = OR
      ctx.fillText('N° ' + membre.numero_carte, 60, 372)
      // Pied de carte.
      ctx.font = '400 22px Arial, sans-serif'
      ctx.fillStyle = '#c9d8f2'
      ctx.fillText('UAM Diamniadio', 60, 566)
      ctx.fillText('Membre de l’AERD', 60, 596)
      // QR code dans un carré blanc.
      if (qrImage) {
        ctx.save()
        arrondir(ctx, LARGEUR - 280, HAUTEUR - 280, 220, 220, 16)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.clip()
        ctx.drawImage(qrImage, LARGEUR - 280, HAUTEUR - 280, 220, 220)
        ctx.restore()
      }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Impossible de créer l’image.')
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = 'carte-membre-' + membre.numero_carte + '.png'
      document.body.appendChild(lien)
      lien.click()
      lien.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setErreur(e.message || 'Impossible de télécharger la carte.')
    } finally {
      setTelechargement(false)
    }
  }

  return (
    <div>
      <div className="carte-membre">
        <div className="cm-entete">
          <img className="cm-logo" src="/Logo_AERD_UAM.png" alt="Logo de l'AERD/UAM" />
          <div>
            <div className="cm-nom-site">AERD / UAM</div>
            <div className="cm-sous-titre">Amicale des Étudiants Ressortissants de Diourbel</div>
          </div>
        </div>
        <div className="cm-titre">Carte de membre</div>
        <div className="cm-nom">
          {membre.prenom} {membre.nom}
        </div>
        <div className="cm-numero">N° {membre.numero_carte}</div>
        <div className="cm-pied">
          <div className="cm-bas">
            UAM Diamniadio
            <br />
            Membre de l’AERD
          </div>
          {qrUrl ? (
            <div className="cm-qr">
              <img src={qrUrl} alt={'QR code de la carte de ' + membre.prenom + ' ' + membre.nom} />
            </div>
          ) : (
            <div className="cm-qr cm-qr-vide">QR…</div>
          )}
        </div>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="actions" style={{ marginTop: 14 }}>
        <button type="button" className="bouton bouton-plein" onClick={telecharger} disabled={telechargement}>
          {telechargement ? 'Préparation…' : 'Télécharger ma carte (image)'}
        </button>
      </div>
      <p className="aide">
        Garde ta carte sur ton téléphone ou imprime-la. Le QR code regroupe ton nom et ton numéro de membre (
        {membre.numero_carte}). Carte payée : {formatMontant(PRIX_CARTE_FCFA)}.
      </p>
    </div>
  )
}
