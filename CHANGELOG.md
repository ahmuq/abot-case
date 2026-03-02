# Changelog

## [1.2.0](https://github.com/ahmuq/abot-case/compare/v1.1.0...v1.2.0) (2026-03-02)


### Features

* add blackbox ai ([6190fdc](https://github.com/ahmuq/abot-case/commit/6190fdc191d915110be94c90b881503b63ab4e45))
* add brat sticker ([2c20d90](https://github.com/ahmuq/abot-case/commit/2c20d90caf5c9f623588f71f6e41fd24324c33f1))
* add command handler to manage bot commands ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* add feature remini enchance image ([09cc675](https://github.com/ahmuq/abot-case/commit/09cc67513a7200bded87011df48eff73a9249ccd))
* add fiture gemini ai ([cdb576e](https://github.com/ahmuq/abot-case/commit/cdb576e28069c92ce45007f479eeae5cac1d5604))
* add fiture random waifu image send ([9c10281](https://github.com/ahmuq/abot-case/commit/9c10281f3795f617bbc807322cd224eaf2fc78c3))
* add helper functions for buffer fetching, time formatting, and random utilities ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* add Instagram download and story features; remove unused scraping functions ([afa1868](https://github.com/ahmuq/abot-case/commit/afa186867af47ef3f5d3fa8615b5cc72f4083da6))
* add main configuration file for Bagah Bot ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* add Pinterest image search functionality ([07aaeb5](https://github.com/ahmuq/abot-case/commit/07aaeb5de1b8e62844bd6e79bfca026a9f345f9f))
* add release workflow and configuration files; create changelog for version 2.0.0 ([36fc241](https://github.com/ahmuq/abot-case/commit/36fc2419e5371bebffb7781e47dbd722395536bb))
* add scraper utility for fetching images and quotes from various sources ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* create a database wrapper using SQLite to replace JSON files ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* create Exif class for media conversion and metadata handling ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* create logger utility for consistent terminal output ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* enhance configuration management and add .env.example template ([dc6aae3](https://github.com/ahmuq/abot-case/commit/dc6aae3b829006efb995d294117f75a86defcd5d))
* implement group event handler for join and leave actions ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* implement message serializer for easier message handling and response ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* implement SQL.js-backed storage adapter for authentication state ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* implement tiktokstalk command and API integration for TikTok us… ([79b8243](https://github.com/ahmuq/abot-case/commit/79b8243937c979378d418b721567b42683565faa))
* implement tiktokstalk command and API integration for TikTok user data ([cf771ff](https://github.com/ahmuq/abot-case/commit/cf771ff27fa9ba48333a1b3da89135110015efb5))
* implement uploader utility for file uploads to external services ([bf169ae](https://github.com/ahmuq/abot-case/commit/bf169ae1a00e6563011ddd0ddbcbb672a69ae94d))
* update connection logging messages for clarity ([b89dd9d](https://github.com/ahmuq/abot-case/commit/b89dd9de4bbd662d4e95ed86846942307570b2c2))
* update README.md with enhanced bot features and installation instructions ([ce02fa4](https://github.com/ahmuq/abot-case/commit/ce02fa4095696b3ab430cc49aefefd6d6efe9328))


### Bug Fixes

* return reply with null text for gemini and ai ([6ff303a](https://github.com/ahmuq/abot-case/commit/6ff303a70036f1a764cb5d827a05a1ad081e9928))
* twitter video downloader ([5ef6fe7](https://github.com/ahmuq/abot-case/commit/5ef6fe7d18decd82966743a29c71286ffeb974a4))

## [2.0.0](https://github.com/ahmuq/abot-case/releases/tag/v2.0.0) — Full Rewrite

### Fitur Baru

- Full rewrite CommonJS → ESM + OOP
- Baileys v7 RC dengan LID support
- SQLite session & database via sql.js
- Config via `.env`
- BagahProject API integration (bagahproject.com)
- Pairing code custom 8-digit
- Downloader: fbdl, igdl, igstory, ttnwm, ttmp3, couple
- Search: tiktokstalk
- Maker: sticker, toimg, tts, tourl
- Group: gc, promote, demote, kick, hidetag, tagall, antilink
- Owner: setppbot, addprem, delprem, listprem, son, soff
