/**
 * Hand-written response types for customer self-service endpoints
 * (`/api/favorites`, `/api/customers/me/*`).
 * Orval generates `customInstance<void>` so these describe the
 * `data` payload inside the `{ success, data }` envelope.
 */

/**
 * Response envelope. For paginated endpoints (`{items, total, ...}`),
 * the BE TransformInterceptor flattens to `data: T[]` + `meta.total`.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    page?: number;
    totalPages?: number;
  };
}

type DecimalLike = string | number;

interface NamedRef {
  id: string;
  name: string;
}

interface CodedRef extends NamedRef {
  code: string;
}

export interface MyNeed {
  id: string;
  purpose: string;
  zoneId: string | null;
  budgetMin: DecimalLike | null;
  budgetMax: DecimalLike | null;
  areaMin: DecimalLike | null;
  areaMax: DecimalLike | null;
  bedrooms: number | null;
  expectedTime: string | null;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  propertyType: (CodedRef & { group: string }) | null;
  province: CodedRef | null;
  district: CodedRef | null;
  ward: CodedRef | null;
}

export interface MyDeal {
  id: string;
  dealCode: string;
  transactionType: string;
  expectedValue: DecimalLike | null;
  finalValue: DecimalLike | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    propertyCode: string;
    title: string;
    slug: string | null;
    price: DecimalLike | null;
    priceUnit: string | null;
    businessStatus: string;
  } | null;
  salesUser: { id: string; fullName: string } | null;
}

export interface MyContact {
  id: string;
  userName: string | null;
  userPhone: string | null;
  userContent: string | null;
  status: string;
  createdAt: string;
  property: {
    id: string;
    propertyCode: string;
    title: string;
    slug: string | null;
  } | null;
}

export interface FavoriteItem {
  id: string;
  propertyId: string;
  createdAt: string;
  /** Full card payload — cast to `Property` for `PropertyCard`. */
  property: unknown;
}
