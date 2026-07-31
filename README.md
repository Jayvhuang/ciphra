# Ciphra — Security & Privacy Toolkit

Free, bilingual (English / 中文) browser-based security tools. Everything runs **100% client-side** — no data is uploaded, no accounts, no tracking of your inputs.

**Live:** https://jayvhuang.github.io/ciphra/

## Tools

| Tool | What it does |
|------|--------------|
| Password Generator | Cryptographically secure random passwords (`crypto.getRandomValues`), configurable character sets, ambiguous-character exclusion |
| Passphrase Generator | Diceware-style memorable passphrases with separators and capitalization options |
| Password Strength Checker | Entropy estimate, crack-time approximation, actionable weaknesses |
| Text Encryptor | AES-256-GCM with PBKDF2 key derivation (Web Crypto API) |
| Hash Generator | SHA-256 / SHA-384 / SHA-512 (Web Crypto), plus MD5 and SHA-1 for legacy checksum verification |
| Random Generator | Random integers, decimals, bytes, hex, and UUIDv4 from the CSPRNG |
| Username Generator | Pronounceable, memorable usernames |
| TOTP Authenticator | RFC 6238 time-based one-time passwords for testing 2FA setups |

## Tech

Static site — plain HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no backend.

- Light / dark theme
- One-click EN ⇄ 中文 language switch
- SEO + GEO ready: canonical, hreflang, JSON-LD (WebSite / ItemList / Organization / FAQPage), `sitemap.xml`, `robots.txt`, `llms.txt`

## Local use

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Notes

- Monetization placeholders (Google AdSense Auto Ads script, Amazon Associates tag `ciphra-20`) are **inert** — the ad script is commented out and no real publisher ID is present.
- See `privacy.html` for the privacy policy.

## License

Source is provided as-is for reference.
