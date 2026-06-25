# TODO - Kirana Bazzar PDP Enhancements

- [ ] Update Product model in `lib/data.ts` to include dummy seller/e-card, multiple images, and videos.
- [ ] Implement real image carousel (dots + auto/manual) in `app/product/[id]/page.tsx` using the new product fields.
- [ ] Render 1+ video(s) on PDP when present (dummy URLs), with controls.
- [ ] Add seller name + e-card section on PDP (dummy text/image).
- [ ] Add Qty/variant + product detailed info section on PDP (use dummy where needed).
- [ ] Make PDP “Place Order” work by navigating to a new checkout page.
- [ ] Add `/checkout` page (`app/checkout/page.tsx`) with address form and cart summary.
- [ ] Update `app/cart/page.tsx` Place Order button to navigate to `/checkout`.
- [ ] Add styles in `app/globals.css` for carousel/video/e-card/checkout.
- [ ] Run dev server + basic manual testing: PDP slider, videos render, checkout address submit, order confirmation.

