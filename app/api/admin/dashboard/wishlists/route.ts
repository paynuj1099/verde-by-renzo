import {
  adminFirestore,
  getAdminErrorResponse,
  verifyAdminRequest,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WishlistItem = {
  id: string | number;
  colors?: string[];
};

type WishlistResult = {
  ownerId: string;
  items: WishlistItem[];
};

function isWishlistResult(
  wishlist: WishlistResult | null,
): wishlist is WishlistResult {
  return wishlist !== null;
}

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);

    const usersSnapshot =
      await adminFirestore
        .collection("users")
        .get();

    const wishlists = await Promise.all(
      usersSnapshot.docs.map(
        async (
          userDoc,
        ): Promise<WishlistResult | null> => {
          const wishlistSnapshot =
            await userDoc.ref
              .collection("data")
              .doc("wishlist")
              .get();

          if (!wishlistSnapshot.exists) {
            return null;
          }

          const data =
            wishlistSnapshot.data();

          const rawItems =
            Array.isArray(data?.items)
              ? data.items
              : [];

          const items: WishlistItem[] =
            rawItems
              .filter(
                (
                  item: unknown,
                ): item is WishlistItem =>
                  Boolean(
                    item &&
                      typeof item ===
                        "object" &&
                      "id" in item &&
                      (
                        item as {
                          id?: unknown;
                        }
                      ).id !== undefined,
                  ),
              )
              .map((item) => {
                const colors =
                  Array.isArray(
                    item.colors,
                  )
                    ? item.colors.filter(
                        (
                          color:
                            unknown,
                        ): color is string =>
                          typeof color ===
                            "string" &&
                          color
                            .trim()
                            .length > 0,
                      )
                    : [];

                return {
                  id: item.id,
                  colors,
                };
              });

          return {
            ownerId:
              userDoc.id,
            items,
          };
        },
      ),
    );

    const validWishlists =
      wishlists.filter(
        isWishlistResult,
      );

    return Response.json({
      wishlists:
        validWishlists,
    });
  } catch (error) {
    return getAdminErrorResponse(
      error,
    );
  }
}