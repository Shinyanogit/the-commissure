# App Store申請直前までの作業計画

更新: 2026-09-20。ユーザー指示により、App Store申請までを現在の到達点とする。
UIの最新状態は `UI_REDESIGN_2026-09-19.md`、実際の審査準備状況は
`RELEASE_READINESS.md` と `APP_STORE_SUBMISSION_AUDIT_2026-09-20.md` を参照。
以下の9月12日の進捗・停止条件は当時の履歴であり、現在の完了証拠ではない。

## 到達点

`app-store-review` と Fastlane を使い、App Store の申請操作を行う直前まで
必要な実装・検証・提出物を揃える。単なる基盤実装で終了しない。
UIは暫定でもデザインコンセプトとWebの思想を守り、後の手直しが
`ViewState` / `AppAction` / session / scene / infrastructureの再設計に
波及しない構造にする。完成したUIや未実施の実機検証を装わない。

## 守る境界

- 作業は `codex/ios-functional-completion` 内。小さな確認済み単位で
  ローカルコミットを残す。
- 2026-09-20のユーザー指示により、既存The Commissure Webへ本アプリ専用の
  `/support` と `/privacy` を追加する。既存の手術画面・記事内容・3D runtimeは
  変更しない。
- FastlaneによるTestFlightとApp Store申請はユーザーから実行指示済みである。
  ただしApple契約の同意、アカウント所有確認、医学的妥当性、第三者素材の利用権は
  事実を確認してから入力する。存在しない承認や資格情報を作らない。
- Apple契約への同意、会費支払い、新規秘密鍵・APIアクセスの作成など、
  本人操作が必要な箇所は具体的な必要事項を示す。既存の設定を先に確認する。
- 週間使用量の**残量が100%へリセットされたことを検知したら即停止**する。
  監視は15秒間隔。作業途中でも完了と偽らず現状を保持する。

## 工程と現状

| 順序 | 作業 | 現在の確認状態 |
|---|---|---|
| 1 | 4術式のネイティブ機能 | 全26工程、実USDZ、可逆遷移、操作、保存、英日切替を実装。42 app +4 UI testsがSimulatorで成功 |
| 2 | 更新・配布基盤 | 署名検証、cache、候補の有効化とfallback、publication/release gateを実装。ローカルテスト成功。CDN本番往復は未実施 |
| 3 | Apple既存登録・署名の確認 | 開発用証明書と4件のprofileを発見。App Store配布権限・本アプリのprofileは未確認 |
| 4 | 実機と障害系検証 | 初回実機buildはteam指定の問題で失敗。正しい証明書OUを使って再評価する。floor iOS18端末・長時間性能試験は未実施 |
| 5 | 審査用コンテンツ | 英日metadata草案あり。医学的妥当性・資産権利のowner確認は4術式とも未完 |
| 6 | プライバシー／サポート | privacy manifestあり。既存The Commissure Webに `/support` と `/privacy` を実装済み。production deployとURL確認が残る |
| 7 | 最終候補 | 最終UI・アイコン、実画面の英日iPhone/iPad画像、署名済みIPA、App Thinning、accessibility、privacy reportを揃える |
| 8 | 申請直前確認 | 正確な候補IPAと証跡を結び付けてapp-store-reviewを実施。Fastlaneから申請できる設定を検証し、実申請前で止める |

## 署名調査の訂正

最初の実機試行では、Apple Development証明書CN末尾の識別子をteamとして
渡してしまった。実際のTeam IDは証明書subjectのOUで確認する必要がある。
開発用証明書の存在と、有効なApp Store配布資格・distribution profileの存在は
別である。従って「Apple登録がない」とはまだ断定しない。
証明書やprofileの秘密情報をGitに保存しない。

## 登録とサイト

App Store配布にはApple Developer Program、App Store Connectのアプリ記録、
Bundle IDと配布用署名設定が必要。公開のprivacy policyとsupport URLも揃える。
新しいサービスへの登録が常に必要という意味ではなく、既存アカウント・
既存の公開領域を調査した後、既存The Commissure Web上の専用ページを
公開URLとして使う。

一次資料（2026-09-12参照）:
- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect: Add a new app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Required-reason APIs](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)

技術実装と試験の詳細は `IMPLEMENTATION_STATUS.md`、候補ごとの未完条件は
`RELEASE_READINESS.md`、提出文面は `STORE_METADATA.md` を参照。
独立レビュー中の実装はレビュー終了まで固定し、証跡の訂正は別に記録する。

## サポートサイト方針の追記

既存 `https://shinyanogit.github.io/` はCV用途として維持する。The Commissureは
既存の製品サイト `https://the-commissure.vercel.app` に `/support` と `/privacy` を
設け、各ページに実際の連絡先を載せる。2026-09-20時点では、所有者の指示で
`vocabryreview@gmail.com` を暫定的に使用する。
[Apple: Support URL要件](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)

ローカルに有効期限内のwildcard開発profileと既存2アプリのStore profileを確認。
既存Apple登録を活用できる可能性があるため、新規登録を前提にせず調査する。

## 最新の優先順位と停止時点（16:42 JST）

ユーザーは暫定UIを不採用とし、**Web版UIの忠実な再現をまず行い、そこから
微調整する**方針を明示した。機能基盤を保持し、配置・文字・余白・説明パネル・
工程操作をWeb実画面に基づいて作り直す。App Store準備の前にこのUI基準を揃える。
週間残量約2%のため、ユーザー指示で新規実装を止めてdocs・ローカルcommitへ
移行した。今回、残量100%へのリセットは未検出。
