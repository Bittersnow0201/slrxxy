# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: keep Vite + React + TypeScript; restyle with native CSS tokens and Motion; self-host fonts for China access

## Users

Primary users are slr and xxy only. They open a private couple archive on phone or desktop, often in mainland China, to revisit shared memories.

## Product Purpose

A private two-person website that stores their together-day count, timeline moments, photos, and a letter. Success means the place feels intimate, calm, and worth returning to.

## Positioning

Not a social network or public landing page. It is a locked personal archive with a cinematic visit ritual (login, then intro video, then the rooms of memory).

## Capabilities

- Shared login gate
- Intro video on each visit after login, with skip
- Home with together-day counter
- Timeline of moments
- Photo gallery
- Letter page
- Mobile collaborative edit page (`/edit`) synced via Tencent CloudBase
- Local defaults in `src/data/content.ts` when cloud is unset

## Constraints

- Preserve routes and features listed above
- Preserve credentials and day-count logic
- China-reachable assets preferred (no Google Fonts CDN)
- Intimate spirit without default cream-terracotta craft palette
- Collaborative saves require `VITE_CLOUDBASE_ENV` (see `docs/CLOUDBASE.md`)
- Placeholder photos remain until real images are provided

## Brand Commitments

- Product name: slr和xxy的小宇宙
- People: slr, xxy
- Together since: 2026-02-21

## Evidence

Synthetic / placeholder timeline and photo captions until the owners replace them with real entries.
