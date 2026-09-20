# App Store Metadata Draft

Status: English descriptive metadata, public URLs, category, age rating, medical-device declaration, review-email contact, and iPhone and iPad screenshots are saved in App Store Connect. The target declares exempt-only encryption use. Final legal attestation, copyright, review phone, and a build upload remain blocked.
Last updated: 2026-09-20

This draft describes only the four procedures and behavior present in the native
app. On 2026-09-20, the English promotional text, description, keywords, and
reviewer notes were saved in App Store Connect for version 1.0. The support and
privacy pages are ready for publication on the existing product site. Rights
holder, screenshots, age-rating answers, privacy answers, and legal/export
answers remain approval gates.

Planned first public version: `1.0.0` (build `1`).

## English

App name, 30-character limit:

> The Commissure

Subtitle, 30-character limit:

> Cervical Procedure Atlas

Promotional text:

> Study four cervical spine procedures through interactive 3D anatomy, reversible steps, bilingual explanations, and an offline learning path.

Description:

> The Commissure is an interactive 3D learning atlas for four cervical spine procedures:
>
> • Anterior Cervical Discectomy and Fusion (ACDF)
> • Anterior Cervical Corpectomy and Fusion (ACCF)
> • Posterior Cervical Decompression and Fusion (PCDF)
> • Posterior Cervical Foraminotomy (PCF)
>
> Explore each procedure as a sequence of reversible steps. Rotate and zoom the anatomy, move backward or directly between steps, and read the explanation in English or Japanese without losing your place.
>
> The four procedures are included for offline study. No account is required.
>
> Educational use only. The Commissure does not provide medical advice or replace supervised surgical training.

Keywords, 100-character limit:

> cervical spine,anatomy,ACDF,ACCF,PCDF,PCF,surgery,medical education,3D atlas

## Japanese

App name:

> The Commissure

Subtitle:

> 頸椎手術の3D学習アトラス

Promotional text:

> 4つの頸椎手術を、操作できる3D解剖、前後に戻れる手順、日英の解説、オフライン学習で確認できます。

Description:

> The Commissureは、次の4つの頸椎手術を学ぶためのインタラクティブな3Dアトラスです。
>
> • 前方頸椎椎間板切除固定術（ACDF）
> • 前方頸椎椎体切除固定術（ACCF）
> • 後方頸椎除圧固定術（PCDF）
> • 後方頸椎椎間孔拡大術（PCF）
>
> 各手術を、前後に戻ったり任意の段階へ移動したりできる一連の手順として確認できます。解剖モデルの回転と拡大、英語と日本語の切り替えができ、表示中の手順は言語を変えても維持されます。
>
> 4つの手術はオフライン学習用に収録されています。アカウント登録は不要です。
>
> 本アプリは教育目的です。患者ごとの医学的助言を提供するものではなく、指導医の監督下で行う手術訓練の代わりにはなりません。

Keywords:

> 頸椎,解剖,脊椎手術,医学教育,ACDF,ACCF,PCDF,PCF,3D,手術手順

## Category and age rating draft

- Primary category: Education
- Secondary category: None
- Medical or Treatment Information candidate answer: Frequent, because the
  entire app explains operative procedures rather than containing an isolated
  medical reference
- Expected Apple global result if Frequent is selected: 16+ on iOS 26-era
  systems and 17+ on earlier systems, subject to App Store Connect's complete
  questionnaire and regional results
- Made for Kids: No

Apple currently assigns age ratings from the complete questionnaire rather than
from a manually chosen number. Its definitions place frequent medical or
treatment information in the 16+ tier on current systems and the 17+ tier on
earlier systems. See [Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions).

Choosing Medical as a category or Frequent medical information also requires a
regulated-medical-device status declaration in supported regions. The intended
position is educational software, but the account holder must confirm the legal
answer in App Store Connect. See [Declare regulated medical device status](https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status).

## Public URLs and support contact

- Support URL: `https://the-commissure.vercel.app/support`
- Privacy Policy URL: `https://the-commissure.vercel.app/privacy`
- Marketing URL: `https://the-commissure.vercel.app/`
- Support contact: `vocabryreview@gmail.com`, temporarily shared with Vocabry
  at the owner’s direction on 2026-09-20. Replace it across the two Web pages
  and this document when the dedicated mailbox is available.

The URLs were deployed and returned HTTPS 200 on 2026-09-20. The Support URL,
Marketing URL, and Privacy Policy URL are now saved in App Store Connect.

## App Store Connect choices saved on 2026-09-20

- Subtitle: `Cervical Procedure Atlas`
- Primary category: Education
- Secondary category: None
- Age rating: 16+ in 173 countries or regions, with the expected regional
  variations. The questionnaire marks Medical or Treatment Information as
  Frequent and every unrelated feature or content type as absent.
- Regulated medical device: No. The app is a fixed educational atlas and does
  not diagnose, prevent, monitor, or treat a condition.
- App Privacy: Data Not Collected, based on the native source and privacy
  manifest audit. The final App Store Connect publish confirmation remains
  pending the account holder's legal attestation.
- Screenshots: Four iPhone 6.5-inch and four iPad 13-inch PNGs are uploaded in
  the order Library, interactive anatomy, explanation, and following step.
- Review contact: First and last name plus the owner-approved temporary review
  email are saved. The phone number remains unprovided.

## Reviewer notes draft

> The Commissure is an educational native SwiftUI and RealityKit app. It does not provide patient-specific advice and does not replace supervised surgical training. No login or demo account is required, and the four procedures are bundled for an offline reviewer path.
>
> From the Library, open ACDF, ACCF, PCDF, or PCF. In the Procedure Theater, drag the anatomy to orbit, pinch to zoom, and use the visible step controls to move backward, forward, or directly to a step. Change the language between English and Japanese to verify that the active procedure and step remain unchanged. The same navigation actions are available without relying on gesture shortcuts.
>
> The app contains fixed educational data and 3D assets. It does not download executable code or remote UI.

The final notes must be checked against the exact submitted build, VoiceOver
labels, visible control names, and actual remote-content configuration.

## Required fields still blocked

| Field | Current draft state |
|---|---|
| Support URL | Saved and verified at `https://the-commissure.vercel.app/support` |
| Privacy Policy URL | Saved and verified at `https://the-commissure.vercel.app/privacy` |
| Marketing URL | Saved as `https://the-commissure.vercel.app/` |
| Copyright | Saved as `© 2026 Shinya Yamaguchi` |
| Content rights | Saved in App Store Connect as no third-party content. Owner approval is recorded for the shipped assets. |
| App Privacy | Source scan suggests no collected data or tracking; final signed-binary and network audit required |
| Export compliance | `ITSAppUsesNonExemptEncryption` is `false` in the target Info.plist and the current signed IPA. |
| Screenshots | Four iPhone and four iPad images uploaded; exact candidate visual acceptance remains open |
| App icon | Final AppIcon set is absent |
| Contact | First name, last name, and temporary review email are saved; phone number is required |

The Fastlane metadata tree remains withheld until the factual rights and legal
fields are complete. The published URLs and contact address are no longer a
blocker once production verification succeeds.

## Pending attestations recorded from App Store Connect

App Store Connect currently records that the app does not contain, show, or
access third-party content. This must continue to match the ownership and
provenance of all shipped models, explanatory text, artwork, fonts, icons, and
store screenshots.

Copyright is saved for version 1.0 as `© 2026 Shinya Yamaguchi`, matching the
existing Vocabry public product attribution.

The target Info.plist now declares `ITSAppUsesNonExemptEncryption` as `false`.
The source uses Apple CryptoKit only for SHA-256 integrity checks and
Curve25519 signature verification, plus system `URLSession` transport. A new
signed IPA now carries this declaration. It is ready for an App Store Connect
upload and should not require export documentation for non-exempt encryption.

App Privacy remains at the final App Store Connect publication dialog. Its
Publish button represents that the account holder agrees the disclosures are
accurate, comply with the App Store Review Guidelines and applicable law, and
will be updated if data practices change.
