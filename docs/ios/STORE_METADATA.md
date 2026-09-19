# App Store Metadata Draft

Status: local draft only, blocked from sync or submission
Last updated: 2026-09-20

This draft describes only the four procedures and behavior present in the native
app. It has not been uploaded to App Store Connect. The support and privacy
pages are ready for publication on the existing product site. Rights holder,
screenshots, age-rating answers, privacy answers, and legal/export answers
remain approval gates.

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

- Primary category candidate: Medical
- Secondary category candidate: Education
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

These URLs must be checked on production after the accompanying Web commit is
deployed. They are not yet entered in App Store Connect.

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
| Support URL | Ready locally at `/support`; production verification is pending deployment |
| Privacy Policy URL | Ready locally at `/privacy`; production verification is pending deployment |
| Marketing URL | `https://the-commissure.vercel.app/` after production verification |
| Copyright | Rights holder and exact wording unconfirmed |
| Content rights | All four procedure rights records still require owner confirmation |
| App Privacy | Source scan suggests no collected data or tracking; final signed-binary and network audit required |
| Export compliance | Ed25519 verification and system transport are present; answer requires final binary/legal review |
| Screenshots | Must be captured from the exact approved release build after visual acceptance |
| App icon | Final AppIcon set is absent |
| Contact | App Review contact details are owner-controlled and unconfirmed |

The Fastlane metadata tree remains withheld until the factual rights and legal
fields are complete. The published URLs and contact address are no longer a
blocker once production verification succeeds.
