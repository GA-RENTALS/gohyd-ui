# Public home page (`components/site`)

The home page used to be one 135 KB HTML file. It is now small React components plus typed data.

| Piece | Where | Edit this to change… |
|---|---|---|
| Page order | `app/(public)/page.tsx` | which sections appear and in what order |
| One section each | `sections/*.tsx` | the copy and layout of that section |
| Repeated items | `data/*.ts` (`plans`, `upcoming`, `map-places`, `credits`) | the 50 plan cards, 8 sample cards, 53 map pins, photo credits |
| Card layouts | `PlanCard`, `MapPlaceItem`, `CreditItem` | how one item looks |
| Shared bits | `Icon`, `SitePhoto`, `SiteSprite`, `SiteHeader`, `SiteFooter`, `types.ts` | icons, image loading, header and footer |

`SiteHeader` also contains the account avatar (`components/booking/AccountMenu.tsx`): "Sign in" when signed out, the customer's initial with a small menu when signed in.

## Things to know

- **Behaviour** (scroll reveal, map, filter chips, menu) lives in `components/initPage.ts` and `components/PageBehavior.tsx`. It finds elements by `id`, `class` and `data-*` attributes, so keep those names when editing markup.
- **Live content:** published Events with a future date fill the Events rail; published Events with no date yet fill the "Plan your next trip" section (`Plans.tsx`, category filter chips, rendered by `renderPlans` in `publicContent.ts`); published Trips populate the Upcoming rail; published destinations populate the map. `data/plans.ts` is no longer rendered on the homepage: it supplies fallback photos and the `/events/<slug>` fallback page while an Event is missing.
- **Keys:** lists use unique keys. The map list uses name plus coordinates (the `slug` field is a shared photo name, not unique).
- **Content origin:** the built-in content was extracted from the original page and is also stored in the database (`python manage.py import_frontend_content` in the backend). The long-term plan is to edit it in the admin and read it from the API.
- **How this refactor was verified:** the page was rendered before and after and the elements compared: identical.
